const API_URL = 'http://localhost:3000/auth';

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  showMessage(data.message || 'Registrado correctamente');
});

document.getElementById('signin-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('signin-username').value;
  const password = document.getElementById('signin-password').value;

  const res = await fetch(`${API_URL}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  console.log(res);

  if (res.status === 201) {
    const data = await res.json();
    const user = data.data.user || data.data;
    localStorage.setItem('userId', user._id);
    localStorage.setItem('username', user.username);
    window.location.href = 'chat.html';
  } else {
    showMessage('Login fallido', true);
  }
});

function showMessage(msg, isError = false) {
  const el = document.getElementById('response-message');
  el.style.color = isError ? 'red' : 'green';
  el.textContent = msg;
}
