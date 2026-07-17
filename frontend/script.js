document.addEventListener('DOMContentLoaded', () => {
    const processBtn = document.getElementById('process-btn');
    const videoInput = document.getElementById('video-url');
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    const videoEmbed = document.getElementById('video-embed');
    const chunkBadge = document.getElementById('chunk-badge');
    
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    const sourceExpander = document.getElementById('source-expander');
    const sourceContent = document.getElementById('source-content');


    processBtn.addEventListener('click', async () => {
        const rawUrl = videoInput.value.trim();
        if (!rawUrl) return alert("Please enter a Video ID or URL!");

        let videoId = rawUrl;
        if (rawUrl.includes("v=")) {
            videoId = rawUrl.split("v=")[1].split("&")[0];
        } else if (rawUrl.includes("youtu.be/")) {
            videoId = rawUrl.split("youtu.be/")[1].split("?")[0];
        }

        statusText.textContent = "Indexing Transcript...";
        if (statusDot) statusDot.classList.remove('active');
        processBtn.disabled = true;

        try {
            const res = await fetch('http://localhost:8000/index-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_id: videoId })
            });
            
            const data = await res.json();

            if (res.ok && data.status === "success") {
                statusText.textContent = `Ready (${videoId})`;
                if (statusDot) statusDot.classList.add('active');
                
                videoEmbed.src = `https://www.youtube.com/embed/${videoId}`;
                videoEmbed.hidden = false;

                chunkBadge.textContent = `${data.chunks} Chunks Indexed`;
                chunkBadge.classList.remove('hidden');

                userInput.disabled = false;
                sendBtn.disabled = false;
                appendMessage("system-msg", `Video indexed successfully! Ask a question below.`);
            } else {
                statusText.textContent = `Error: ${data.detail || 'Could not index video'}`;
            }
        } catch (error) {
            statusText.textContent = "Status: Error connecting to backend.";
            console.error(error);
        } finally {
            processBtn.disabled = false;
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = userInput.value.trim();
        if (!question) return;

        appendMessage("user-msg", question);
        userInput.value = "";
        userInput.disabled = true;
        sendBtn.disabled = true;

        try {
            const res = await fetch('http://localhost:8000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question })
            });
            
            const data = await res.json();

            if (res.ok && data.status === "success") {
                const finalAnswer = (data.answer && data.answer.trim() !== "") 
                    ? data.answer 
                    : "⚠️ Error: The AI returned an empty response. Try rephrasing your question.";
                
                appendMessage("ai-msg", finalAnswer);

                if (data.sources && data.sources.length > 0) {
                    sourceContent.innerHTML = data.sources.map(s => `<p style="margin-bottom: 8px;">📑 ${s}</p>`).join("");
                    sourceExpander.classList.remove('hidden');
                }
            } else {
                appendMessage("system-msg", `Error: ${data.detail || 'Failed to get answer.'}`);
            }
        } catch (error) {
            appendMessage("system-msg", "Error: Could not reach the backend server.");
            console.error(error);
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    });

    function appendMessage(className, text) {
        const div = document.createElement('div');
        div.className = `message ${className}`;
        
        if (className === "ai-msg") {
            let formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            div.innerHTML = formattedText;
        } else {
            div.textContent = text;
        }
        
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight; 
    }
});