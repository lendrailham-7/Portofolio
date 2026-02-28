const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        observer.observe(card);
    });
    
    if (cards[0]) {
        setTimeout(() => {
            cards[0].classList.add('visible');
        }, 100);
    }
    
    initChatWidget();
});


function initChatWidget() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');
    const notifBadge = document.getElementById('notif-badge');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    
    let isOpen = false;
    let messageCount = 0;
    
    // Toggle chat window
    function toggleChat() {
        isOpen = !isOpen;
        chatWindow.classList.toggle('active', isOpen);
        
        if (isOpen) {
            notifBadge.style.display = 'none';
            chatInput.focus();
        }
    }
    
    // Close chat
    function closeChat() {
        isOpen = false;
        chatWindow.classList.remove('active');
    }
    
    // Add message to chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const time = new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <p>${escapeHtml(text)}</p>
                <span class="message-time">${time}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        messageCount++;
    }
    
    // Send message
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        // Add user message
        addMessage(text, true);
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Call API
        try {
            const res = await fetch(`/api/chat?prompt=${encodeURIComponent(text)}`);
            const json = await res.json();
            
            let content = json?.message?.content ?? "Maaf, saya tidak mengerti.";
            
            try {
                const parsed = JSON.parse(content);
                if (parsed && parsed.answer) content = parsed.answer;
            } catch (_) {}
            
            // Remove typing indicator and add response
            removeTypingIndicator();
            setTimeout(() => addMessage(content), 500);
            
        } catch (err) {
            removeTypingIndicator();
            addMessage("Maaf, server sedang bermasalah. Coba lagi nanti.");
            console.log(err);
        }
    }
    
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p><i class="fas fa-circle" style="font-size: 8px; animation: blink 1s infinite;"></i>
                   <i class="fas fa-circle" style="font-size: 8px; animation: blink 1s infinite 0.2s;"></i>
                   <i class="fas fa-circle" style="font-size: 8px; animation: blink 1s infinite 0.4s;"></i></p>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
  
    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', closeChat);
    
    chatSend.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.dataset.text;
            sendMessage();
        });
    });
    
    document.addEventListener('click', (e) => {
        if (isOpen && !chatWindow.contains(e.target) && !chatToggle.contains(e.target)) {
            closeChat();
        }
    });
}


const el = (id) => document.getElementById(id);

const nameEl = el("name");
const roleEl = el("role");
const bioEl = el("bio");
const linksEl = el("links");
const skillsEl = el("skills");

const form = el("guestbook-form");
const gbName = el("gb-name");
const gbMessage = el("gb-message");
const messagesList = el("messages-list");

function renderLinks(links) {
  linksEl.innerHTML = "";
  links.forEach((item) => {
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.className = "link-item";
    if (item.icon) {
      const icon = document.createElement("i");
      icon.className = `link-icon ${item.icon}`;
      icon.setAttribute("aria-hidden", "true");
      a.appendChild(icon);
    }
    const label = document.createElement("span");
    label.textContent = item.title;
    a.appendChild(label);
    linksEl.appendChild(a);
  });
}

function renderSkills(skills) {
  skillsEl.innerHTML = "";
  skills.forEach((s) => {
    const div = document.createElement("div");
    div.className = "chip";
    div.textContent = s.level ? `${s.name} (${s.level})` : s.name;
    skillsEl.appendChild(div);
  });
}

function renderMessages(messages) {
  messagesList.innerHTML = "";
  messages.slice().reverse().forEach((m) => {
    const card = document.createElement("div");
    card.className = "message-card";

    const who = document.createElement("p");
    who.className = "who";
    who.textContent = m.name;

    const text = document.createElement("p");
    text.className = "text";
    text.textContent = m.message;

    card.appendChild(who);
    card.appendChild(text);
    messagesList.appendChild(card);
  });
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile");
    const json = await res.json();

    const p = json?.data?.profile;
    if (p) {
      nameEl.textContent = p.name || "Nama Kamu";
      roleEl.textContent = p.role || "";
      bioEl.textContent = p.bio || "";
    }

    const links = json?.data?.links || [];
    const skills = json?.data?.skills || [];

    renderLinks(links);
    renderSkills(skills);
  } catch (err) {
    console.log("Gagal load profile:", err);
  }
}

async function loadGuestbook() {
  try {
    const res = await fetch("/api/guestbook");
    const json = await res.json();
    renderMessages(json.data || []);
  } catch (err) {
    console.log("Gagal load guestbook:", err);
  }
}

async function submitGuestbook(e) {
  e.preventDefault();

  const name = gbName.value.trim();
  const message = gbMessage.value.trim();
  if (!name || !message) return;

  try {
    const res = await fetch("/api/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message }),
    });

    const json = await res.json();
    if (json.status === "success") {
      gbName.value = "";
      gbMessage.value = "";
      await loadGuestbook();
    }
  } catch (err) {
    console.log("Gagal kirim pesan:", err);
  }
}

form.addEventListener("submit", submitGuestbook);

loadProfile();
loadGuestbook();