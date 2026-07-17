import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_state = {
    "vector_store": None,
    "rag_chain": None,
    "chunks_count": 0
}

class VideoRequest(BaseModel):
    video_id: str

class QuestionRequest(BaseModel):
    question: str

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

@app.post("/index-video")
async def index_video(req: VideoRequest):
    try:
        y = YouTubeTranscriptApi()
        transcript_list = y.fetch(
            req.video_id, languages=["en", "en-US", "en-GB", "hi"]
        )
        transcript = " ".join(
            chunk["text"] if isinstance(chunk, dict) else chunk.text 
            for chunk in transcript_list
        )
    except TranscriptsDisabled:
        raise HTTPException(status_code=400, detail="No captions available for this video.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transcript: {str(e)}")

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.create_documents([transcript])
    
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(chunks, embeddings)
    
    retriever = vector_store.as_retriever(search_kwargs={"k": 4})

    prompt_template = """
    You are a helpful assistant answering questions based on a YouTube video transcript.
    Use only the following context to answer the question. If you don't know the answer from the context, say you don't know.
    Context:
    {context}
    Question: {question}

    Answer:
    """
    prompt = PromptTemplate.from_template(prompt_template)
    llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", temperature=0)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()} 
        | prompt 
        | llm 
        | StrOutputParser()
    )

    app_state["vector_store"] = vector_store
    app_state["rag_chain"] = rag_chain
    app_state["chunks_count"] = len(chunks)

    return {"status": "success", "chunks": len(chunks)}

@app.post("/ask")
async def ask_question(req: QuestionRequest):
    if not app_state["rag_chain"] or not app_state["vector_store"]:
        raise HTTPException(status_code=400, detail="Please process a video first.")

    try:
        answer = app_state["rag_chain"].invoke(req.question)
        
        retriever = app_state["vector_store"].as_retriever(search_kwargs={"k": 4})
        source_docs = retriever.invoke(req.question)
        sources = [f"Chunk {i+1}: {doc.page_content[:150]}..." for i, doc in enumerate(source_docs)]

        return {
            "status": "success",
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")