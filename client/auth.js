const API_URL = 'http://localhost:3000/auth';

// Función para mostrar mensajes
function showMessage(text, type = 'success') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.classList.remove('hidden');

  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 5000);
}

// Función para cambiar estado de loading
function setLoading(form, loading) {
  const button = form.querySelector('button[type="submit"]');
  const inputs = form.querySelectorAll('input');

  if (loading) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span>Cargando...';
    inputs.forEach((input) => (input.disabled = true));
    form.classList.add('loading');
  } else {
    button.disabled = false;
    inputs.forEach((input) => (input.disabled = false));
    form.classList.remove('loading');

    // Restaurar texto original del botón
    if (form.id === 'signin-form') {
      button.textContent = 'Iniciar Sesión';
    } else if (form.id === 'signup-form') {
      button.textContent = 'Crear Cuenta';
    }
  }
}

// Manejar login
const signinForm = document.getElementById('signin-form');
if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!username || !password) {
      showMessage('Por favor completa todos los campos', 'error');
      return;
    }

    setLoading(signinForm, true);

    try {
      const response = await fetch(`${API_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.data?.user || data.data || data.user;
        localStorage.setItem('userId', user._id || user.id);
        localStorage.setItem('username', user.username);

        showMessage('¡Login exitoso! Redirigiendo...', 'success');

        setTimeout(() => {
          window.location.href = 'chat.html';
        }, 1500);
      } else {
        showMessage(data.message || 'Error al iniciar sesión', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage(
        'Error de conexión. Verifica que el servidor esté funcionando.',
        'error',
      );
    } finally {
      setLoading(signinForm, false);
    }
  });
}

// Manejar registro
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username || !password) {
      showMessage('Por favor completa todos los campos', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setLoading(signupForm, true);

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(
          '¡Cuenta creada exitosamente! Redirigiendo al login...',
          'success',
        );

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        showMessage(data.message || 'Error al crear la cuenta', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage(
        'Error de conexión. Verifica que el servidor esté funcionando.',
        'error',
      );
    } finally {
      setLoading(signupForm, false);
    }
  });
}

// Verificar si ya está logueado
if (
  window.location.pathname.includes('login.html') ||
  window.location.pathname.includes('register.html')
) {
  const userId = localStorage.getItem('userId');
  if (userId) {
    window.location.href = 'chat.html';
  }
}
