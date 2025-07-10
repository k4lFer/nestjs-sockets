const socket = io('http://localhost:3000');
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');

if (!userId) {
  alert('Debes iniciar sesión primero');
  window.location.href = 'index.html';
}

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const usersList = document.getElementById('users-list');

// Unirse al servidor con tu ID
socket.emit('join', userId);

// Recibir bienvenida
socket.on('welcome', (data) => {
  appendMessage(`📢 ${data.message}`);
});

// Recibir usuarios conectados
socket.on('connected-users', (users) => {
  usersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user.username;
    usersList.appendChild(li);
  });
});

// Enviar mensaje
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = chatInput.value;
  if (message.trim()) {
    socket.emit('send-message', {
      chatId: 'global-chat', // puedes cambiarlo por ID real
      senderId: userId,
      message: message
    });
    chatInput.value = '';
  }
});

// Recibir mensaje
socket.on('new-message', (msg) => {
  appendMessage(`💬 ${msg.sender.username}: ${msg.content}`);
});

function appendMessage(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
