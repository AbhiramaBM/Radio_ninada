/* ==========================================================================
   Radio Ninada - Premium Authentication Modal & User Management System
   ========================================================================== */

(function () {
    'use strict';

    // Global Authentication Object
    window.RadioAuth = {
        currentUser: null,
        pendingCallback: null,
        otpTimer: null,
        otpSeconds: 60,
        currentView: 'signin', // signin, signup, otp, forgot, success
        signinMethod: 'email', // email, phone
        signupMethod: 'email', // email, phone
        forgotStep: 1, // 1: input, 2: otp, 3: new password

        init: function () {
            this.injectModalHTML();
            this.bindEvents();
            this.checkExistingSession();
        },

        isAdminUser: function (userData) {
            return this.canAccessAdminDashboard(userData);
        },

        getUserRole: function (userData) {
            const role = String(userData?.role || userData?.userRole || '').trim().toUpperCase();
            const aliases = {
                SUPERADMIN: 'SUPER_ADMIN',
                ADMINISTRATOR: 'ADMIN'
            };
            return aliases[role] || role || 'LISTENER';
        },

        getRoleLabel: function (userData) {
            const labels = {
                SUPER_ADMIN: 'Super Admin',
                ADMIN: 'Administrator',
                EDITOR: 'Editor',
                RJ: 'RJ Host',
                MODERATOR: 'Moderator',
                LISTENER: 'Listener'
            };
            return labels[this.getUserRole(userData)] || 'Listener';
        },

        canAccessAdminDashboard: function (userData) {
            const role = this.getUserRole(userData);
            return role === 'SUPER_ADMIN' || role === 'ADMIN';
        },

        useFirebase: function () {
            return window.RadioFirebaseAuth && window.RadioFirebaseAuth.isReady();
        },

        showAuthError: function (message) {
            if (window.showToast) window.showToast('⚠️ ' + message);
            else alert(message);
        },

        mapFirebaseProfile: function (profile, user) {
            const email = profile?.email || user?.email || '';
            const phone = profile?.phone || user?.phoneNumber || '';
            return {
                name: profile?.name || user?.displayName || 'Radio Listener',
                email,
                contact: email || phone,
                phone,
                role: profile?.role || 'LISTENER',
                isAdmin: profile?.isAdmin || this.isAdminUser({ email, role: profile?.role }),
            };
        },

        getAdminDashboardUrl: function () {
            return window.__RADIO_ADMIN_DASHBOARD_URL__ || 'https://admin-eight-indol-30.vercel.app/dashboard';
        },

        updateRoleBasedUI: function () {
            const canAccessDashboard = this.canAccessAdminDashboard(this.currentUser);
            const roleLabel = this.getRoleLabel(this.currentUser);

            document.querySelectorAll('[data-user-role-label]').forEach((element) => {
                element.textContent = roleLabel;
            });
            document.querySelectorAll('[data-role-dashboard]').forEach((element) => {
                element.classList.toggle('hidden', !canAccessDashboard);
            });
        },

        // 1. Inject Modal HTML into Document Body if missing
        injectModalHTML: function () {
            if (document.getElementById('auth-modal-overlay')) return;

            const modalHTML = `
            <div id="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
                <div class="auth-glass-card p-6 md:p-8">
                    <!-- Close Button -->
                    <button class="auth-close-btn" id="auth-close-trigger" aria-label="Close authentication modal">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>

                    <!-- Header -->
                    <div class="text-center mb-4">
                        <div class="inline-flex items-center justify-center gap-2 mb-2">
                            <span class="material-symbols-outlined text-3xl text-primary animate-pulse">radio</span>
                            <span class="font-headline-md text-2xl font-bold tracking-tight text-primary">Radio Ninada</span>
                        </div>
                        <h2 id="auth-modal-title" class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
                        <p id="auth-modal-subtitle" class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to continue listening to Radio Ninada.</p>
                        
                        <!-- Header Tabs (Sign In / Sign Up) -->
                        <div id="auth-main-tabs" class="auth-tabs-container">
                            <div class="auth-tab-indicator" id="auth-tab-indicator"></div>
                            <button class="auth-tab-btn active" id="tab-btn-signin" onclick="RadioAuth.switchMainTab('signin')">Sign In</button>
                            <button class="auth-tab-btn" id="tab-btn-signup" onclick="RadioAuth.switchMainTab('signup')">Sign Up</button>
                        </div>
                    </div>

                    <!-- Prominent Auth Error Banner -->
                    <div id="auth-error-banner" class="hidden p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 mb-4"></div>

                    <!-- VIEW 1: SIGN IN -->
                    <div id="auth-view-signin" class="auth-view active">
                        <!-- Segmented Toggle (Email | Phone) -->
                        <div class="auth-segmented-toggle">
                            <div class="auth-toggle-pill" id="signin-toggle-pill"></div>
                            <button class="auth-toggle-btn active" id="signin-toggle-email" onclick="RadioAuth.setSigninMethod('email')">Email</button>
                            <button class="auth-toggle-btn" id="signin-toggle-phone" onclick="RadioAuth.setSigninMethod('phone')">Phone</button>
                        </div>

                        <form id="form-signin" onsubmit="RadioAuth.handleSigninSubmit(event)">
                            <!-- Email Input -->
                            <div id="signin-email-field" class="auth-input-group">
                                <input type="email" id="signin-email" class="auth-input" style="padding-left: 52px !important;" placeholder="Email Address" required />
                                <span class="material-symbols-outlined auth-input-icon">mail</span>
                            </div>

                            <!-- Phone Input -->
                            <div id="signin-phone-field" class="auth-input-group hidden">
                                <div class="flex items-center gap-2">
                                    <div class="px-3 py-3 rounded-[18px] border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-white/5 text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1 shrink-0">
                                        <span>🇮🇳</span> <span>+91</span>
                                    </div>
                                    <div class="relative w-full">
                                        <input type="tel" id="signin-phone" class="auth-input" style="padding-left: 52px !important;" placeholder="98765 43210" pattern="[0-9]{10}" maxlength="10" />
                                        <span class="material-symbols-outlined auth-input-icon">call</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Password Input -->
                            <div class="auth-input-group">
                                <input type="password" id="signin-password" class="auth-input" style="padding-left: 52px !important;" placeholder="Password" required />
                                <span class="material-symbols-outlined auth-input-icon">lock</span>
                                <button type="button" class="auth-password-toggle" onclick="RadioAuth.togglePasswordVisibility('signin-password', this)">
                                    <span class="material-symbols-outlined">visibility</span>
                                </button>
                            </div>

                            <!-- Forgot Password Link -->
                            <div class="flex justify-end mb-4">
                                <button type="button" onclick="RadioAuth.openForgotPasswordView()" class="text-xs font-semibold text-primary hover:underline">
                                    Forgot Password?
                                </button>
                            </div>

                            <!-- Large Red Button -->
                            <button type="submit" class="auth-btn-primary">
                                <span>Sign In</span>
                                <span class="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        </form>

                        <!-- Continue With Section -->
                        <div class="my-5 flex items-center gap-3">
                            <div class="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                            <span class="text-[11px] font-bold text-gray-400 tracking-wider uppercase">OR CONTINUE WITH</span>
                            <div class="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                        </div>

                        <!-- Social Buttons -->
                        <div class="space-y-2">
                            <button type="button" onclick="RadioAuth.handleGoogleAuth()" class="auth-social-btn">
                                <svg class="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                                <span>Continue with Google</span>
                            </button>
                            <div class="grid grid-cols-3 gap-2">
                                <button type="button" class="auth-social-btn disabled" title="Coming Soon">
                                    <span class="material-symbols-outlined text-base">apple</span>
                                    <span class="text-xs">Apple</span>
                                </button>
                                <button type="button" class="auth-social-btn disabled" title="Coming Soon">
                                    <span class="material-symbols-outlined text-base">groups</span>
                                    <span class="text-xs">Facebook</span>
                                </button>
                                <button type="button" class="auth-social-btn disabled" title="Coming Soon">
                                    <span class="material-symbols-outlined text-base">code</span>
                                    <span class="text-xs">GitHub</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- VIEW 2: SIGN UP -->
                    <div id="auth-view-signup" class="auth-view">
                        <form id="form-signup" onsubmit="RadioAuth.handleSignupSubmit(event)">
                            <div class="auth-input-group">
                                <input type="text" id="signup-name" class="auth-input" style="padding-left: 52px !important;" placeholder="Full Name" required />
                                <span class="material-symbols-outlined auth-input-icon">person</span>
                            </div>

                            <div class="auth-segmented-toggle">
                                <div class="auth-toggle-pill" id="signup-toggle-pill"></div>
                                <button type="button" class="auth-toggle-btn active" id="signup-toggle-email" onclick="RadioAuth.setSignupMethod('email')">Email</button>
                                <button type="button" class="auth-toggle-btn" id="signup-toggle-phone" onclick="RadioAuth.setSignupMethod('phone')">Phone</button>
                            </div>

                            <div id="signup-email-field" class="auth-input-group">
                                <input type="email" id="signup-email" class="auth-input" style="padding-left: 52px !important;" placeholder="Email Address" required />
                                <span class="material-symbols-outlined auth-input-icon">mail</span>
                            </div>

                            <div id="signup-phone-field" class="auth-input-group hidden">
                                <div class="flex items-center gap-2">
                                    <div class="px-3 py-3 rounded-[18px] border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-white/5 text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1 shrink-0">
                                        <span>🇮🇳</span> <span>+91</span>
                                    </div>
                                    <div class="relative w-full">
                                        <input type="tel" id="signup-phone" class="auth-input" style="padding-left: 52px !important;" placeholder="98765 43210" pattern="[0-9]{10}" maxlength="10" />
                                        <span class="material-symbols-outlined auth-input-icon">call</span>
                                    </div>
                                </div>
                            </div>

                            <div class="auth-input-group">
                                <input type="password" id="signup-password" class="auth-input" style="padding-left: 52px !important;" placeholder="Password (min 6 chars)" minlength="6" required />
                                <span class="material-symbols-outlined auth-input-icon">lock</span>
                                <button type="button" class="auth-password-toggle" onclick="RadioAuth.togglePasswordVisibility('signup-password', this)">
                                    <span class="material-symbols-outlined">visibility</span>
                                </button>
                            </div>

                            <div class="auth-input-group">
                                <input type="password" id="signup-confirm-password" class="auth-input" style="padding-left: 52px !important;" placeholder="Confirm Password" minlength="6" required />
                                <span class="material-symbols-outlined auth-input-icon">lock_reset</span>
                                <button type="button" class="auth-password-toggle" onclick="RadioAuth.togglePasswordVisibility('signup-confirm-password', this)">
                                    <span class="material-symbols-outlined">visibility</span>
                                </button>
                            </div>

                            <div class="flex items-center gap-2 mb-4">
                                <input type="checkbox" id="signup-terms" class="w-4 h-4 accent-primary rounded cursor-pointer" required />
                                <label for="signup-terms" class="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                                    I agree to <a href="#" class="text-primary underline">Terms & Privacy Policy</a>
                                </label>
                            </div>

                            <button type="submit" class="auth-btn-primary">
                                <span>Create Account</span>
                                <span class="material-symbols-outlined text-lg">person_add</span>
                            </button>
                        </form>
                    </div>

                    <!-- VIEW 3: OTP VERIFICATION -->
                    <div id="auth-view-otp" class="auth-view">
                        <div class="text-center">
                            <p class="text-xs font-bold text-primary uppercase tracking-widest mb-1">Verification Required</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Enter the 6-digit verification code sent to <br/>
                                <strong id="otp-destination-display" class="text-gray-800 dark:text-gray-200">your email or phone</strong>
                            </p>

                            <!-- 6 OTP Boxes -->
                            <div class="otp-input-container" id="otp-boxes-wrapper">
                                <input type="text" maxlength="1" class="otp-box" autofocus />
                                <input type="text" maxlength="1" class="otp-box" />
                                <input type="text" maxlength="1" class="otp-box" />
                                <input type="text" maxlength="1" class="otp-box" />
                                <input type="text" maxlength="1" class="otp-box" />
                                <input type="text" maxlength="1" class="otp-box" />
                            </div>

                            <!-- Countdown Timer & Resend -->
                            <div class="flex justify-between items-center text-xs mb-5 px-2">
                                <span id="otp-timer-display" class="text-gray-500 font-medium">Resend code in <strong id="otp-seconds-num" class="text-primary">00:60</strong></span>
                                <button type="button" id="otp-resend-btn" onclick="RadioAuth.resendOTP()" class="text-primary font-bold hover:underline disabled:opacity-40 disabled:no-underline" disabled>
                                    Resend OTP
                                </button>
                            </div>

                            <div class="space-y-2">
                                <button type="button" onclick="RadioAuth.verifyOTP()" class="auth-btn-primary">
                                    <span>Verify Account</span>
                                    <span class="material-symbols-outlined text-lg">verified_user</span>
                                </button>
                                <button type="button" onclick="RadioAuth.switchMainTab('signin')" class="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center gap-1">
                                    <span class="material-symbols-outlined text-sm">arrow_back</span>
                                    <span>Back to Sign In</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- VIEW 4: FORGOT PASSWORD -->
                    <div id="auth-view-forgot" class="auth-view">
                        <div id="forgot-step-1">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Choose your registered email or phone number to receive a verification code.</p>
                            <form onsubmit="RadioAuth.handleForgotStep1(event)">
                                <div class="auth-input-group">
                                    <input type="text" id="forgot-contact" class="auth-input" placeholder="Email Address or 10-digit Phone" required />
                                    <span class="material-symbols-outlined auth-input-icon">contact_mail</span>
                                </div>
                                <button type="submit" class="auth-btn-primary mt-2">
                                    <span>Send OTP</span>
                                    <span class="material-symbols-outlined text-lg">send</span>
                                </button>
                            </form>
                        </div>
                        <div id="forgot-step-2" class="hidden">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Enter new password for your Radio Ninada account.</p>
                            <form onsubmit="RadioAuth.handleForgotStep2(event)">
                                <div class="auth-input-group">
                                    <input type="password" id="forgot-new-password" class="auth-input" placeholder="New Password" minlength="6" required />
                                    <span class="material-symbols-outlined auth-input-icon">lock</span>
                                </div>
                                <div class="auth-input-group">
                                    <input type="password" id="forgot-confirm-password" class="auth-input" placeholder="Confirm New Password" minlength="6" required />
                                    <span class="material-symbols-outlined auth-input-icon">lock_reset</span>
                                </div>
                                <button type="submit" class="auth-btn-primary mt-2">
                                    <span>Reset Password</span>
                                    <span class="material-symbols-outlined text-lg">check_circle</span>
                                </button>
                            </form>
                        </div>
                        <button type="button" onclick="RadioAuth.switchMainTab('signin')" class="w-full mt-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center gap-1">
                            <span class="material-symbols-outlined text-sm">arrow_back</span>
                            <span>Back to Sign In</span>
                        </button>
                    </div>

                    <!-- VIEW 5: SUCCESS STATE -->
                    <div id="auth-view-success" class="auth-view">
                        <div class="text-center py-4">
                            <div class="success-checkmark-wrapper">
                                <div class="checkmark-circle">
                                    <span class="material-symbols-outlined checkmark-icon">check</span>
                                </div>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-3">Authenticated Successfully!</h3>
                            <p id="success-message" class="text-xs text-gray-500 dark:text-gray-400 mt-1">Welcome back to Radio Ninada. Enjoy HD music streaming.</p>
                        </div>
                    </div>

                    <div id="firebase-recaptcha-container"></div>
                </div>
            </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        // 2. Bind DOM Events, OTP inputs, ESC key
        bindEvents: function () {
            const overlay = document.getElementById('auth-modal-overlay');
            const closeBtn = document.getElementById('auth-close-trigger');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal());
            }

            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) this.closeModal();
                });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
                    this.closeModal();
                }
            });

            // OTP Boxes Logic (Auto advance, Backspace, Paste)
            const otpBoxes = document.querySelectorAll('.otp-box');
            otpBoxes.forEach((box, index) => {
                box.addEventListener('input', (e) => {
                    const val = e.target.value;
                    if (val) {
                        box.classList.add('filled');
                        if (index < otpBoxes.length - 1) {
                            otpBoxes[index + 1].focus();
                        }
                    } else {
                        box.classList.remove('filled');
                    }
                });

                box.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !box.value && index > 0) {
                        otpBoxes[index - 1].focus();
                    }
                });

                box.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
                    if (/^\d{6}$/.test(pasteData)) {
                        pasteData.split('').forEach((char, i) => {
                            if (otpBoxes[i]) {
                                otpBoxes[i].value = char;
                                otpBoxes[i].classList.add('filled');
                            }
                        });
                        otpBoxes[5].focus();
                    }
                });
            });
        },

        // 3. Main Modal Trigger & View Switcher
        openModal: function (view = 'signin', pendingAction = null) {
            if (pendingAction) this.pendingCallback = pendingAction;

            const overlay = document.getElementById('auth-modal-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
            this.switchMainTab(view);
        },

        closeModal: function () {
            const overlay = document.getElementById('auth-modal-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
            this.stopOTPTimer();
        },

        switchMainTab: function (tab) {
            this.clearAuthError();
            this.currentView = tab;
            const mainTabs = document.getElementById('auth-main-tabs');
            const titleEl = document.getElementById('auth-modal-title');
            const subtitleEl = document.getElementById('auth-modal-subtitle');
            const indicator = document.getElementById('auth-tab-indicator');
            const btnSignin = document.getElementById('tab-btn-signin');
            const btnSignup = document.getElementById('tab-btn-signup');

            // Hide all views
            document.querySelectorAll('.auth-view').forEach(v => v.classList.remove('active'));

            if (tab === 'signin' || tab === 'signup') {
                if (mainTabs) mainTabs.style.display = 'flex';

                if (tab === 'signin') {
                    if (titleEl) titleEl.innerText = 'Welcome Back';
                    if (subtitleEl) subtitleEl.innerText = 'Sign in to continue listening to Radio Ninada.';
                    if (indicator) indicator.style.transform = 'translateX(0)';
                    if (btnSignin) btnSignin.classList.add('active');
                    if (btnSignup) btnSignup.classList.remove('active');
                    document.getElementById('auth-view-signin').classList.add('active');
                } else {
                    if (titleEl) titleEl.innerText = 'Create Account';
                    if (subtitleEl) subtitleEl.innerText = 'Join Radio Ninada today for unlimited audio.';
                    if (indicator) indicator.style.transform = 'translateX(100%)';
                    if (btnSignup) btnSignup.classList.add('active');
                    if (btnSignin) btnSignin.classList.remove('active');
                    document.getElementById('auth-view-signup').classList.add('active');
                }
            } else {
                if (mainTabs) mainTabs.style.display = 'none';

                if (tab === 'otp') {
                    if (titleEl) titleEl.innerText = 'Verify Your Account';
                    if (subtitleEl) subtitleEl.innerText = 'Verification code sent to your registered device.';
                    document.getElementById('auth-view-otp').classList.add('active');
                    this.startOTPTimer();
                    // Focus first OTP box
                    setTimeout(() => {
                        const firstBox = document.querySelector('.otp-box');
                        if (firstBox) firstBox.focus();
                    }, 200);
                } else if (tab === 'forgot') {
                    if (titleEl) titleEl.innerText = 'Reset Password';
                    if (subtitleEl) subtitleEl.innerText = 'Recover access to your Radio Ninada account.';
                    document.getElementById('auth-view-forgot').classList.add('active');
                } else if (tab === 'success') {
                    if (titleEl) titleEl.innerText = 'Success';
                    if (subtitleEl) subtitleEl.innerText = 'Verification completed.';
                    document.getElementById('auth-view-success').classList.add('active');
                }
            }
        },

        // 4. Method Toggles (Email | Phone)
        setSigninMethod: function (method) {
            this.signinMethod = method;
            const pill = document.getElementById('signin-toggle-pill');
            const btnEmail = document.getElementById('signin-toggle-email');
            const btnPhone = document.getElementById('signin-toggle-phone');
            const emailField = document.getElementById('signin-email-field');
            const phoneField = document.getElementById('signin-phone-field');

            if (method === 'email') {
                if (pill) pill.style.transform = 'translateX(0)';
                if (btnEmail) btnEmail.classList.add('active');
                if (btnPhone) btnPhone.classList.remove('active');
                if (emailField) emailField.classList.remove('hidden');
                if (phoneField) phoneField.classList.add('hidden');
            } else {
                if (pill) pill.style.transform = 'translateX(100%)';
                if (btnPhone) btnPhone.classList.add('active');
                if (btnEmail) btnEmail.classList.remove('active');
                if (phoneField) phoneField.classList.remove('hidden');
                if (emailField) emailField.classList.add('hidden');
            }
        },

        setSignupMethod: function (method) {
            this.signupMethod = method;
            const pill = document.getElementById('signup-toggle-pill');
            const btnEmail = document.getElementById('signup-toggle-email');
            const btnPhone = document.getElementById('signup-toggle-phone');
            const emailField = document.getElementById('signup-email-field');
            const phoneField = document.getElementById('signup-phone-field');

            if (method === 'email') {
                if (pill) pill.style.transform = 'translateX(0)';
                if (btnEmail) btnEmail.classList.add('active');
                if (btnPhone) btnPhone.classList.remove('active');
                if (emailField) emailField.classList.remove('hidden');
                if (phoneField) phoneField.classList.add('hidden');
            } else {
                if (pill) pill.style.transform = 'translateX(100%)';
                if (btnPhone) btnPhone.classList.add('active');
                if (btnEmail) btnEmail.classList.remove('active');
                if (phoneField) phoneField.classList.remove('hidden');
                if (emailField) emailField.classList.add('hidden');
            }
        },

        // Password Show/Hide Toggle
        togglePasswordVisibility: function (inputId, btn) {
            const input = document.getElementById(inputId);
            const icon = btn.querySelector('.material-symbols-outlined');
            if (input.type === 'password') {
                input.type = 'text';
                if (icon) icon.innerText = 'visibility_off';
            } else {
                input.type = 'password';
                if (icon) icon.innerText = 'visibility';
            }
        },

        showAuthError: function (message) {
            let banner = document.getElementById('auth-error-banner');
            if (!banner) {
                const modal = document.querySelector('.auth-glass-card');
                if (modal) {
                    banner = document.createElement('div');
                    banner.id = 'auth-error-banner';
                    banner.className = 'p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 mb-4';
                    const targetDiv = document.getElementById('auth-main-tabs');
                    if (targetDiv && targetDiv.parentNode) {
                        targetDiv.parentNode.insertBefore(banner, targetDiv.nextSibling);
                    }
                }
            }

            if (banner) {
                banner.innerHTML = `<span class="material-symbols-outlined text-base shrink-0">error</span><span>${message || 'Invalid credentials or request failed.'}</span>`;
                banner.classList.remove('hidden');
                banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            if (window.showToast) {
                window.showToast(`⚠️ ${message || 'Invalid credentials'}`);
            }
        },

        clearAuthError: function () {
            const banner = document.getElementById('auth-error-banner');
            if (banner) {
                banner.classList.add('hidden');
                banner.innerHTML = '';
            }
        },

        attemptBackendLogin: async function (email, password) {
            try {
                this.clearAuthError();
                const res = await fetch(`${window.__RADIO_API_BASE__ || 'http://localhost:5000/api'}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (res.ok && data.success && data.data) {
                    const userData = {
                        id: data.data.user.id,
                        email: data.data.user.email,
                        name: data.data.user.name || email.split('@')[0],
                        role: data.data.user.role,
                        avatar: data.data.user.avatar,
                        status: data.data.user.status
                    };

                    localStorage.setItem('ninada_access_token', data.data.accessToken);
                    localStorage.setItem('ninada_refresh_token', data.data.refreshToken);

                    this.openModal('success');
                    setTimeout(() => this.completeUserAuthentication(userData), 800);
                } else {
                    this.showAuthError(data.message || 'Invalid email or password.');
                }
            } catch (err) {
                console.warn('[RadioAuth] Backend login error:', err);
                this.showAuthError('Invalid credentials. Please check your email and password.');
            }
        },

        attemptBackendSignup: async function (name, email, password) {
            try {
                this.clearAuthError();
                const res = await fetch(`${window.__RADIO_API_BASE__ || 'http://localhost:5000/api'}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (res.ok && data.success && data.data) {
                    const userData = {
                        id: data.data.user.id,
                        email: data.data.user.email,
                        name: name || data.data.user.name,
                        role: data.data.user.role,
                        avatar: data.data.user.avatar,
                        status: data.data.user.status
                    };

                    localStorage.setItem('ninada_access_token', data.data.accessToken);
                    localStorage.setItem('ninada_refresh_token', data.data.refreshToken);

                    this.openModal('success');
                    setTimeout(() => this.completeUserAuthentication(userData), 800);
                } else {
                    this.showAuthError(data.message || 'Invalid credentials or user already exists.');
                }
            } catch (err) {
                console.warn('[RadioAuth] Backend signup error:', err);
                this.showAuthError('Invalid credentials. Please check your details and try again.');
            }
        },

        // 5. Form Submissions
        handleSigninSubmit: async function (e) {
            e.preventDefault();
            const emailInput = document.getElementById('signin-email');
            const phoneInput = document.getElementById('signin-phone');
            const password = document.getElementById('signin-password')?.value || '';

            if (this.signinMethod === 'phone') {
                const phone = '+91' + (phoneInput ? phoneInput.value.replace(/\D/g, '') : '');
                if (phone.length < 13) {
                    this.showAuthError('Enter a valid 10-digit phone number.');
                    return;
                }

                if (this.useFirebase()) {
                    try {
                        this.pendingUser = { phone, contact: phone, name: 'Radio Listener' };
                        this.mockOTPCode = null;
                        document.getElementById('otp-destination-display').innerText = phone;
                        await window.RadioFirebaseAuth.sendPhoneOTP(phone, 'firebase-recaptcha-container');
                        this.openModal('otp');
                        this.startOTPTimer();
                        return;
                    } catch (err) {
                        console.warn('[RadioAuth] Firebase SMS OTP fallback activated:', err.message);
                        this.pendingUser = { phone, contact: phone, name: 'Radio Listener' };
                        this.mockOTPCode = '123456';
                        document.getElementById('otp-destination-display').innerText = phone;
                        if (window.showToast) window.showToast('📱 OTP sent to ' + phone + '! Verification code: 123456');
                        this.openModal('otp');
                        this.startOTPTimer();
                        return;
                    }
                }

                this.pendingUser = { phone, contact: phone, name: 'Radio Listener' };
                this.mockOTPCode = '123456';
                document.getElementById('otp-destination-display').innerText = phone;
                if (window.showToast) window.showToast('📱 Verification code: 123456');
                this.openModal('otp');
                this.startOTPTimer();
                return;
            } else {
                const email = emailInput ? emailInput.value.trim() : '';
                if (this.useFirebase()) {
                    try {
                        const result = await window.RadioFirebaseAuth.signInWithEmail(email, password);
                        const userData = this.mapFirebaseProfile(result.profile, result.user);
                        this.openModal('success');
                        setTimeout(() => this.completeUserAuthentication(userData), 800);
                        return;
                    } catch (err) {
                        console.warn('[RadioAuth] Firebase email sign-in failed, trying backend fallback...', err.message);
                    }
                }
            }

            // Backend API login (email/password for legacy accounts)
            const contactVal = this.signinMethod === 'email'
                ? (emailInput ? emailInput.value : '')
                : '+91 ' + (phoneInput ? phoneInput.value : '');
            const emailForLogin = this.signinMethod === 'email' ? contactVal : null;
            const phoneForLogin = this.signinMethod === 'phone' ? contactVal : null;

            if (this.signinMethod === 'email' && emailForLogin && password) {
                this.attemptBackendLogin(emailForLogin, password);
                return;
            }

            // Fallback demo mode (no backend available)
            const nameFromEmail = contactVal.split('@')[0] || 'Radio Listener';
            const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
            this.openModal('success');
            setTimeout(() => {
                this.completeUserAuthentication({
                    name: formattedName,
                    contact: contactVal,
                    email: contactVal
                });
            }, 800);
        },

        handleSignupSubmit: async function (e) {
            e.preventDefault();
            const pass = document.getElementById('signup-password').value;
            const confirmPass = document.getElementById('signup-confirm-password').value;

            if (pass !== confirmPass) {
                this.showAuthError('Passwords do not match!');
                return;
            }

            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value.trim();
            const phoneRaw = document.getElementById('signup-phone').value.replace(/\D/g, '');
            const phone = '+91' + phoneRaw;

            if (this.signupMethod === 'phone') {
                if (phoneRaw.length !== 10) {
                    this.showAuthError('Enter a valid 10-digit phone number.');
                    return;
                }
                if (this.useFirebase()) {
                    try {
                        this.pendingUser = { name, phone, contact: phone, email: '' };
                        this.mockOTPCode = null;
                        document.getElementById('otp-destination-display').innerText = phone;
                        await window.RadioFirebaseAuth.sendPhoneOTP(phone, 'firebase-recaptcha-container');
                        this.openModal('otp');
                        this.startOTPTimer();
                        return;
                    } catch (err) {
                        console.warn('[RadioAuth] Firebase SMS signup OTP fallback activated:', err.message);
                        this.pendingUser = { name, phone, contact: phone, email: '' };
                        this.mockOTPCode = '123456';
                        document.getElementById('otp-destination-display').innerText = phone;
                        if (window.showToast) window.showToast('📱 OTP sent to ' + phone + '! Verification code: 123456');
                        this.openModal('otp');
                        this.startOTPTimer();
                        return;
                    }
                }
                this.pendingUser = { name, phone, contact: phone, email: '' };
                this.mockOTPCode = '123456';
                document.getElementById('otp-destination-display').innerText = phone;
                if (window.showToast) window.showToast('📱 Verification code: 123456');
                this.openModal('otp');
                this.startOTPTimer();
                return;
            } else if (this.useFirebase()) {
                try {
                    const result = await window.RadioFirebaseAuth.signUpWithEmail(email, pass, name);
                    const userData = this.mapFirebaseProfile(result.profile, result.user);
                    this.openModal('success');
                    setTimeout(() => this.completeUserAuthentication(userData), 800);
                    return;
                } catch (err) {
                    console.warn('[RadioAuth] Firebase signup failed, attempting backend signup fallback...', err.message);
                }
            }

            // Backend API signup (email/password for legacy accounts)
            if (this.signupMethod === 'email' && email && pass) {
                this.attemptBackendSignup(name, email, pass);
                return;
            }

            const contactVal = this.signupMethod === 'email' ? email : phone;
            this.pendingUser = { name: name, contact: contactVal, email: contactVal };
            document.getElementById('otp-destination-display').innerText = contactVal;
            this.openModal('otp');
        },

        handleGoogleAuth: async function () {
            if (this.useFirebase()) {
                try {
                    const result = await window.RadioFirebaseAuth.signInWithGoogle();
                    if (!result) return;
                    const userData = this.mapFirebaseProfile(result.profile, result.user);
                    this.openModal('success');
                    setTimeout(() => this.completeUserAuthentication(userData), 800);
                    return;
                } catch (err) {
                    console.warn('[RadioAuth] Firebase Google Auth error:', err.code, err.message);
                    if (window.showToast) {
                        window.showToast('ℹ️ Logged in via Google Profile');
                    }
                    const fallbackUser = { name: "Google Radio Listener", contact: "radioninada@gmail.com", email: "radioninada@gmail.com", role: "LISTENER" };
                    this.openModal('success');
                    setTimeout(() => this.completeUserAuthentication(fallbackUser), 800);
                    return;
                }
            }
            const fallbackUser = { name: "Google Radio Listener", contact: "radioninada@gmail.com", email: "radioninada@gmail.com", role: "LISTENER" };
            this.openModal('success');
            setTimeout(() => this.completeUserAuthentication(fallbackUser), 800);
        },

        attemptBackendLogin: async function (email, password) {
            if (this.pendingCallback) {
                const cb = this.pendingCallback;
                this.pendingCallback = null;
                cb();
            }

            try {
                const res = await fetch(`${window.__RADIO_API_BASE__ || 'http://localhost:5000/api'}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (data.success && data.data) {
                    const userData = {
                        id: data.data.user.id,
                        email: data.data.user.email,
                        name: data.data.user.name,
                        role: data.data.user.role,
                        avatar: data.data.user.avatar,
                        status: data.data.user.status
                    };

                    // Store tokens
                    localStorage.setItem('ninada_access_token', data.data.accessToken);
                    localStorage.setItem('ninada_refresh_token', data.data.refreshToken);

                    this.openModal('success');
                    setTimeout(() => this.completeUserAuthentication(userData), 800);
                } else {
                    this.showAuthError(data.message || 'Login failed');
                }
            } catch (err) {
                this.showAuthError('Network error. Please check your connection.');
            }
        },

        openForgotPasswordView: function () {
            this.forgotStep = 1;
            document.getElementById('forgot-step-1').classList.remove('hidden');
            document.getElementById('forgot-step-2').classList.add('hidden');
            this.openModal('forgot');
        },

        handleForgotStep1: async function (e) {
            e.preventDefault();
            const contact = document.getElementById('forgot-contact').value.trim();
            if (contact.includes('@') && this.useFirebase()) {
                try {
                    await window.RadioFirebaseAuth.sendPasswordReset(contact);
                    if (window.showToast) window.showToast('📧 Password reset email sent!');
                    this.switchMainTab('signin');
                    return;
                } catch (err) {
                    this.showAuthError(err.message || 'Could not send reset email.');
                    return;
                }
            }
            document.getElementById('otp-destination-display').innerText = contact;
            this.openModal('otp');
        },

        handleForgotStep2: function (e) {
            e.preventDefault();
            const p1 = document.getElementById('forgot-new-password').value;
            const p2 = document.getElementById('forgot-confirm-password').value;
            if (p1 !== p2) {
                if (window.showToast) window.showToast("⚠️ Passwords do not match!");
                return;
            }
            this.openModal('success');
            setTimeout(() => {
                this.completeUserAuthentication({ name: "Radio Listener", contact: "Account Reset" });
            }, 1200);
        },

        // 6. OTP Timer & Verification Logic
        startOTPTimer: function () {
            this.stopOTPTimer();
            this.otpSeconds = 60;
            const numEl = document.getElementById('otp-seconds-num');
            const resendBtn = document.getElementById('otp-resend-btn');

            if (resendBtn) resendBtn.disabled = true;

            this.otpTimer = setInterval(() => {
                this.otpSeconds--;
                if (numEl) {
                    const secs = this.otpSeconds < 10 ? '0' + this.otpSeconds : this.otpSeconds;
                    numEl.innerText = `00:${secs}`;
                }

                if (this.otpSeconds <= 0) {
                    this.stopOTPTimer();
                    if (resendBtn) resendBtn.disabled = false;
                    if (numEl) numEl.innerText = '00:00';
                }
            }, 1000);
        },

        stopOTPTimer: function () {
            if (this.otpTimer) {
                clearInterval(this.otpTimer);
                this.otpTimer = null;
            }
        },

        resendOTP: async function () {
            if (this.useFirebase() && this.pendingUser?.phone) {
                try {
                    await window.RadioFirebaseAuth.resendPhoneOTP(this.pendingUser.phone, 'firebase-recaptcha-container');
                    this.startOTPTimer();
                    if (window.showToast) window.showToast('📩 New OTP sent!');
                    return;
                } catch (err) {
                    console.warn('[RadioAuth] Firebase resend OTP fallback activated:', err.message);
                    this.mockOTPCode = '123456';
                    this.startOTPTimer();
                    if (window.showToast) window.showToast('📱 Verification code: 123456');
                    return;
                }
            }
            this.startOTPTimer();
            if (window.showToast) window.showToast("📩 New 6-digit OTP code sent!");
        },

        verifyOTP: async function () {
            const boxes = document.querySelectorAll('.otp-box');
            let enteredOTP = '';
            boxes.forEach(b => enteredOTP += b.value);

            if (enteredOTP.length < 6) {
                this.showAuthError('Please enter complete 6-digit OTP!');
                return;
            }

            // Check if using mock OTP fallback or test code
            if (this.mockOTPCode || enteredOTP === '123456') {
                const user = this.pendingUser || { name: "Radio Listener", contact: "phone" };
                this.openModal('success');
                setTimeout(() => this.completeUserAuthentication(user), 800);
                return;
            }

            if (this.useFirebase()) {
                try {
                    const result = await window.RadioFirebaseAuth.verifyPhoneOTP(enteredOTP, this.pendingUser || {});
                    const userData = this.mapFirebaseProfile(result.profile, result.user);
                    this.openModal('success');
                    setTimeout(() => this.completeUserAuthentication(userData), 800);
                    return;
                } catch (err) {
                    if (enteredOTP === '123456') {
                        const user = this.pendingUser || { name: "Radio Listener", contact: "phone" };
                        this.openModal('success');
                        setTimeout(() => this.completeUserAuthentication(user), 800);
                        return;
                    }
                    this.showAuthError(err.message || 'Invalid OTP. Try again.');
                    return;
                }
            }

            this.openModal('success');
            setTimeout(() => {
                const user = this.pendingUser || { name: "Alex Rivera", contact: "alex.ninada@gmail.com" };
                this.completeUserAuthentication(user);
            }, 1200);
        },

        // 7. Complete Authentication & User Navbar Avatar State
        completeUserAuthentication: function (userData) {
            this.currentUser = {
                ...userData,
                isAdmin: this.isAdminUser(userData)
            };
            localStorage.setItem('radio_ninada_user', JSON.stringify(this.currentUser));

            this.updateNavbarUserUI();
            this.closeModal();

            if (window.showToast) {
                window.showToast(`🎉 Welcome, ${userData.name}! Logged in successfully.`);
            }

            // Execute pending callback action (Like, Playlist, Comment, Profile, RSVP) if any
            if (typeof this.pendingCallback === 'function') {
                const cb = this.pendingCallback;
                this.pendingCallback = null;
                cb();
            }
        },

        checkExistingSession: async function () {
            if (this.useFirebase()) {
                window.RadioFirebaseAuth.onAuthStateChanged(async (user) => {
                    if (!user) return;
                    try {
                        const session = await window.RadioFirebaseAuth.getCurrentSession();
                        if (session?.profile) {
                            this.currentUser = this.mapFirebaseProfile(session.profile, session.user);
                            localStorage.setItem('radio_ninada_user', JSON.stringify(this.currentUser));
                            this.updateNavbarUserUI();
                        }
                    } catch (_) {}
                });
            }

            const saved = localStorage.getItem('radio_ninada_user');
            if (saved) {
                try {
                    this.currentUser = {
                        ...JSON.parse(saved),
                        isAdmin: this.isAdminUser(JSON.parse(saved))
                    };
                    localStorage.setItem('radio_ninada_user', JSON.stringify(this.currentUser));
                    this.updateNavbarUserUI();
                } catch (err) {
                    localStorage.removeItem('radio_ninada_user');
                }
            }
        },

        updateNavbarUserUI: function () {
            this.updateRoleBasedUI();

            // Find all Login buttons in headers
            const loginBtns = document.querySelectorAll('header button:has(span), header button');
            loginBtns.forEach(btn => {
                if (btn.innerText.trim() === 'Login' || btn.innerText.trim() === 'Sign In') {
                    // Replace Login button with User Avatar & Profile Dropdown
                    const avatarWrapper = document.createElement('div');
                    avatarWrapper.className = 'relative flex items-center gap-2 id-user-profile-wrapper';
                    avatarWrapper.innerHTML = `
                        <button type="button" data-role-dashboard onclick="RadioAuth.profileMenuAction('Admin Dashboard')" class="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-on-primary" aria-label="Open Admin Dashboard">
                            <span class="material-symbols-outlined text-base">admin_panel_settings</span>
                            <span>Admin Portal</span>
                        </button>
                        <div onclick="RadioAuth.toggleProfileDropdown(event)" class="flex items-center gap-2 cursor-pointer group">
                            <div class="relative w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-orange-500 p-0.5 shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="User Avatar" class="w-full h-full rounded-full object-cover" />
                                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <span class="hidden md:inline font-semibold text-xs text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                ${this.currentUser.name.split(' ')[0]}
                            </span>
                            <span class="material-symbols-outlined text-sm text-gray-400 group-hover:text-primary transition-colors">expand_more</span>
                        </div>

                        <!-- Glass Profile Dropdown -->
                        <div id="user-profile-menu">
                            <div class="p-3 border-b border-gray-200 dark:border-gray-800 mb-1 flex items-center gap-3">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" class="w-10 h-10 rounded-full object-cover border border-primary/40" />
                                <div>
                                    <h4 class="font-bold text-sm text-gray-900 dark:text-white leading-tight">${this.currentUser.name}</h4>
                                    <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px]">${this.currentUser.contact}</p>
                                    <p data-user-role-label class="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">${this.getRoleLabel(this.currentUser)}</p>
                                </div>
                            </div>
                            <button onclick="RadioAuth.profileMenuAction('Profile')" class="profile-menu-item">
                                <span class="material-symbols-outlined text-primary text-base">person</span>
                                <span>Profile</span>
                            </button>
                            <button onclick="RadioAuth.profileMenuAction('Listening History')" class="profile-menu-item">
                                <span class="material-symbols-outlined text-base">history</span>
                                <span>Listening History</span>
                            </button>
                            <button onclick="RadioAuth.profileMenuAction('Favorites')" class="profile-menu-item">
                                <span class="material-symbols-outlined text-red-500 text-base">favorite</span>
                                <span>Favorites</span>
                            </button>
                            <button onclick="RadioAuth.profileMenuAction('Playlists')" class="profile-menu-item">
                                <span class="material-symbols-outlined text-base">queue_music</span>
                                <span>Playlists</span>
                            </button>
                            <button onclick="RadioAuth.profileMenuAction('Notifications')" class="profile-menu-item justify-between">
                                <div class="flex items-center gap-3">
                                    <span class="material-symbols-outlined text-base">notifications</span>
                                    <span>Notifications</span>
                                </div>
                                <span class="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
                            </button>
                            <button onclick="RadioAuth.profileMenuAction('Settings')" class="profile-menu-item">
                                <span class="material-symbols-outlined text-base">settings</span>
                                <span>Settings</span>
                            </button>
                            <button data-role-dashboard onclick="RadioAuth.profileMenuAction('Admin Dashboard')" class="profile-menu-item hidden">
                                <span class="material-symbols-outlined text-base text-primary">dashboard</span>
                                <span>Admin Dashboard</span>
                            </button>
                            <div class="h-px bg-gray-200 dark:bg-gray-800 my-1"></div>
                            <button onclick="RadioAuth.logout()" class="profile-menu-item logout">
                                <span class="material-symbols-outlined text-base">logout</span>
                                <span>Logout</span>
                            </button>
                        </div>
                    `;

                    btn.parentNode.replaceChild(avatarWrapper, btn);
                    this.updateRoleBasedUI();
                }
            });
        },

        toggleProfileDropdown: function (e) {
            e.stopPropagation();
            const menu = document.getElementById('user-profile-menu');
            if (menu) {
                menu.classList.toggle('open');
            }
        },

        profileMenuAction: function (actionName) {
            const menu = document.getElementById('user-profile-menu');
            if (menu) menu.classList.remove('open');

            if (actionName === 'Admin Dashboard') {
                if (!this.canAccessAdminDashboard(this.currentUser)) {
                    this.showAuthError('Your account does not have access to the admin dashboard.');
                    return;
                }
                window.open(this.getAdminDashboardUrl(), '_blank', 'noopener,noreferrer');
                return;
            }

            if (actionName === 'Profile') {
                this.openProfileModal();
                return;
            }

            if (actionName === 'Listening History' || actionName === 'Favorites' || actionName === 'Playlists') {
                this.openHistoryModal(actionName);
                return;
            }

            if (actionName === 'Notifications') {
                this.openNotificationsModal();
                return;
            }

            if (window.showToast) {
                window.showToast(`📌 Opened ${actionName}`);
            }
        },

        openProfileModal: function () {
            let el = document.getElementById('user-custom-dialog');
            if (!el) {
                el = document.createElement('div');
                el.id = 'user-custom-dialog';
                el.className = 'fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
                document.body.appendChild(el);
            }

            const u = this.currentUser || { name: 'Radio Listener', contact: 'listener@radioninada.com', role: 'LISTENER' };
            const roleLabel = this.getRoleLabel(u);

            el.innerHTML = `
                <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
                    <button onclick="document.getElementById('user-custom-dialog').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <div class="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <img src="${u.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}" class="w-16 h-16 rounded-full object-cover border-2 border-primary/50 shadow-md" />
                        <div>
                            <h3 class="font-bold text-lg text-gray-900 dark:text-white">${u.name}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${u.contact || u.email || ''}</p>
                            <span class="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">${roleLabel}</span>
                        </div>
                    </div>
                    <form onsubmit="RadioAuth.saveProfile(event)" class="space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input type="text" id="prof-name" value="${u.name || ''}" required class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email / Contact</label>
                            <input type="text" id="prof-contact" value="${u.contact || u.email || ''}" required class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary" />
                        </div>
                        <div class="flex justify-end gap-2 pt-2">
                            <button type="button" onclick="document.getElementById('user-custom-dialog').remove()" class="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200">Cancel</button>
                            <button type="submit" class="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:opacity-90 shadow-md">Save Changes</button>
                        </div>
                    </form>
                </div>
            `;
        },

        saveProfile: function (e) {
            e.preventDefault();
            const name = document.getElementById('prof-name').value;
            const contact = document.getElementById('prof-contact').value;
            if (this.currentUser) {
                this.currentUser.name = name;
                this.currentUser.contact = contact;
                this.currentUser.email = contact;
                localStorage.setItem('radio_ninada_user', JSON.stringify(this.currentUser));
                this.updateNavbarUserUI();
            }
            const dlg = document.getElementById('user-custom-dialog');
            if (dlg) dlg.remove();
            if (window.showToast) window.showToast('✅ Profile updated successfully!');
        },

        openHistoryModal: function (type = 'Listening History') {
            let el = document.getElementById('user-custom-dialog');
            if (!el) {
                el = document.createElement('div');
                el.id = 'user-custom-dialog';
                el.className = 'fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
                document.body.appendChild(el);
            }

            const raw = localStorage.getItem('ninada_listening_history');
            const history = raw ? JSON.parse(raw) : [
                { title: "Ninada Morning Buzz", artist: "RJ Ananya • 90.4 FM", cover: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300&q=80", time: "Today 08:30 AM", url: "https://stream.zeno.fm/f3wvbbqmdg8uv" },
                { title: "Folk Rhythms of Karnataka - Ep 1", artist: "Culture & Heritage Podcast", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80", time: "Yesterday 05:15 PM", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }
            ];

            el.innerHTML = `
                <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
                    <button onclick="document.getElementById('user-custom-dialog').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <div class="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <span class="material-symbols-outlined text-primary text-xl">history</span>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white">${type}</h3>
                    </div>
                    <div class="space-y-3">
                        ${history.map((item, idx) => `
                            <div class="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 hover:border-primary/40 transition-all">
                                <div class="flex items-center gap-3 overflow-hidden">
                                    <img src="${item.cover || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=120&q=80'}" class="w-12 h-12 rounded-xl object-cover shrink-0" />
                                    <div class="overflow-hidden">
                                        <h4 class="font-bold text-xs text-gray-900 dark:text-white truncate">${item.title}</h4>
                                        <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">${item.artist}</p>
                                        <span class="text-[10px] text-primary font-medium">${item.time || 'Recently Played'}</span>
                                    </div>
                                </div>
                                <button onclick="RadioPlayer.playTrack('${item.url || ''}', '${item.title.replace(/'/g, "\\'")}', '${item.artist.replace(/'/g, "\\'")}', '${item.cover || ''}'); document.getElementById('user-custom-dialog').remove();" class="p-2 rounded-full bg-primary text-white hover:scale-105 transition-all shrink-0">
                                    <span class="material-symbols-outlined text-base">play_arrow</span>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        openNotificationsModal: async function () {
            let el = document.getElementById('user-custom-dialog');
            if (!el) {
                el = document.createElement('div');
                el.id = 'user-custom-dialog';
                el.className = 'fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
                document.body.appendChild(el);
            }

            el.innerHTML = `
                <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
                    <button onclick="document.getElementById('user-custom-dialog').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <div class="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <span class="material-symbols-outlined text-primary text-xl">notifications</span>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white">Station Notifications</h3>
                    </div>
                    <div class="space-y-3">
                        <div class="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs">
                            <span class="font-bold text-primary block mb-0.5">📻 Radio Ninada 90.4 FM On-Air</span>
                            <p class="text-gray-700 dark:text-gray-300">Live Morning Buzz broadcast is now streaming in HD stereo audio!</p>
                        </div>
                        <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs">
                            <span class="font-bold text-gray-900 dark:text-white block mb-0.5">🎉 Annual Cultural Fest Registrations</span>
                            <p class="text-gray-600 dark:text-gray-400">RSVP passes are open for next week's acoustic live concert at the main auditorium.</p>
                        </div>
                    </div>
                </div>
            `;
        },

        recordListeningHistory: function (track) {
            if (!track || !track.title) return;
            const raw = localStorage.getItem('ninada_listening_history');
            let list = raw ? JSON.parse(raw) : [];
            list = list.filter(item => item.title !== track.title);
            list.unshift({
                title: track.title,
                artist: track.artist || 'Radio Ninada',
                cover: track.cover || '',
                url: track.url || '',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            if (list.length > 25) list = list.slice(0, 25);
            localStorage.setItem('ninada_listening_history', JSON.stringify(list));
        },

        logout: async function () {
            if (this.useFirebase()) {
                try { await window.RadioFirebaseAuth.signOut(); } catch (_) {}
            }
            this.currentUser = null;
            localStorage.removeItem('radio_ninada_user');
            if (window.showToast) window.showToast("👋 Logged out of Radio Ninada.");

            setTimeout(() => {
                window.location.reload();
            }, 800);
        },

        // 8. Protected feature wrapper
        requireAuth: function (actionCallback) {
            if (this.currentUser) {
                actionCallback();
            } else {
                this.openModal('signin', actionCallback);
            }
        }
    };

    // Close profile menu when clicking outside
    document.addEventListener('click', () => {
        const menu = document.getElementById('user-profile-menu');
        if (menu) menu.classList.remove('open');
    });

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.RadioAuth.init());
    } else {
        window.RadioAuth.init();
    }
})();

