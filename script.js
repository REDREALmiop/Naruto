(function () {
  const dom = {
    loginSection: document.querySelector('#login-section'),
    loginForm: document.querySelector('#login-form'),
    loginError: document.querySelector('#login-error'),
    app: document.querySelector('#app'),
    logout: document.querySelector('#logout'),
    settingsBtn: document.querySelector('#settings-btn'),
    settingsModal: document.querySelector('#settings-modal'),
    closeSettings: document.querySelector('#close-settings'),
    themeToggle: document.querySelector('#theme-toggle'),
    characterForm: document.querySelector('#character-form'),
    characterOutput: document.querySelector('#character-output'),
    saveBtn: document.querySelector('#character-form button[type="submit"]'),
    charName: document.querySelector('#char-name'),
    charClan: document.querySelector('#char-clan'),
    charElement: document.querySelector('#char-element'),
    charDescription: document.querySelector('#char-description'),
    chatForm: document.querySelector('#chat-form'),
    chatInput: document.querySelector('#chat-input'),
    chatLog: document.querySelector('#chat-log')
  };

  let characters = [];
  let editIndex = -1;

  function init() {
    attachEvents();
    restoreSession();
    restoreTheme();
  }

  function attachEvents() {
    dom.loginForm.addEventListener('submit', handleLogin);
    dom.logout.addEventListener('click', handleLogout);
    dom.settingsBtn.addEventListener('click', openSettings);
    dom.closeSettings.addEventListener('click', closeSettings);
    dom.themeToggle.addEventListener('click', toggleTheme);
    dom.characterForm.addEventListener('submit', saveCharacter);
    dom.characterOutput.addEventListener('click', (e) => {
      if (e.target.matches('.delete-character')) {
        const index = Number(e.target.dataset.index);
        deleteCharacter(index);
      } else if (e.target.matches('.edit-character')) {
        const index = Number(e.target.dataset.index);
        startEdit(index);
      }
    });
    if (dom.chatForm) {
      dom.chatForm.addEventListener('submit', sendChat);
    }
  }

  async function restoreSession() {
    try {
      const res = await fetch('/api/login');
      if (res.ok) {
        showApp();
        await loadCharacters();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = dom.loginForm.username.value.trim();
    const password = dom.loginForm.password.value.trim();
    if (!username || !password) {
      showError('Please enter username and password.');
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        showError('Invalid credentials.');
        return;
      }
      dom.loginError.classList.add('hidden');
      showApp();
      await loadCharacters();
    } catch (err) {
      showError('Server error.');
    }
  }

  async function handleLogout() {
    await fetch('/api/login', { method: 'DELETE' });
    showLogin();
  }

  async function loadCharacters() {
    try {
      const res = await fetch('/api/characters');
      if (res.ok) {
        characters = await res.json();
        renderCharacters();
      }
    } catch (err) {
      characters = [];
    }
  }

  async function saveCharacter(e) {
    e.preventDefault();
    const character = {
      name: dom.charName.value.trim(),
      clan: dom.charClan.value.trim(),
      element: dom.charElement.value.trim(),
      description: dom.charDescription.value.trim()
    };
    try {
      const method = editIndex >= 0 ? 'PUT' : 'POST';
      const url = editIndex >= 0 ? `/api/characters?index=${editIndex}` : '/api/characters';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character)
      });
      if (res.ok) {
        characters = await res.json();
        dom.characterForm.reset();
        editIndex = -1;
        dom.saveBtn.textContent = 'Save';
        renderCharacters();
      }
    } catch {}
  }

  async function deleteCharacter(index) {
    try {
      const res = await fetch(`/api/characters?index=${index}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        characters = await res.json();
        renderCharacters();
      }
    } catch {}
  }

  function renderCharacters() {
    dom.characterOutput.innerHTML = '';
    characters.forEach((c, i) => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = c.name;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(' of '));
      li.appendChild(document.createTextNode(c.clan || 'no clan'));
      li.appendChild(document.createTextNode(' - '));
      li.appendChild(document.createTextNode(c.element || 'no element'));
      li.appendChild(document.createTextNode(' '));
      const edit = document.createElement('button');
      edit.className = 'edit-character';
      edit.dataset.index = i;
      edit.textContent = 'Edit';
      li.appendChild(edit);
      const btn = document.createElement('button');
      btn.className = 'delete-character';
      btn.dataset.index = i;
      btn.textContent = 'Delete';
      li.appendChild(btn);
      dom.characterOutput.appendChild(li);
    });
  }

  function startEdit(index) {
    const c = characters[index];
    if (!c) return;
    editIndex = index;
    dom.charName.value = c.name;
    dom.charClan.value = c.clan;
    dom.charElement.value = c.element;
    dom.charDescription.value = c.description;
    dom.saveBtn.textContent = 'Update';
  }

  async function sendChat(e) {
    e.preventDefault();
    const message = dom.chatInput.value.trim();
    if (!message) return;
    appendMessage('user', message);
    dom.chatInput.value = '';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (res.status === 429) {
        appendMessage('ai', 'Rate limit exceeded.');
        return;
      }
      const data = await res.json();
      appendMessage('ai', data.reply || '...');
    } catch (err) {
      appendMessage('ai', 'Error contacting AI service.');
    }
  }

  function appendMessage(role, text) {
    if (!dom.chatLog) return;
    const li = document.createElement('li');
    li.className = role;
    li.textContent = text;
    dom.chatLog.appendChild(li);
    dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
  }

  function showApp() {
    dom.loginSection.classList.add('hidden');
    dom.app.classList.remove('hidden');
  }

  function showLogin() {
    dom.app.classList.add('hidden');
    dom.loginSection.classList.remove('hidden');
    dom.loginForm.reset();
  }

  function showError(msg) {
    dom.loginError.textContent = msg;
    dom.loginError.classList.remove('hidden');
  }

  function restoreTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = theme;
  }

  function toggleTheme() {
    const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    localStorage.setItem('theme', next);
  }

  function openSettings() {
    dom.settingsModal.classList.remove('hidden');
  }

  function closeSettings() {
    dom.settingsModal.classList.add('hidden');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
