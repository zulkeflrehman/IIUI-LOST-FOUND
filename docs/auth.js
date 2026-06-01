// Authentication Layer - e-Lost & Found System
const auth = {
  currentUser: null,

  initialize() {
    // Load session from local storage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    this.updateUI();
    this.setupListeners();
  },

  setupListeners() {
    // Tab toggles between Login and Signup
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');

    if (tabLoginBtn && tabSignupBtn) {
      tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabSignupBtn.classList.remove('active');
        loginFormContainer.style.display = 'block';
        signupFormContainer.style.display = 'none';
      });

      tabSignupBtn.addEventListener('click', () => {
        tabSignupBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        signupFormContainer.style.display = 'block';
        loginFormContainer.style.display = 'none';
      });
    }

    // Login Action
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
          const res = await api.post('/auth/login', { email, password });
          this.login(res.user);
          app.showToast('Successfully logged in!', 'success');
          
          // Redirect based on role
          if (res.user.role === 'admin') {
            window.location.hash = '#admin';
          } else {
            window.location.hash = '#dashboard';
          }
          formLogin.reset();
        } catch (err) {
          app.showToast(err.message, 'danger');
        }
      });
    }

    // Registration Action (Simulated OTP dispatcher)
    const formSignup = document.getElementById('form-signup');
    if (formSignup) {
      formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const department = document.getElementById('signup-dept').value;
        const password = document.getElementById('signup-password').value;


        try {
          const res = await api.post('/auth/register', { email, fullName, password, department });
          
          // Show the OTP verification modal - code was sent to real email
          document.getElementById('otp-target-email').innerText = email;
          document.getElementById('modal-otp').style.display = 'flex';
          
          // Save email for verification step
          window.pendingEmailForVerification = email;

          app.showToast('Verification code sent! Check your email inbox.', 'success');
        } catch (err) {
          app.showToast(err.message, 'danger');
        }
      });
    }

    // OTP Code Verification Button
    const btnVerifyOtp = document.getElementById('btn-verify-otp');
    if (btnVerifyOtp) {
      btnVerifyOtp.addEventListener('click', async () => {
        const otpCode = document.getElementById('otp-input').value;
        const email = window.pendingEmailForVerification;

        if (!otpCode || otpCode.length !== 6) {
          app.showToast('Please enter the 6-digit OTP code', 'danger');
          return;
        }

        try {
          const res = await api.post('/auth/verify-otp', { email, otp: otpCode });
          document.getElementById('modal-otp').style.display = 'none';
          document.getElementById('form-signup').reset();
          document.getElementById('otp-input').value = '';
          
          this.login(res.user);
          app.showToast('Account created and verified successfully!', 'success');
          window.location.hash = '#dashboard';
        } catch (err) {
          app.showToast(err.message, 'danger');
        }
      });
    }

    // Modal OTP Closers
    const btnCloseOtp = document.getElementById('btn-close-otp');
    if (btnCloseOtp) {
      btnCloseOtp.addEventListener('click', () => {
        document.getElementById('modal-otp').style.display = 'none';
      });
    }

    // Logout Action
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        this.logout();
      });
    }
  },

  login(user) {
    this.currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    this.updateUI();
    app.onUserSessionChange();
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('user');
    this.updateUI();
    app.onUserSessionChange();
    app.showToast('Logged out successfully', 'info');
    window.location.hash = '#home';
  },

  updateUI() {
    const userMenu = document.getElementById('user-profile-menu');
    const loginBtn = document.getElementById('btn-nav-login');
    
    // Toggle active state classes based on auth
    if (this.currentUser) {
      if (userMenu) userMenu.style.display = 'block';
      if (loginBtn) loginBtn.style.display = 'none';
      
      // Update details
      document.getElementById('nav-username').innerText = this.currentUser.fullName;
      document.getElementById('user-avatar').innerText = this.currentUser.fullName.charAt(0).toUpperCase();
      
      document.getElementById('profile-name').innerText = this.currentUser.fullName;
      document.getElementById('profile-email').innerText = this.currentUser.email;
      
      const roleBadge = document.getElementById('profile-role');
      if (this.currentUser.role === 'admin') {
        roleBadge.innerText = 'Administrator';
        roleBadge.className = 'badge badge-role admin';
      } else {
        roleBadge.innerText = this.currentUser.department;
        roleBadge.className = 'badge badge-role';
      }

      // Show/Hide authenticated links
      document.querySelectorAll('.auth-only').forEach(el => el.style.display = '');
      if (this.currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
      } else {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
      }
    } else {
      if (userMenu) userMenu.style.display = 'none';
      if (loginBtn) loginBtn.style.display = 'block';

      document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
  }
};
