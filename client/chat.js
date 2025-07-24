const socket = io('http://localhost:3000');
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');

if (!userId) {
  alert('Debes iniciar sesión primero');
  window.location.href = 'login.html';
}

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const fileInput = document.getElementById('file-input'); 
const usersList = document.getElementById('users-list');

// Variables para manejar el chat actual
let currentChatId = 'global-chat';
let currentChatName = 'Chat Global';
let selectedUserId = null;

// Unirse al servidor con tu ID
socket.emit('join', userId);

// Unirse al chat global por defecto
socket.emit('join-chat', currentChatId);

// Inicializar el header
updateChatHeader();

// Recibir bienvenida
socket.on('welcome', (data) => {
  appendMessage(`📢 ${data.message}`);
});

// Recibir usuarios conectados
socket.on('connected-users', (users) => {
  usersList.innerHTML = '';

  // Agregar opción de chat global
  const globalChatDiv = document.createElement('div');
  globalChatDiv.className = 'user-item';
  globalChatDiv.textContent = '🌐 Chat Global';
  globalChatDiv.style.cursor = 'pointer';
  globalChatDiv.style.fontWeight =
    currentChatId === 'global-chat' ? 'bold' : 'normal';
  globalChatDiv.style.backgroundColor =
    currentChatId === 'global-chat' ? '#e3f2fd' : 'transparent';
  globalChatDiv.addEventListener('click', () => selectGlobalChat());
  usersList.appendChild(globalChatDiv);

  // Agregar separador
  const separator = document.createElement('div');
  separator.style.borderTop = '1px solid #eee';
  separator.style.margin = '10px 0';
  usersList.appendChild(separator);

  // Filtrar usuarios (excluir al usuario actual)
  const otherUsers = users.filter((user) => user.id !== userId);

  if (otherUsers.length === 0) {
    const noUsersDiv = document.createElement('div');
    noUsersDiv.className = 'user-item';
    noUsersDiv.textContent = '🚫 No hay otros usuarios conectados';
    noUsersDiv.style.opacity = '0.6';
    noUsersDiv.style.fontStyle = 'italic';
    noUsersDiv.style.cursor = 'default';
    usersList.appendChild(noUsersDiv);
  } else {
    otherUsers.forEach((user) => {
      const div = document.createElement('div');
      div.className = 'user-item';
      div.textContent = `👤 ${user.username}`;
      div.style.cursor = 'pointer';
      div.style.padding = '8px';
      div.style.borderRadius = '4px';
      div.style.margin = '2px 0';
      div.addEventListener('click', () => selectUser(user.id, user.username));
      usersList.appendChild(div);
    });
  }
});

// Enviar mensaje
/*
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (message && currentChatId) {
    socket.emit('send-message', {
      chatId: currentChatId,
      senderId: userId,
      message: message,
    });
    chatInput.value = '';
  }
});
*/

// 📥 Enviar mensaje con o sin archivo
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  const file = fileInput.files[0];

  if (!file) {
    if (message) {
      socket.emit('send-message', {
        chatId: currentChatId,
        senderId: userId,
        message: message,
      });
      chatInput.value = '';
    }
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    alert('⚠️ El archivo excede los 50MB permitidos');
    fileInput.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('chatId', currentChatId);
  formData.append('senderId', userId);
  formData.append('message', message);

  try {
    const res = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });

    const msg = await res.json();

    // Ya no es necesario socket.emit('new-message', msg) si el backend lo emite directamente
    chatInput.value = '';
    fileInput.value = '';
  } catch (error) {
    console.error('Error al subir archivo:', error);
    alert('Error al enviar archivo');
  }
});

// 📎 Validación al seleccionar archivo
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 50 * 1024 * 1024) {
    alert('⚠️ El archivo excede los 50MB permitidos');
    fileInput.value = '';
    return;
  }

  console.log(`📎 Archivo: ${file.name} (${file.type}) - ${(file.size / 1024 / 1024).toFixed(2)} MB`);
});

// 📨 Recibir mensajes
socket.on('new-message', renderMessage);
socket.on('chat-history', (messages) => {
  chatBox.innerHTML = '';
  messages.forEach(renderMessage);
});

