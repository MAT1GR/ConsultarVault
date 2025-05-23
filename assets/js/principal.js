document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI elements
  initPasswordGenerator();
  checkAuthState();
  
  // Set up event listeners
  document.getElementById('lengthRange').addEventListener('input', updateRangeValue);
  document.getElementById('togglePasswordListBtn').addEventListener('click', togglePasswordList);
  document.getElementById('copyPasswordBtn').addEventListener('click', copyGeneratedPassword);
  
  // Initialize tooltips if any
  const tooltips = document.querySelectorAll('[data-tooltip]');
  tooltips.forEach(tooltip => {
    tooltip.addEventListener('mouseenter', showTooltip);
    tooltip.addEventListener('mouseleave', hideTooltip);
  });
});

// Auth state check
function checkAuthState() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = "index.html";
    } else {
      // Update UI with user info
      document.getElementById('userEmail').textContent = user.email;
      // Load passwords for this user
      loadPasswords();
    }
  });
}

// Firebase Database Functions
async function loadPasswords() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const dbRef = firebase.database().ref('passwords/' + user.uid);
  
  dbRef.on('value', (snapshot) => {
    const passwords = [];
    snapshot.forEach((childSnapshot) => {
      passwords.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    renderPasswords(passwords);
  });
}
async function savePasswordToFirebase(passwordData) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  try {
    const newPasswordRef = firebase.database().ref('passwords/' + user.uid).push();
    await newPasswordRef.set({
      ...passwordData,
      timestamp: Date.now(),
      visible: false
    });
    return true;
  } catch (error) {
    console.error('Error saving password:', error);
    return false;
  }
}

async function updatePasswordInFirebase(id, passwordData) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  try {
    await firebase.database().ref(`passwords/${user.uid}/${id}`).update({
      ...passwordData,
      timestamp: Date.now(),
      visible: false
    });
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

async function deletePasswordFromFirebase(id) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  try {
    await firebase.database().ref(`passwords/${user.uid}/${id}`).remove();
    return true;
  } catch (error) {
    console.error('Error deleting password:', error);
    return false;
  }
}

// Password Generator Functions
function initPasswordGenerator() {
  // Set initial range value display
  updateRangeValue();
  
  // Set up password generator options
  const options = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  };
  
  // Add event listeners to checkboxes
  document.querySelectorAll('.option-checkbox input').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      options[this.name] = this.checked;
    });
  });
  
  // Override original generate password function
  window.generatePassword = function() {
    let chars = '';
    
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) chars += '0123456789';
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Ensure at least one character set is selected
    if (chars === '') {
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
      // Reset checkboxes
      document.querySelectorAll('.option-checkbox input').forEach(checkbox => {
        checkbox.checked = true;
        options[checkbox.name] = true;
      });
    }
    
    const length = parseInt(document.getElementById('lengthRange').value);
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const passwordField = document.getElementById('generatedPassword');
    passwordField.value = password;
    
    // Show the password strength indicator
    updatePasswordStrength(password);
    
    // Show the copy button
    document.getElementById('copyPasswordBtn').style.display = 'block';
    
    // Add animation effect
    passwordField.classList.remove('highlight-animation');
    setTimeout(() => {
      passwordField.classList.add('highlight-animation');
    }, 10);
  };
}

function updateRangeValue() {
  const range = document.getElementById('lengthRange');
  const value = document.getElementById('lengthValue');
  value.textContent = range.value;
}

function updatePasswordStrength(password) {
  const strengthMeter = document.getElementById('strengthMeter');
  const strengthText = document.getElementById('strengthText');
  
  // Calculate password strength
  let strength = 0;
  
  // Length contribution (up to 40%)
  strength += Math.min(password.length / 20, 1) * 40;
  
  // Character variety contribution (up to 60%)
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  
  let varietyCount = 0;
  if (hasUpper) varietyCount++;
  if (hasLower) varietyCount++;
  if (hasNumber) varietyCount++;
  if (hasSymbol) varietyCount++;
  
  strength += (varietyCount / 4) * 60;
  
  // Update the visual meter
  strengthMeter.value = strength;
  
  // Update the text description
  if (strength < 40) {
    strengthText.textContent = 'Débil';
    strengthText.className = 'strength-weak';
  } else if (strength < 75) {
    strengthText.textContent = 'Moderada';
    strengthText.className = 'strength-medium';
  } else {
    strengthText.textContent = 'Fuerte';
    strengthText.className = 'strength-strong';
  }
}

function copyGeneratedPassword() {
  const passwordField = document.getElementById('generatedPassword');
  passwordField.select();
  document.execCommand('copy');
  
  // Show feedback
  const copyBtn = document.getElementById('copyPasswordBtn');
  const originalHTML = copyBtn.innerHTML;
  copyBtn.innerHTML = '<i data-lucide="check"></i> Copiado!';
  lucide.createIcons();
  
  setTimeout(() => {
    copyBtn.innerHTML = originalHTML;
    lucide.createIcons();
  }, 2000);
}

