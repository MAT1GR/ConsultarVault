document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginContent = document.getElementById('loginContent');
  const registerContent = document.getElementById('registerContent');
  const message = document.getElementById('mensaje');

  loginTab.addEventListener('click', function() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginContent.classList.add('active');
    registerContent.classList.remove('active');
    message.textContent = '';
    message.classList.remove('success', 'error');
  });

  registerTab.addEventListener('click', function() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerContent.classList.add('active');
    loginContent.classList.remove('active');
    message.textContent = '';
    message.classList.remove('success', 'error');
  });

  // Form animations
  const inputs = document.querySelectorAll('.form-input');
  
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('input-focused');
    });
    
    input.addEventListener('blur', function() {
      if (this.value === '') {
        this.parentElement.classList.remove('input-focused');
      }
    });
  });

  // Handle form submission feedback
  function showMessage(text, type) {
    message.textContent = text;
    message.classList.remove('success', 'error');
    message.classList.add(type);
    
    // Animate the message
    message.style.animation = 'none';
    setTimeout(() => {
      message.style.animation = 'fadeIn 0.3s ease-out forwards';
    }, 10);
  }

  // Login function
  window.login = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email || !password) {
      showMessage('Por favor, ingrese correo y contraseña', 'error');
      return;
    }
    
    // Show loading state
    const loginBtn = document.querySelector('#loginContent button');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Iniciando sesión...';
    loginBtn.disabled = true;
    
    try {
      const auth = firebase.auth();
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      showMessage('¡Bienvenido!', 'success');
      
      // Ensure redirection happens after a short delay
      setTimeout(() => {
        window.location.href = 'principal.html';
      }, 1000);
      
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intente más tarde';
      }
      
      showMessage(errorMessage, 'error');
      loginBtn.textContent = originalText;
      loginBtn.disabled = false;
    }
  };
  
  // Signup function
  window.signup = async function() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    // Basic validation
    if (!email || !password) {
      showMessage('Por favor, complete todos los campos', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    
    // Show loading state
    const signupBtn = document.querySelector('#registerContent button');
    const originalText = signupBtn.textContent;
    signupBtn.textContent = 'Creando cuenta...';
    signupBtn.disabled = true;
    
    try {
      const auth = firebase.auth();
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      showMessage('¡Usuario registrado exitosamente!', 'success');
      
      // Switch to login tab after successful registration
      setTimeout(() => {
        loginTab.click();
      }, 1500);
      
    } catch (error) {
      let errorMessage = 'Error al registrarse';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo ya está en uso';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Contraseña demasiado débil';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      signupBtn.textContent = originalText;
      signupBtn.disabled = false;
    }
  };
});