function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message-item';

  // Archivo
  if (msg.file) {
    const label = document.createElement('p');
    label.innerHTML = `📎 <strong>${msg.sender.username}</strong> envió: <em>${msg.file.filename}</em>`;
    div.appendChild(label);

    const link = document.createElement('a');
    link.href = `http://localhost:3000/download/${msg._id}`;
    link.textContent = 'Descargar archivo';
    link.target = '_blank';
    link.style.color = '#1e88e5';
    div.appendChild(link);

    // Previsualización si es imagen
    if (msg.file.mimetype.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = link.href;
      img.alt = msg.file.filename;
      img.style.maxWidth = '150px';
      img.style.display = 'block';
      img.style.marginTop = '8px';
      img.onclick = () => openImageModal(link.href);
      div.appendChild(img);
    }
  }

  if (msg.content?.trim()) {
    const content = document.createElement('p');
    content.innerHTML = `💬 <strong>${msg.sender.username}</strong>: ${msg.content}`;
    div.appendChild(content);
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}


// Recibir mensaje
/*
socket.on('new-message', (msg) => {
  appendMessage(`💬 ${msg.sender.username}: ${msg.content}`);
});
*/

function appendMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message-item';
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Función para seleccionar chat global
function selectGlobalChat() {
  currentChatId = 'global-chat';
  currentChatName = 'Chat Global';
  selectedUserId = null;

  // Limpiar chat y cargar mensajes del chat global
  chatBox.innerHTML = '';
  socket.emit('join-chat', currentChatId);

  // Actualizar título del chat
  updateChatHeader();

  // Actualizar estilos de la lista de usuarios
  updateUserSelection();
}

// Función para seleccionar un usuario y crear/unirse a chat privado
function selectUser(otherUserId, otherUsername) {
  selectedUserId = otherUserId;
  currentChatName = `Chat con ${otherUsername}`;

  // Crear o obtener chat privado
  socket.emit('private-chat', {
    userAId: userId,
    userBId: otherUserId,
  });

  // Actualizar título del chat
  updateChatHeader();

  // Actualizar estilos de la lista de usuarios
  updateUserSelection();
}

// Función para actualizar el header del chat
function updateChatHeader() {
  const chatHeader = document.querySelector('.chat-header h2');
  if (chatHeader) {
    chatHeader.textContent = `💬 ${currentChatName}`;
  }

  // Actualizar placeholder del input
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    if (currentChatId === 'global-chat') {
      chatInput.placeholder = 'Escribe un mensaje al chat global...';
    } else {
      chatInput.placeholder = `Escribe un mensaje a ${currentChatName.replace('Chat con ', '')}...`;
    }
  }
}

// Función para actualizar la selección visual en la lista de usuarios
function updateUserSelection() {
  const userItems = document.querySelectorAll('.user-item');
  userItems.forEach((item) => {
    item.style.fontWeight = 'normal';
    item.style.backgroundColor = 'transparent';
  });

  // Resaltar el chat/usuario actual
  userItems.forEach((item) => {
    if (
      (currentChatId === 'global-chat' &&
        item.textContent.includes('Chat Global')) ||
      (selectedUserId &&
        item.textContent.includes(currentChatName.replace('Chat con ', '')))
    ) {
      item.style.fontWeight = 'bold';
      item.style.backgroundColor = '#e3f2fd';
    }
  });
}

// Manejar cuando se crea un chat privado
socket.on('private-chat-created', (chat) => {
  currentChatId = chat._id;

  // Limpiar chat y unirse a la sala
  chatBox.innerHTML = '';
  socket.emit('join-chat', currentChatId);
});

// Manejar historial de chat
/*socket.on('chat-history', (messages) => {
  chatBox.innerHTML = '';
  messages.forEach((msg) => {
    appendMessage(`💬 ${msg.sender.username}: ${msg.content}`);
  });
});*/

// Mostrar imagen en modal
function openImageModal(src) {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-image");

  modal.style.display = "flex";
  modalImg.src = src;
}

// Cerrar el modal
function closeImageModal() {
  const modal = document.getElementById("image-modal");
  modal.style.display = "none";
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', function (event) {
  const modal = document.getElementById("image-modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});


function logout() {
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}
