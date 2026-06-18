const API_BASE_URL = 'http://localhost:9091/v1';
const STORAGE_KEY = 'llm_chat_data';

let state = {
    sessions: [],
    currentSessionId: null,
    isLoading: false
};

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.sessions = parsed.sessions || [];
            state.currentSessionId = parsed.currentSessionId || null;
        } catch (e) {
            state.sessions = [];
            state.currentSessionId = null;
        }
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId
    }));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast';
    }, 2500);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createNewSession() {
    const session = {
        id: generateId(),
        title: '新会话',
        messages: [],
        createdAt: Date.now()
    };
    state.sessions.unshift(session);
    state.currentSessionId = session.id;
    saveState();
    renderSessionList();
    renderMessages();
    updateChatHeader();
    document.getElementById('messageInput').focus();
    return session;
}

function deleteSession(sessionId) {
    if (!confirm('确定要删除这个会话吗？')) return;
    const index = state.sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
        state.sessions.splice(index, 1);
        if (state.currentSessionId === sessionId) {
            state.currentSessionId = state.sessions.length > 0 ? state.sessions[0].id : null;
        }
        saveState();
        renderSessionList();
        renderMessages();
        updateChatHeader();
        showToast('会话已删除', 'success');
    }
}

function selectSession(sessionId) {
    state.currentSessionId = sessionId;
    saveState();
    renderSessionList();
    renderMessages();
    updateChatHeader();
}

function getCurrentSession() {
    return state.sessions.find(s => s.id === state.currentSessionId);
}

function updateChatHeader() {
    const header = document.querySelector('.chat-title');
    const deleteBtn = document.getElementById('deleteSessionBtn');
    const session = getCurrentSession();
    if (session) {
        header.textContent = session.title;
        deleteBtn.style.display = 'block';
    } else {
        header.textContent = '选择或创建一个会话开始聊天';
        deleteBtn.style.display = 'none';
    }
}

function renderSessionList() {
    const container = document.getElementById('sessionList');
    container.innerHTML = '';

    if (state.sessions.length === 0) {
        container.innerHTML = '<div style="padding: 16px; color: #888; font-size: 13px; text-align: center;">暂无会话</div>';
        return;
    }

    state.sessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'session-item' + (session.id === state.currentSessionId ? ' active' : '');
        item.onclick = (e) => {
            if (!e.target.classList.contains('session-delete')) {
                selectSession(session.id);
            }
        };

        const title = document.createElement('span');
        title.className = 'session-title';
        title.textContent = session.title;
        title.title = session.title;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'session-delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = '删除会话';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteSession(session.id);
        };

        item.appendChild(title);
        item.appendChild(deleteBtn);
        container.appendChild(item);
    });
}

function renderMessages() {
    const container = document.getElementById('messagesContainer');
    const session = getCurrentSession();

    container.innerHTML = '';

    if (!session) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">选择左侧会话或点击"新会话"开始聊天</div>
            </div>
        `;
        return;
    }

    if (session.messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🤖</div>
                <div class="empty-state-text">开始对话吧！</div>
            </div>
        `;
        return;
    }

    session.messages.forEach((msg, index) => {
        const msgEl = createMessageElement(msg, index);
        container.appendChild(msgEl);
    });

    container.scrollTop = container.scrollHeight;
}

function createMessageElement(msg, index) {
    const div = document.createElement('div');
    div.className = 'message ' + msg.role;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = msg.role === 'user' ? '我' : 'AI';

    const contentWrapper = document.createElement('div');
    contentWrapper.style.position = 'relative';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = msg.content;

    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-msg-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = () => deleteMessage(index);

    actions.appendChild(deleteBtn);
    contentWrapper.appendChild(content);
    contentWrapper.appendChild(actions);

    div.appendChild(avatar);
    div.appendChild(contentWrapper);

    return div;
}

function deleteMessage(index) {
    const session = getCurrentSession();
    if (!session) return;
    if (!confirm('确定要删除这条消息吗？')) return;

    session.messages.splice(index, 1);
    if (session.messages.length === 0) {
        session.title = '新会话';
    } else if (index === 0 && session.messages.length > 0) {
        session.title = session.messages[0].content.slice(0, 30);
    }
    saveState();
    renderSessionList();
    renderMessages();
    updateChatHeader();
    showToast('消息已删除', 'success');
}

function createTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';

    const content = document.createElement('div');
    content.className = 'typing-indicator';
    content.innerHTML = '<span></span><span></span><span></span>';

    div.appendChild(avatar);
    div.appendChild(content);
    return div;
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    if (state.isLoading) return;

    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content) {
        showToast('请输入消息内容', 'error');
        return;
    }

    let session = getCurrentSession();
    if (!session) {
        session = createNewSession();
    }

    const userMessage = {
        id: generateId(),
        role: 'user',
        content: content,
        timestamp: Date.now()
    };

    session.messages.push(userMessage);

    if (session.messages.length === 1) {
        session.title = content.slice(0, 30);
    }

    saveState();
    renderSessionList();
    renderMessages();
    updateChatHeader();

    input.value = '';
    input.style.height = 'auto';

    state.isLoading = true;
    document.getElementById('sendBtn').disabled = true;

    const container = document.getElementById('messagesContainer');
    const typingIndicator = createTypingIndicator();
    container.appendChild(typingIndicator);
    scrollToBottom();

    try {
        const messages = session.messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        const response = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                stream: false,
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const assistantContent = data.choices[0].message.content || '(空回复)';
            const assistantMessage = {
                id: generateId(),
                role: 'assistant',
                content: assistantContent,
                timestamp: Date.now()
            };
            session.messages.push(assistantMessage);
            saveState();
        } else {
            throw new Error('无效的响应格式');
        }

    } catch (error) {
        console.error('API Error:', error);
        const errorMessage = {
            id: generateId(),
            role: 'assistant',
            content: `错误: ${error.message}\n\n请确认 LLM 服务已启动 (运行 run_qwen_9091.bat)`,
            timestamp: Date.now()
        };
        session.messages.push(errorMessage);
        saveState();
        showToast('请求失败，请检查服务是否启动', 'error');
    } finally {
        state.isLoading = false;
        document.getElementById('sendBtn').disabled = false;
        renderMessages();
    }
}

function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function initEventListeners() {
    document.getElementById('newChatBtn').onclick = createNewSession;

    document.getElementById('deleteSessionBtn').onclick = () => {
        const session = getCurrentSession();
        if (session) {
            deleteSession(session.id);
        }
    };

    document.getElementById('sendBtn').onclick = sendMessage;

    const input = document.getElementById('messageInput');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    input.addEventListener('input', autoResizeTextarea);
}

function init() {
    loadState();
    initEventListeners();
    renderSessionList();
    renderMessages();
    updateChatHeader();

    if (state.sessions.length === 0) {
        createNewSession();
    }
}

document.addEventListener('DOMContentLoaded', init);
