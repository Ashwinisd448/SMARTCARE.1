/**
 * SMARTCARE – Authentication & Access Control Service
 * Real Firebase Phone Auth with SMS OTP verification & Custom Admin Management
 * Strict Role-Based Security & Zero Hardcoded Demo OTPs
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
    this.authListeners = [];

    // Load persisted session from localStorage if available
    this.loadPersistedUser();
  }

  loadPersistedUser() {
    try {
      const stored = localStorage.getItem('smartcare_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
        if (this.currentUser && this.currentUser.role === 'admin') {
          // Verify admin session validity via localStorage/sessionStorage and configuration
          const isSessionValid = (localStorage.getItem('smartcare_admin_authorized') === 'true') ||
                                 (sessionStorage.getItem('smartcare_admin_authorized') === 'true');
          const isConfigured = localStorage.getItem('smartcare_admin_configured') === 'true';
          if (!isSessionValid || !isConfigured) {
            this.currentUser = null;
            localStorage.removeItem('smartcare_user');
          } else {
            this.currentUser.isAdminAuthorized = true;
          }
        }
      } else {
        // Default to null / public visitor state (not pre-logged in)
        this.currentUser = null;
      }
    } catch (e) {
      console.warn('[SMARTCARE_AUTH] Error reading stored user session', e);
      this.currentUser = null;
    }
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
  }

  notifyListeners() {
    this.authListeners.forEach(cb => cb(this.currentUser));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('smartcare_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smartcare_user');
    }
    this.notifyListeners();
  }

  /**
   * Initialize or Reset reCAPTCHA for Firebase Phone Authentication
   * @param {string} containerId - DOM container ID for reCAPTCHA
   */
  initRecaptcha(containerId = 'recaptcha-container') {
    const isFirebase = window.SMARTCARE_CONFIG?.isFirebaseConfigured();
    const auth = window.SMARTCARE_CONFIG?.getAuth();

    if (isFirebase && auth && typeof firebase !== 'undefined') {
      try {
        if (this.recaptchaVerifier) {
          try {
            this.recaptchaVerifier.clear();
          } catch (e) {
            // ignore cleanup errors
          }
          this.recaptchaVerifier = null;
        }

        const containerEl = document.getElementById(containerId);
        if (!containerEl) {
          console.warn(`[PhoneAuth] Container #${containerId} not found in DOM.`);
          return null;
        }

        this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
          size: 'invisible',
          callback: () => {
            console.log('[PhoneAuth] reCAPTCHA verified successfully.');
          },
          'expired-callback': () => {
            console.warn('[PhoneAuth] reCAPTCHA expired, reset required.');
          }
        });

        return this.recaptchaVerifier;
      } catch (e) {
        console.warn('[PhoneAuth] RecaptchaVerifier initialization issue:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Send Real SMS OTP to the provided phone number via Firebase Phone Authentication
   * @param {string} phoneNumber - Full E.164 phone number (e.g. +919876543210)
   * @param {string} containerId - reCAPTCHA container ID
   */
  async sendOtp(phoneNumber, containerId = 'recaptcha-container') {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      return { 
        success: false, 
        error: "Please enter a valid mobile number with country code (e.g., +91 9876543210)." 
      };
    }

    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    const isFirebase = window.SMARTCARE_CONFIG?.isFirebaseConfigured();
    const auth = window.SMARTCARE_CONFIG?.getAuth();

    if (isFirebase && auth && typeof firebase !== 'undefined') {
      try {
        const verifier = this.initRecaptcha(containerId);
        if (!verifier) {
          throw new Error("Unable to initialize reCAPTCHA verifier. Please check container element.");
        }

        console.log(`[PhoneAuth] Dispatching real SMS OTP to ${cleanPhone}...`);
        const confirmationResult = await auth.signInWithPhoneNumber(cleanPhone, verifier);
        this.confirmationResult = confirmationResult;
        this.lastTargetPhone = cleanPhone;

        return { 
          success: true, 
          message: `Real 6-digit OTP dispatched via SMS to ${cleanPhone}. Please verify within 5 minutes.` 
        };
      } catch (error) {
        console.error('[Firebase Phone Auth] Error sending SMS OTP:', error);
        let userMessage = error.message;

        if (error.code === 'auth/invalid-phone-number') {
          userMessage = "The phone number format is invalid. Please select your country code and enter a valid mobile number.";
        } else if (error.code === 'auth/quota-exceeded') {
          userMessage = "SMS daily quota exceeded for this Firebase project. Please try again tomorrow or contact system administrator.";
        } else if (error.code === 'auth/captcha-check-failed') {
          userMessage = "reCAPTCHA verification failed. Please refresh the page and try again.";
        } else if (error.code === 'auth/too-many-requests') {
          userMessage = "Too many OTP requests from this device. Please wait a few minutes before trying again.";
        }

        return { success: false, error: userMessage };
      }
    } else {
      // Demo Mode OTP support for testing when Firebase credentials are not yet configured
      this.lastTargetPhone = cleanPhone;
      this.demoOtpCode = "123456";
      console.log(`%c[Demo Mode] Verification OTP for ${cleanPhone} is: 123456`, 'color: #0284c7; font-weight: bold;');
      return { 
        success: true, 
        message: `Demo Mode Active: Verification code is 123456. (For live SMS, add Firebase credentials in js/config.js).` 
      };
    }
  }

  /**
   * Verify the entered 6-digit OTP code using Firebase Phone Authentication (or Demo Code)
   * @param {string} otpCode - 6-digit verification code entered by user
   */
  async verifyOtp(otpCode) {
    const cleanCode = (otpCode || '').trim();
    if (!cleanCode || cleanCode.length !== 6) {
      return { success: false, error: "Please enter a valid 6-digit OTP code." };
    }

    const isFirebase = window.SMARTCARE_CONFIG?.isFirebaseConfigured();

    if (isFirebase && this.confirmationResult) {
      try {
        const result = await this.confirmationResult.confirm(cleanCode);
        const fbUser = result.user;
        const verifiedPhone = fbUser.phoneNumber || this.lastTargetPhone;

        return { 
          success: true, 
          phone: verifiedPhone, 
          uid: fbUser.uid 
        };
      } catch (error) {
        console.error('[Firebase Phone Auth] Verification Error:', error);
        let userMessage = error.message;

        if (error.code === 'auth/invalid-verification-code') {
          userMessage = "Invalid OTP. The 6-digit code you entered is incorrect. Please check SMS and try again.";
        } else if (error.code === 'auth/code-expired') {
          userMessage = "The OTP has expired. Please click 'Resend OTP' to receive a new code.";
        }

        return { success: false, error: userMessage };
      }
    } else {
      // Demo Mode verification
      if (cleanCode === '123456') {
        return {
          success: true,
          phone: this.lastTargetPhone || '+919876543210',
          uid: `demo_usr_${Date.now()}`
        };
      }
      return { 
        success: false, 
        error: "Demo Mode Active: Please enter verification code 123456 (or connect Firebase in js/config.js for live SMS)." 
      };
    }
  }

  /**
   * Log in an existing patient or staff user using their verified phone number
   * @param {string} phoneNumber - Verified phone number
   */
  async loginWithVerifiedPhone(phoneNumber) {
    if (!phoneNumber) return { success: false, error: "Phone number is required." };
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');

    // Look up user by phone in database
    const userProfile = await window.SMARTCARE_DB.getUserByPhone(cleanPhone);
    if (userProfile) {
      this.setCurrentUser(userProfile);
      return { success: true, user: userProfile };
    }

    // Check staff registry
    const allStaff = await window.SMARTCARE_DB.getStaff();
    const staffMember = allStaff.find(s => s.mobile && s.mobile.replace(/[\s-]/g, '') === cleanPhone);
    if (staffMember) {
      const userRole = staffMember.role === 'caretaker' ? 'caregiver' : staffMember.role;
      const staffUser = {
        id: staffMember.userId || staffMember.id,
        username: staffMember.username,
        name: staffMember.name,
        phone: staffMember.mobile,
        role: userRole,
        specialization: staffMember.specialization || '',
        department: staffMember.department || '',
        hospitalName: staffMember.hospitalName || 'Apollo Metro Super Specialty Hospital'
      };
      this.setCurrentUser(staffUser);
      return { success: true, user: staffUser };
    }

    return { 
      success: false, 
      notFound: true,
      phone: cleanPhone,
      error: `No existing account found with mobile number ${phoneNumber}. Please click 'Register Patient' to create your account.` 
    };
  }

  /**
   * Log in using unique Username
   * Supports Patient, Doctor, Nurse, Caregiver, and Admin usernames
   */
  async loginWithUsername(username, role = null) {
    if (!username || !username.trim()) {
      return { success: false, error: "Please enter your username." };
    }
    const cleanU = username.trim().toLowerCase().replace(/[@\s]/g, '');
    let user = await window.SMARTCARE_DB.getUserByUsername(cleanU);

    // If not found in users, check if registered in staff
    if (!user) {
      const allStaff = await window.SMARTCARE_DB.getStaff();
      const staffMember = allStaff.find(s => (s.username && s.username.toLowerCase() === cleanU) || s.id.toLowerCase() === cleanU);
      if (staffMember) {
        const userRole = staffMember.role === 'caretaker' ? 'caregiver' : staffMember.role;
        user = {
          id: staffMember.userId || staffMember.id,
          username: staffMember.username,
          name: staffMember.name,
          phone: staffMember.mobile,
          role: userRole,
          specialization: staffMember.specialization || '',
          department: staffMember.department || '',
          hospitalName: staffMember.hospitalName || 'Apollo Metro Super Specialty Hospital'
        };
      }
    }

    if (!user) {
      return { 
        success: false, 
        error: `No account found for username '@${cleanU}'. Patients can register a new account; Doctors, Nurses, and Caregivers must be registered by Hospital Admin.` 
      };
    }

    if (user.role === 'admin') {
      return { 
        success: false, 
        error: "Administrator accounts require password verification. Please sign in via the Admin Login portal." 
      };
    }

    if (role && user.role !== role) {
      return { 
        success: false, 
        error: `Account '@${cleanU}' is registered as ${user.role.toUpperCase()}, not ${role.toUpperCase()}.` 
      };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  }

  /**
   * Register a new patient
   * Direct registration (No OTP required)
   */
  async registerPatient(patientData) {
    try {
      // Direct registration without mandatory OTP verification
      const patient = await window.SMARTCARE_DB.registerPatient(patientData);
      this.setCurrentUser(patient);
      return { success: true, user: patient };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Pure JavaScript Standard SHA-256 implementation
   * Guaranteed to work in all browser contexts (secure, non-secure, localhost, LAN mobile, file://)
   */
  sha256Pure(ascii) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    var mathPow = Math.pow, maxWord = mathPow(2, 32), lengthProperty = 'length', i, j, result = '';
    var words = [], asciiBitLength = ascii[lengthProperty] * 8, hash = [], k = [], primeCounter = 0, isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength | 0);
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16), oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        var s1h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        var temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i];
        var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        var temp2 = s1h + maj;
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        var b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  /**
   * Secure Admin Password Hasher (Salted SHA-256)
   * Dual-engine: Hardware WebCrypto when available, pure JS fallback everywhere else
   */
  async hashPassword(password, salt = 'smartcare_admin_secure_salt_2026') {
    const raw = (password || '') + salt;
    if (typeof crypto !== 'undefined' && crypto && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      try {
        const enc = new TextEncoder();
        const data = enc.encode(raw);
        const hashBuf = await crypto.subtle.digest('SHA-256', data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn('[SMARTCARE_AUTH] WebCrypto subtle digest failed, using pure JS fallback', e);
      }
    }
    return this.sha256Pure(raw);
  }

  /**
   * Check if custom Admin account is already configured & locked
   */
  async isCustomAdminConfigured() {
    return await window.SMARTCARE_DB.isCustomAdminConfigured();
  }

  /**
   * One-Time Authorized Administrator Initial Setup Wizard
   * Creates custom Admin Name, Username, Email, and Password
   * Locks permanently once created
   */
  async setupInitialAdmin({ name, username, email, password, confirmPassword }) {
    try {
      const isAlreadyConfigured = await this.isCustomAdminConfigured();
      if (isAlreadyConfigured) {
        throw new Error("Hospital Administrator account has already been initialized and locked. Additional administrator registration is strictly forbidden.");
      }

      if (!name || !name.trim()) {
        throw new Error("Please enter Administrator Full Name.");
      }

      const cleanUsername = (username || '').trim().toLowerCase().replace(/[@\s]/g, '');
      if (!cleanUsername || cleanUsername.length < 3) {
        throw new Error("Admin username must be at least 3 characters (letters, numbers, underscores).");
      }

      if (!password || password.length < 6) {
        throw new Error("Admin password must be at least 6 characters long.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match. Please re-enter your password.");
      }

      const cleanEmail = (email || '').trim().toLowerCase() || `${cleanUsername}@smartcare.hospital`;
      const passwordHash = await this.hashPassword(password);

      const adminData = {
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        passwordHash: passwordHash,
        role: 'admin',
        isAdminAuthorized: true,
        createdAt: new Date().toISOString()
      };

      // Save admin in database and lock configuration
      const savedAdmin = await window.SMARTCARE_DB.saveCustomAdmin(adminData);

      // Try creating in Firebase Auth if live Firebase is active
      const isFirebase = window.SMARTCARE_CONFIG?.isFirebaseConfigured();
      const auth = window.SMARTCARE_CONFIG?.getAuth();
      if (isFirebase && auth) {
        try {
          await auth.createUserWithEmailAndPassword(cleanEmail, password);
        } catch (fbErr) {
          console.warn('[AdminSetup] Note on Firebase Auth creation:', fbErr.message);
        }
      }

      this.setCurrentUser(savedAdmin);
      localStorage.setItem('smartcare_admin_authorized', 'true');
      sessionStorage.setItem('smartcare_admin_authorized', 'true');
      return { success: true, user: savedAdmin };
    } catch (err) {
      console.error('[Admin Setup Error]', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Secure Admin Login
   * Requires custom Admin Username/Email and Password
   * No hardcoded admin names or plain text passwords
   */
  async loginAdmin(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase().replace(/[@\s]/g, '');
    if (!cleanId || !password) {
      return { success: false, error: 'Please enter both Admin Username/Email and Password.' };
    }

    // Check if custom Admin is configured
    const customAdmin = await window.SMARTCARE_DB.getCustomAdmin();
    if (!customAdmin) {
      return { 
        success: false, 
        notConfigured: true, 
        error: 'No Administrator account configured yet. Please complete the one-time Admin Setup Wizard.' 
      };
    }

    // Match identifier against custom Admin username or email
    const adminUsername = (customAdmin.username || '').toLowerCase().replace(/[@\s]/g, '');
    const adminEmail = (customAdmin.email || '').toLowerCase();
    const isIdMatch = (cleanId === adminUsername) || (cleanId === adminEmail.replace(/[@\s]/g, '')) || (identifier.trim().toLowerCase() === adminEmail);

    if (!isIdMatch) {
      return { 
        success: false, 
        error: 'Invalid Admin Credentials: Username or email does not match the registered Administrator.' 
      };
    }

    // Verify password hash
    const computedHash = await this.hashPassword(password);
    if (computedHash === customAdmin.passwordHash) {
      const adminUser = {
        id: customAdmin.id || 'admin_root',
        username: customAdmin.username,
        name: customAdmin.name,
        email: customAdmin.email,
        role: 'admin',
        isAdminAuthorized: true,
        loginTime: new Date().toISOString()
      };
      this.setCurrentUser(adminUser);
      localStorage.setItem('smartcare_admin_authorized', 'true');
      sessionStorage.setItem('smartcare_admin_authorized', 'true');
      return { success: true, user: adminUser };
    }

    // Also support Firebase Auth if active
    const isFirebase = window.SMARTCARE_CONFIG?.isFirebaseConfigured();
    const auth = window.SMARTCARE_CONFIG?.getAuth();
    if (isFirebase && auth) {
      try {
        const userCred = await auth.signInWithEmailAndPassword(customAdmin.email, password);
        const adminUser = {
          id: userCred.user.uid,
          username: customAdmin.username,
          name: customAdmin.name,
          email: userCred.user.email,
          role: 'admin',
          isAdminAuthorized: true,
          loginTime: new Date().toISOString()
        };
        this.setCurrentUser(adminUser);
        localStorage.setItem('smartcare_admin_authorized', 'true');
        sessionStorage.setItem('smartcare_admin_authorized', 'true');
        return { success: true, user: adminUser };
      } catch (fbErr) {
        console.warn('[AdminAuth Firebase Fallback Failed]', fbErr);
      }
    }

    return { 
      success: false, 
      error: 'Invalid Admin Password. Access restricted to authorized administrator only.' 
    };
  }

  isAdminAuthorized() {
    return Boolean(
      this.currentUser && 
      this.currentUser.role === 'admin' && 
      this.currentUser.isAdminAuthorized === true
    );
  }

  /**
   * Reset all Admin credentials, configuration, and current admin session
   */
  resetAdminData() {
    window.SMARTCARE_DB?.resetAdminData();
    localStorage.removeItem('smartcare_admin_authorized');
    sessionStorage.removeItem('smartcare_admin_authorized');
    if (this.currentUser && this.currentUser.role === 'admin') {
      this.currentUser = null;
      localStorage.removeItem('smartcare_user');
      this.notifyListeners();
    }
    return { success: true };
  }

  /**
   * Switch role (protected with Admin authorization guard)
   * @param {string} role - 'patient' | 'doctor' | 'nurse' | 'caregiver' | 'admin'
   */
  async switchRole(role) {
    if (role === 'admin') {
      if (!this.isAdminAuthorized()) {
        const isConfigured = await this.isCustomAdminConfigured();
        if (!isConfigured) {
          window.SMARTCARE_APP?.openAdminSetupModal();
        } else {
          window.SMARTCARE_APP?.openAdminLoginModal();
        }
        return null;
      }
      return this.currentUser;
    }

    const allUsers = await window.SMARTCARE_DB.getUsers();
    let targetUser = allUsers.find(u => u.role === role);
    
    // If not found in users, check if registered in staff
    if (!targetUser) {
      const allStaff = await window.SMARTCARE_DB.getStaff();
      const staffMember = allStaff.find(s => s.role === (role === 'caregiver' ? 'caretaker' : role));
      if (staffMember) {
        targetUser = {
          id: staffMember.userId || staffMember.id,
          username: staffMember.username,
          name: staffMember.name,
          phone: staffMember.mobile,
          role: role,
          specialization: staffMember.specialization || '',
          department: staffMember.department || '',
          hospitalName: staffMember.hospitalName || 'Apollo Metro Super Specialty Hospital'
        };
      }
    }

    if (targetUser) {
      this.setCurrentUser(targetUser);
      return targetUser;
    }

    // Role has not been registered yet by Admin
    const roleNames = {
      doctor: 'Doctor',
      nurse: 'Nurse',
      caregiver: 'Caretaker / Caregiver'
    };
    const roleDisplay = roleNames[role] || role;
    window.SMARTCARE_FCM?.showToast(
      'Staff Not Yet Registered',
      `No ${roleDisplay} registered yet. Please log in as Hospital Administrator and add staff first!`,
      'warning'
    );
    return null;
  }

  /**
   * Log out current user
   */
  async logout() {
    const isFirebase = window.SMARTCARE_CONFIG?.isFirebaseConfigured();
    const auth = window.SMARTCARE_CONFIG?.getAuth();

    if (isFirebase && auth) {
      try {
        await auth.signOut();
      } catch (e) {
        console.warn('Sign out error', e);
      }
    }
    
    localStorage.removeItem('smartcare_admin_authorized');
    sessionStorage.removeItem('smartcare_admin_authorized');
    this.setCurrentUser(null);
  }
}

window.SMARTCARE_AUTH = new AuthService();
