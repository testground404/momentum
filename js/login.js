import {
  register,
  login,
  loginGoogle,
  isAuthenticated,
  onAuthStateChanged,
  useFirebase
} from './services/Auth.js';

/**
 * Initialize the login page functionality
 * Sets up theme toggle, login/signup forms, validation, and auto-redirect
 */
export function initLogin() {
  // Theme toggle functionality
  const themeToggle = document.getElementById('theme-toggle-login');
  const html = document.documentElement;

  // Theme is already applied by the immediate script in <head>
  // Just handle the toggle click
  themeToggle.addEventListener('click', function() {
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    localStorage.setItem('themepreference', isDark ? 'dark' : 'light');
  });

  // Login form handler
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');
  const registerLink = document.getElementById('register-link');
  const confirmPasswordGroup = document.getElementById('confirm-password-group');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const submitButton = loginForm.querySelector('button[type="submit"]');
  const usernameLabel = document.getElementById('username-label');
  const usernameInput = document.getElementById('username');
  const googleDivider = document.getElementById('google-divider');
  const googleLoginBtn = document.getElementById('google-login');

  let isSignupMode = false;

  // Update form labels based on Firebase mode
  if (!useFirebase) {
    // LocalStorage mode - use username
    usernameLabel.textContent = 'Username';
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Enter your username';
    usernameInput.autocomplete = 'username';
  } else {
    // Firebase mode - use email
    usernameLabel.textContent = 'Email';
    usernameInput.type = 'email';
    usernameInput.placeholder = 'Enter your email';
    usernameInput.autocomplete = 'email';
  }

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Disable submit button during processing
    submitButton.disabled = true;
    submitButton.textContent = isSignupMode ? 'Creating account...' : 'Logging in...';

    try {
      if (isSignupMode) {
        // Handle signup
        const confirmPassword = confirmPasswordInput.value;

        if (!username || !password || !confirmPassword) {
          showError('Please fill in all fields');
          return;
        }

        // Email validation for Firebase mode
        if (useFirebase) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(username)) {
            showError('Please enter a valid email address');
            return;
          }
        } else {
          if (username.length < 3) {
            showError('Username must be at least 3 characters long');
            return;
          }
        }

        if (password.length < 6) {
          showError('Password must be at least 6 characters long');
          return;
        }

        if (password !== confirmPassword) {
          showError('Passwords do not match');
          return;
        }

        const success = await register(username, password);
        if (success) {
          showError('Account created successfully! Logging you in...');
          errorMessage.style.background = 'rgba(34, 197, 94, 0.1)';
          errorMessage.style.borderColor = 'rgba(34, 197, 94, 0.3)';
          errorMessage.style.color = '#22c55e';

          setTimeout(() => {
            window.location.href = 'app.html';
          }, 1000);
        } else {
          showError(useFirebase ? 'Registration failed. This email may already be in use or is invalid.' : 'Username already exists. Please try a different one.');
        }
      } else {
        // Handle login
        if (!username || !password) {
          showError(useFirebase ? 'Please enter both email and password' : 'Please enter both username and password');
          return;
        }

        // Email validation for Firebase mode
        if (useFirebase) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(username)) {
            showError('Please enter a valid email address');
            return;
          }
        }

        const success = await login(username, password);
        if (success) {
          window.location.href = 'app.html';
        } else {
          showError(useFirebase ? 'Invalid email or password. Please check your credentials and try again.' : 'Invalid username or password. Please try again.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Show more specific error for Firebase
      if (useFirebase && error.code) {
        if (error.code === 'auth/invalid-login-credentials' || error.code === 'auth/user-not-found') {
          showError('No account found with this email. Please sign up first.');
        } else if (error.code === 'auth/wrong-password') {
          showError('Incorrect password. Please try again.');
        } else if (error.code === 'auth/invalid-email') {
          showError('Please enter a valid email address.');
        } else if (error.code === 'auth/too-many-requests') {
          showError('Too many failed attempts. Please try again later.');
        } else {
          showError('Login failed: ' + (error.message || 'Please try again.'));
        }
      } else {
        showError('An error occurred. Please try again.');
      }
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = isSignupMode ? 'Sign Up' : 'Log In';
    }
  });

  registerLink.addEventListener('click', function(e) {
    e.preventDefault();

    if (!isSignupMode) {
      // Switch to signup mode
      isSignupMode = true;
      confirmPasswordGroup.style.display = 'block';
      confirmPasswordInput.required = true;
      submitButton.textContent = 'Sign Up';
      registerLink.textContent = 'Back to login';
      errorMessage.classList.remove('show');
      // Hide Google login in signup mode
      if (googleDivider) googleDivider.style.display = 'none';
      if (googleLoginBtn) googleLoginBtn.style.display = 'none';
    } else {
      // Switch back to login mode
      isSignupMode = false;
      confirmPasswordGroup.style.display = 'none';
      confirmPasswordInput.required = false;
      confirmPasswordInput.value = '';
      submitButton.textContent = 'Log In';
      registerLink.textContent = 'Create one';
      errorMessage.classList.remove('show');
      // Show Google login in login mode
      if (googleDivider) googleDivider.style.display = 'flex';
      if (googleLoginBtn) googleLoginBtn.style.display = 'flex';
    }
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');

    // Reset error styling in case it was changed for success
    errorMessage.style.background = 'rgba(220, 38, 38, 0.1)';
    errorMessage.style.borderColor = 'rgba(220, 38, 38, 0.3)';
    errorMessage.style.color = '#dc2626';

    setTimeout(() => {
      errorMessage.classList.remove('show');
    }, 4000);
  }

  // Check if already logged in (secondary check after module loads)
  // For Firebase, we need to wait for auth state to be restored
  if (useFirebase) {
    console.log('Checking Firebase authentication state...');
    onAuthStateChanged((user) => {
      if (user) {
        console.log('User already logged in (Firebase):', user.uid || user.email);
        console.log('Redirecting to app...');
        window.location.href = 'app.html';
      } else {
        console.log('No Firebase user authenticated, showing login page');
      }
    });
  } else {
    // For localStorage, we can check synchronously
    console.log('Checking localStorage authentication...');
    if (isAuthenticated()) {
      console.log('User already logged in (localStorage), redirecting to app...');
      window.location.href = 'app.html';
    } else {
      console.log('No localStorage user authenticated, showing login page');
    }
  }

  // Google login handler
  document.getElementById('google-login').addEventListener('click', async function() {
    if (!useFirebase) {
      showError('Google login requires Firebase configuration. Please configure Firebase or use username/password login.');
      errorMessage.style.background = 'rgba(59, 130, 246, 0.1)';
      errorMessage.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      errorMessage.style.color = '#3b82f6';
      return;
    }

    try {
      this.disabled = true;
      this.textContent = 'Signing in with Google...';

      const result = await loginGoogle();
      if (result.success) {
        showError('Google login successful! Redirecting...');
        errorMessage.style.background = 'rgba(34, 197, 94, 0.1)';
        errorMessage.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        errorMessage.style.color = '#22c55e';

        setTimeout(() => {
          window.location.href = 'app.html';
        }, 1000);
      } else {
        showError(result.error || 'Google login failed. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      showError('Google login failed. Please try again.');
    } finally {
      this.disabled = false;
      this.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/><path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/><path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/><path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/></svg><span>Continue with Google</span>';
    }
  });
}

// Initialize login when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}