// Password Manager Functions
function renderPasswords(passwords) {
  const list = document.getElementById('passwordList');
  const emptyState = document.getElementById('emptyState');
  
  if (!passwords || passwords.length === 0) {
    list.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  list.innerHTML = '';
  
  passwords.forEach((entry) => {
    const passwordText = entry.visible ? entry.password : '••••••••••••';
    const siteInitial = entry.site ? entry.site.charAt(0).toUpperCase() : '#';
    const siteLink = entry.site ? formatSiteLink(entry.site) : 'Sitio sin nombre';
    
    const itemElement = document.createElement('div');
    itemElement.className = 'password-item';
    itemElement.innerHTML = `
      <div class="password-item-header">
        <div class="site-info">
          <div class="site-icon">${siteInitial}</div>
          ${siteLink}
        </div>
        <div class="timestamp">${formatTimestamp(entry.timestamp)}</div>
      </div>
      <div class="password-content">
        <div class="user-info">
          <strong>Usuario:</strong> ${entry.user}
        </div>
        <div class="password-value">${passwordText}</div>
      </div>
      <div class="password-actions">
        <button class="action-btn btn-outline toggle-btn" onclick="toggleVisibility('${entry.id}')">
          <i data-lucide="${entry.visible ? 'eye-off' : 'eye'}"></i>
          ${entry.visible ? 'Ocultar' : 'Ver'}
        </button>
        <button class="action-btn btn-outline copy-btn" onclick="copyPassword('${entry.id}')">
          <i data-lucide="copy"></i>
          Copiar
        </button>
        <button class="action-btn btn-outline edit-btn" onclick="editPassword('${entry.id}')">
          <i data-lucide="edit"></i>
          Editar
        </button>
        <button class="action-btn btn-danger delete-btn" onclick="confirmDelete('${entry.id}')">
          <i data-lucide="trash-2"></i>
          Eliminar
        </button>
      </div>
    `;
    
    list.appendChild(itemElement);
    lucide.createIcons();
  });
}

function formatSiteLink(site) {
  if (!site) return 'Sitio sin nombre';
  
  // Add protocol if missing
  let url = site.toLowerCase();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="site-link">${site}</a>`;
}

window.toggleVisibility = async function(id) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const passwordRef = firebase.database().ref(`passwords/${user.uid}/${id}`);
  const snapshot = await passwordRef.once('value');
  const currentPassword = snapshot.val();
  
  await passwordRef.update({
    visible: !currentPassword.visible
  });
};

window.copyPassword = async function(id) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const snapshot = await firebase.database().ref(`passwords/${user.uid}/${id}`).once('value');
  const password = snapshot.val().password;
  
  const textarea = document.createElement('textarea');
  textarea.value = password;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  
  showToast('Contraseña copiada al portapapeles');
};

window.editPassword = async function(id) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const snapshot = await firebase.database().ref(`passwords/${user.uid}/${id}`).once('value');
  const entry = snapshot.val();
  
  const modal = document.getElementById('editModal');
  document.getElementById('editSite').value = entry.site || '';
  document.getElementById('editUser').value = entry.user || '';
  document.getElementById('editPassword').value = entry.password || '';
  document.getElementById('editIndex').value = id;
  
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
};

window.saveEditedPassword = async function() {
  const id = document.getElementById('editIndex').value;
  const site = document.getElementById('editSite').value.trim();
  const user = document.getElementById('editUser').value.trim();
  const password = document.getElementById('editPassword').value.trim();
  
  if (!user || !password) {
    showToast('Por favor complete los campos requeridos', 'error');
    return;
  }
  
  const success = await updatePasswordInFirebase(id, { site, user, password });
  
  if (success) {
    closeModal();
    showToast('Contraseña actualizada correctamente');
  } else {
    showToast('Error al actualizar la contraseña', 'error');
  }
};

window.confirmDelete = function(id) {
  const modal = document.getElementById('deleteModal');
  document.getElementById('deleteIndex').value = id;
  
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
};

window.deletePassword = async function() {
  const id = document.getElementById('deleteIndex').value;
  
  const success = await deletePasswordFromFirebase(id);
  
  if (success) {
    closeModal();
    showToast('Contraseña eliminada correctamente');
  } else {
    showToast('Error al eliminar la contraseña', 'error');
  }
};

window.savePassword = async function() {
  const site = document.getElementById('site').value.trim();
  const user = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  
  if (!user || !password) {
    showToast('Por favor complete los campos requeridos', 'error');
    return;
  }
  
  const success = await savePasswordToFirebase({ site, user, password });
  
  if (success) {
    // Clear form
    document.getElementById('site').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    showToast('Contraseña guardada correctamente');
    
    // Ensure list is visible
    document.getElementById('passwordListContainer').style.display = 'block';
    document.getElementById('togglePasswordListBtn').classList.add('active');
  } else {
    showToast('Error al guardar la contraseña', 'error');
  }
};

function togglePasswordList() {
  const container = document.getElementById('passwordListContainer');
  const btn = document.getElementById('togglePasswordListBtn');
  
  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'block';
    btn.classList.add('active');
  } else {
    container.style.display = 'none';
    btn.classList.remove('active');
  }
}

function closeModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function showTooltip(event) {
  const text = event.currentTarget.getAttribute('data-tooltip');
  
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = text;
  
  document.body.appendChild(tooltip);
  
  const rect = event.currentTarget.getBoundingClientRect();
  tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
  tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
  
  setTimeout(() => {
    tooltip.classList.add('show');
  }, 10);
  
  event.currentTarget.tooltip = tooltip;
}

function hideTooltip(event) {
  const tooltip = event.currentTarget.tooltip;
  if (tooltip) {
    tooltip.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(tooltip);
    }, 200);
  }
}

window.logout = function() {
  document.body.classList.add('fade-out');
  
  setTimeout(() => {
    firebase.auth().signOut().then(() => {
      window.location.href = "index.html";
    });
  }, 300);
};
