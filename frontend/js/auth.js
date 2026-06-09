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
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;


        try {
          const res = await api.post('/auth/register', { email, fullName, password, department, phone });
          
          // Show the OTP verification modal - code was sent to real email
          document.getElementById('otp-target-email').innerText = email;
          document.getElementById('modal-otp').style.display = 'flex';
          
          // Save email for verification step
          window.pendingEmailForVerification = email;

          app.showToast('Verification code sent! Check your email inbox & SMS logs.', 'success');
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
    // ---- Forgot Password: Open Modal ----
    const btnOpenForgotPw = document.getElementById('btn-open-forgot-password');
    if (btnOpenForgotPw) {
      btnOpenForgotPw.addEventListener('click', () => {
        auth.forgotPassword.openModal();
      });
    }

    // ---- Forgot Password: Close Modal ----
    const btnCloseForgotPw = document.getElementById('btn-close-forgot-pw');
    if (btnCloseForgotPw) {
      btnCloseForgotPw.addEventListener('click', () => {
        auth.forgotPassword.closeModal();
      });
    }

    // Close modal when clicking backdrop
    const modalForgotPw = document.getElementById('modal-forgot-password');
    if (modalForgotPw) {
      modalForgotPw.addEventListener('click', (e) => {
        if (e.target === modalForgotPw) auth.forgotPassword.closeModal();
      });
    }

    // ---- Forgot PW Step 1: Send Email ----
    const btnForgotPwSend = document.getElementById('btn-forgot-pw-send');
    if (btnForgotPwSend) {
      btnForgotPwSend.addEventListener('click', async () => {
        const email = document.getElementById('forgot-pw-email').value.trim();
        if (!email) { app.showToast('Please enter your email address.', 'danger'); return; }

        btnForgotPwSend.disabled = true;
        btnForgotPwSend.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

        try {
          await api.post('/auth/forgot-password', { email });
          window._forgotPwEmail = email;
          document.getElementById('forgot-pw-sent-email').textContent = email;
          auth.forgotPassword.goToStep(2);
          app.showToast('Reset code sent! Check your email inbox.', 'success');
        } catch (err) {
          app.showToast(err.message || 'Failed to send reset code.', 'danger');
        } finally {
          btnForgotPwSend.disabled = false;
          btnForgotPwSend.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Reset Code';
        }
      });
    }

    // ---- Forgot PW Step 2: Verify OTP ----
    const btnForgotPwVerify = document.getElementById('btn-forgot-pw-verify');
    if (btnForgotPwVerify) {
      btnForgotPwVerify.addEventListener('click', async () => {
        const otp = document.getElementById('forgot-pw-otp').value.trim();
        if (!otp || otp.length !== 6) {
          app.showToast('Please enter the 6-digit code from your email.', 'danger');
          return;
        }

        btnForgotPwVerify.disabled = true;
        btnForgotPwVerify.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

        try {
          // Perform real-time validation of OTP on the backend first!
          await api.post('/auth/verify-reset-otp', { email: window._forgotPwEmail, otp });
          window._forgotPwOtp = otp;
          auth.forgotPassword.goToStep(3);
          app.showToast('Code verified! Set your new password.', 'success');
        } catch (err) {
          app.showToast(err.message || 'Verification failed. Please try again.', 'danger');
        } finally {
          btnForgotPwVerify.disabled = false;
          btnForgotPwVerify.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Verify Code & Continue';
        }
      });
    }

    // ---- Forgot PW Step 2: Resend Code ----
    const btnForgotPwResend = document.getElementById('btn-forgot-pw-resend');
    if (btnForgotPwResend) {
      btnForgotPwResend.addEventListener('click', async () => {
        const email = window._forgotPwEmail;
        if (!email) return;
        btnForgotPwResend.disabled = true;
        btnForgotPwResend.textContent = 'Resending...';
        try {
          await api.post('/auth/forgot-password', { email });
          app.showToast('A new reset code was sent to your email!', 'success');
          document.getElementById('forgot-pw-otp').value = '';
        } catch (err) {
          app.showToast(err.message || 'Failed to resend code.', 'danger');
        } finally {
          setTimeout(() => {
            btnForgotPwResend.disabled = false;
            btnForgotPwResend.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Didn\'t receive it? Resend code';
          }, 3000);
        }
      });
    }

    // ---- Forgot PW Step 2: Go Back ----
    const btnForgotPwBack = document.getElementById('btn-forgot-pw-back');
    if (btnForgotPwBack) {
      btnForgotPwBack.addEventListener('click', () => {
        auth.forgotPassword.goToStep(1);
      });
    }

    // ---- Forgot PW Step 3: Password Strength Meter ----
    const newPassInput = document.getElementById('forgot-pw-new-pass');
    if (newPassInput) {
      newPassInput.addEventListener('input', () => {
        const val = newPassInput.value;
        const container = document.getElementById('pw-strength-container');
        const fill = document.getElementById('pw-strength-fill');
        const label = document.getElementById('pw-strength-label');

        if (!val) {
          container.style.display = 'none';
          return;
        }
        container.style.display = 'flex';

        let strength = 0;
        if (val.length >= 6) strength++;
        if (val.length >= 10) strength++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength++;
        if (/\d/.test(val)) strength++;
        if (/[^a-zA-Z0-9]/.test(val)) strength++;

        fill.className = 'pw-strength-fill';
        label.className = 'pw-strength-label';

        if (strength <= 2) {
          fill.classList.add('weak');
          label.classList.add('weak');
          label.textContent = 'Weak';
        } else if (strength <= 3) {
          fill.classList.add('medium');
          label.classList.add('medium');
          label.textContent = 'Medium';
        } else {
          fill.classList.add('strong');
          label.classList.add('strong');
          label.textContent = 'Strong';
        }

        // Also trigger match check
        auth.forgotPassword.checkPasswordMatch();
      });
    }

    // ---- Forgot PW Step 3: Confirm Password Match ----
    const confirmPassInput = document.getElementById('forgot-pw-confirm-pass');
    if (confirmPassInput) {
      confirmPassInput.addEventListener('input', () => {
        auth.forgotPassword.checkPasswordMatch();
      });
    }

    // ---- Forgot PW Step 3: Show/Hide New Password ----
    const btnToggleNewPass = document.getElementById('btn-toggle-new-pass');
    if (btnToggleNewPass) {
      btnToggleNewPass.addEventListener('click', () => {
        const inp = document.getElementById('forgot-pw-new-pass');
        const icon = document.getElementById('icon-toggle-new-pass');
        if (inp.type === 'password') {
          inp.type = 'text';
          icon.className = 'fa-solid fa-eye-slash';
        } else {
          inp.type = 'password';
          icon.className = 'fa-solid fa-eye';
        }
      });
    }

    // ---- Forgot PW Step 3: Show/Hide Confirm Password ----
    const btnToggleConfirmPass = document.getElementById('btn-toggle-confirm-pass');
    if (btnToggleConfirmPass) {
      btnToggleConfirmPass.addEventListener('click', () => {
        const inp = document.getElementById('forgot-pw-confirm-pass');
        const icon = document.getElementById('icon-toggle-confirm-pass');
        if (inp.type === 'password') {
          inp.type = 'text';
          icon.className = 'fa-solid fa-eye-slash';
        } else {
          inp.type = 'password';
          icon.className = 'fa-solid fa-eye';
        }
      });
    }

    // ---- Forgot PW Step 3: Submit Reset ----
    const btnForgotPwReset = document.getElementById('btn-forgot-pw-reset');
    if (btnForgotPwReset) {
      btnForgotPwReset.addEventListener('click', async () => {
        const newPassword = document.getElementById('forgot-pw-new-pass').value;
        const confirmPassword = document.getElementById('forgot-pw-confirm-pass').value;
        const email = window._forgotPwEmail;
        const otp = window._forgotPwOtp;

        if (!newPassword || newPassword.length < 6) {
          app.showToast('Password must be at least 6 characters.', 'danger');
          return;
        }
        if (newPassword !== confirmPassword) {
          app.showToast('Passwords do not match!', 'danger');
          return;
        }

        btnForgotPwReset.disabled = true;
        btnForgotPwReset.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting...';

        try {
          await api.post('/auth/reset-password', { email, otp, newPassword });
          // Show success screen
          auth.forgotPassword.goToSuccess();
          app.showToast('Password reset successfully!', 'success');
        } catch (err) {
          app.showToast(err.message || 'Failed to reset password. Please try again.', 'danger');
          // If OTP was wrong, send back to step 2
          if (err.message && (err.message.includes('Invalid') || err.message.includes('expired'))) {
            auth.forgotPassword.goToStep(2);
          }
        } finally {
          btnForgotPwReset.disabled = false;
          btnForgotPwReset.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reset My Password';
        }
      });
    }

    // ---- Forgot PW Success: Go to Login ----
    const btnForgotPwGotoLogin = document.getElementById('btn-forgot-pw-goto-login');
    if (btnForgotPwGotoLogin) {
      btnForgotPwGotoLogin.addEventListener('click', () => {
        auth.forgotPassword.closeModal();
        // Switch to login tab
        const tabLoginBtn = document.getElementById('tab-login-btn');
        const tabSignupBtn = document.getElementById('tab-signup-btn');
        const loginFormContainer = document.getElementById('login-form-container');
        const signupFormContainer = document.getElementById('signup-form-container');
        if (tabLoginBtn) {
          tabLoginBtn.classList.add('active');
          tabSignupBtn.classList.remove('active');
          loginFormContainer.style.display = 'block';
          signupFormContainer.style.display = 'none';
        }
        // Pre-fill email if available
        const emailInput = document.getElementById('login-email');
        if (emailInput && window._forgotPwEmail) {
          emailInput.value = window._forgotPwEmail;
        }
      });
    }
  },

  // ============================================================
  //  FORGOT PASSWORD — Helper Object
  // ============================================================
  forgotPassword: {
    openModal() {
      const modal = document.getElementById('modal-forgot-password');
      if (modal) {
        modal.style.display = 'flex';
        // Reset to step 1 fresh each time
        this.goToStep(1);
        document.getElementById('forgot-pw-email').value = '';
        document.getElementById('forgot-pw-otp').value = '';
        document.getElementById('forgot-pw-new-pass').value = '';
        document.getElementById('forgot-pw-confirm-pass').value = '';
        document.getElementById('pw-strength-container').style.display = 'none';
        document.getElementById('pw-match-indicator').style.display = 'none';
        document.getElementById('pw-nomatch-indicator').style.display = 'none';
      }
    },

    closeModal() {
      const modal = document.getElementById('modal-forgot-password');
      if (modal) modal.style.display = 'none';
      // Clear sensitive data
      window._forgotPwEmail = null;
      window._forgotPwOtp = null;
    },

    goToStep(step) {
      // Hide all panels
      ['forgot-pw-step-1','forgot-pw-step-2','forgot-pw-step-3','forgot-pw-step-success'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      // Show target panel
      const targetPanel = document.getElementById(step === 'success' ? 'forgot-pw-step-success' : `forgot-pw-step-${step}`);
      if (targetPanel) targetPanel.style.display = 'block';

      // Update step dots
      ['fpw-step-dot-1','fpw-step-dot-2','fpw-step-dot-3'].forEach((id, idx) => {
        const dot = document.getElementById(id);
        if (!dot) return;
        dot.className = 'fpw-step';
        const dotStep = idx + 1;
        if (typeof step === 'number') {
          if (dotStep < step) dot.classList.add('done');
          else if (dotStep === step) dot.classList.add('active');
        }
      });

      // Update progress bar
      const fill = document.getElementById('forgot-pw-progress-fill');
      if (fill) {
        const pcts = { 1: '33.33%', 2: '66.66%', 3: '100%' };
        fill.style.width = typeof step === 'number' ? (pcts[step] || '100%') : '100%';
      }

      // Update header title & step label
      const titles   = { 1: 'Forgot Password', 2: 'Verify Reset Code', 3: 'Set New Password' };
      const labels   = { 1: 'Step 1 of 3 — Enter your email', 2: 'Step 2 of 3 — Enter the OTP from your email', 3: 'Step 3 of 3 — Create your new password' };
      const icons    = { 1: 'fa-key', 2: 'fa-shield-halved', 3: 'fa-lock-open' };

      const titleEl  = document.getElementById('forgot-pw-title');
      const labelEl  = document.getElementById('forgot-pw-step-label');
      const iconEl   = document.getElementById('forgot-pw-icon-el');

      if (typeof step === 'number') {
        if (titleEl) titleEl.textContent  = titles[step] || 'Reset Password';
        if (labelEl) labelEl.textContent  = labels[step] || '';
        if (iconEl)  iconEl.className     = `fa-solid ${icons[step] || 'fa-key'}`;
      } else {
        // success state
        if (titleEl) titleEl.textContent = 'All Done!';
        if (labelEl) labelEl.textContent = 'Password updated successfully';
        if (iconEl)  iconEl.className    = 'fa-solid fa-circle-check';
        // Hide progress bar on success
        const progress = document.querySelector('.forgot-pw-progress');
        if (progress) progress.style.display = 'none';
      }
    },

    goToSuccess() {
      // Hide progress bar
      const progress = document.querySelector('.forgot-pw-progress');
      if (progress) progress.style.display = 'none';
      this.goToStep('success');
    },

    checkPasswordMatch() {
      const newPass     = (document.getElementById('forgot-pw-new-pass')?.value)     || '';
      const confirmPass = (document.getElementById('forgot-pw-confirm-pass')?.value) || '';
      const matchEl     = document.getElementById('pw-match-indicator');
      const noMatchEl   = document.getElementById('pw-nomatch-indicator');

      if (!confirmPass) {
        if (matchEl) matchEl.style.display = 'none';
        if (noMatchEl) noMatchEl.style.display = 'none';
        return;
      }

      if (newPass === confirmPass) {
        if (matchEl)   matchEl.style.display   = 'flex';
        if (noMatchEl) noMatchEl.style.display  = 'none';
      } else {
        if (matchEl)   matchEl.style.display   = 'none';
        if (noMatchEl) noMatchEl.style.display  = 'flex';
      }
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
      
      const profilePhone = document.getElementById('profile-phone');
      if (profilePhone) {
        profilePhone.innerHTML = `<i class="fa-solid fa-phone" style="font-size: 10px;"></i> ${this.currentUser.phone || 'N/A'}`;
      }

      // Update Dashboard Sidebar elements
      const dashAvatar = document.getElementById('dash-sidebar-avatar');
      const dashName = document.getElementById('dash-sidebar-name');
      const dashDept = document.getElementById('dash-sidebar-dept');
      if (dashAvatar) dashAvatar.innerText = this.currentUser.fullName.charAt(0).toUpperCase();
      if (dashName) dashName.innerText = this.currentUser.fullName;
      if (dashDept) {
        dashDept.innerText = this.currentUser.role === 'admin' ? 'Administrator' : this.currentUser.department;
      }
      
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

      // Clear Dashboard Sidebar elements
      const dashAvatar = document.getElementById('dash-sidebar-avatar');
      const dashName = document.getElementById('dash-sidebar-name');
      const dashDept = document.getElementById('dash-sidebar-dept');
      if (dashAvatar) dashAvatar.innerText = 'U';
      if (dashName) dashName.innerText = 'User Name';
      if (dashDept) dashDept.innerText = 'Computing';

      document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
  }
};
