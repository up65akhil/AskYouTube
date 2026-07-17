# 📺 AskYouTube: AI Context Assistant (RAGTube)

An interactive Retrieval-Augmented Generation (RAG) web application that transforms any YouTube video into a live chat stream. Built with FastAPI, LangChain, FAISS, and Google Gemini, this tool indexes video transcripts in seconds and delivers precise, context-aware answers inside an authentic YouTube Dark Mode interface.

---

## ✨ Key Features

* **⚡ Instant Video Indexing:** Paste any YouTube URL or video ID to dynamically fetch and chunk text transcripts using `youtube-transcript-api`.
* **🧠 Advanced RAG Pipeline:** Uses HuggingFace local embeddings (`all-MiniLM-L6-v2`) and an in-memory FAISS vector database for blazing-fast semantic search.
* **🤖 Powered by Google Gemini:** Integrates Google's `gemini-2.5-flash-lite` model for high-speed reasoning and accurate conversational summaries without hitting strict free-tier quota limits.
* **🎨 Authentic YouTube Dark UI:** Designed from the ground up to mirror YouTube Live Chat, featuring pill buttons, neon live-status indicators, custom CSS username badges, and smooth scrollbar auto-locking.
* **📑 Source Inspection:** An interactive accordion lets developers and users inspect the exact transcript chunks retrieved from the vector database for every answer.
* **🛡️ Zero-Censorship & Fallback Safeguards:** Configured with custom safety settings and whitespace validators to prevent blank or silently blocked chat responses.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, Custom CSS3 (YouTube Dark Theme), Vanilla JavaScript (Fetch API)
* **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic
* **AI & Orchestration:** LangChain, Google Generative AI (`gemini-2.5-flash-lite`), HuggingFace Sentence Transformers
* **Vector Database:** FAISS (Facebook AI Similarity Search - CPU)

---

## 📂 Project Structure

```text
├── frontend/
│   ├── index.html       # YouTube Live Chat UI blueprint
│   ├── style.css        # Dark mode styling, glowing badges & flexbox fixes
│   └── script.js        # Frontend API client & markdown text formatter
├── app.py               # FastAPI server & LangChain RAG pipeline
├── requirements.txt     # Locked Python package dependencies
├── .env                 # Hidden API keys (Not tracked in Git)
├── .gitignore           # Security and cache exclusion rules
└── .gitattributes       # Forces GitHub to classify repo as 100% Python
```

## 💻 Running the Application
* Start the FastAPI backend server with auto-reload enabled:

* uvicorn app:app --port 8000 --reload
* Open your web browser and navigate to:

* http://localhost:8000
(Or double-click frontend/index.html to run the UI directly)

* Paste a YouTube URL (e.g., https://www.youtube.com/watch?v=Gfr50f6ZBvo), click Connect Transcript, and start chatting with the AI!
