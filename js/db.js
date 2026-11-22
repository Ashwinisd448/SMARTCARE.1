/**
 * SMARTCARE – Database & State Management Service
 * Dual-Engine: Seamlessly interacts with Cloud Firestore when live,
 * or reactive LocalStorage store when running offline/demo.
 */

class DatabaseService {
  constructor() {
    this.storageKey = 'smartcare_db_state_v2';
    this.listeners = [];
    this.initStore();
  }

  initStore() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        // Clone initial clean data template
        this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
        this.persist();
      } else {
        this.data = JSON.parse(stored);
        if (!this.data.users) this.data.users = [];
        if (!this.data.hospitals) this.data.hospitals = [];
        if (!this.data.staff) this.data.staff = [];
        if (!this.data.doctors) this.data.doctors = [];
        if (!this.data.prescriptions) this.data.prescriptions = [];
        if (!this.data.medicationLogs) this.data.medicationLogs = [];
        if (!this.data.appointments) this.data.appointments = [];
        if (!this.data.vitals) this.data.vitals = [];
        if (!this.data.beds) this.data.beds = [];
        if (!this.data.ambulances) this.data.ambulances = [];
        if (!this.data.notifications) this.data.notifications = [];
      }

      // Reset admin data per user instruction ("reset admin id and give new registration")
      const ADMIN_RESET_FLAG = 'smartcare_admin_reset_v4';
      if (!localStorage.getItem(ADMIN_RESET_FLAG)) {
        this.resetAdminData();
        localStorage.setItem(ADMIN_RESET_FLAG, 'true');
        console.log('[SMARTCARE] Admin ID reset per user instruction. Ready for new registration.');
      }
    } catch (e) {
      console.error('Error initializing database store:', e);
      this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }
  }

  async clearAllStaff() {
    this.verifyAdminPermission();
    this.data.staff = [];
    this.data.doctors = [];
    this.data.users = (this.data.users || []).filter(u => u.role === 'admin' || u.role === 'patient');
    this.persist();
    return true;
  }

  persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.notifyChange();
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyChange() {
    this.listeners.forEach(cb => {
      try { cb(); } catch (err) { console.error('Listener error', err); }
    });
  }

  // Helper to check if live Firestore is ready
  get isLive() {
    return window.SMARTCARE_CONFIG?.isFirebaseConfigured() && window.SMARTCARE_CONFIG?.getDb() !== null;
  }

  get firestore() {
    return window.SMARTCARE_CONFIG?.getDb();
  }

  /* ================= USERS & PATIENT PRIVACY ================= */

  /**
   * Retrieve users with strict Role-Based Access Control and data isolation.
   * - Public visitors receive an empty array to prevent data leaks.
   * - Patients can retrieve ONLY their own account record.
   * - Admin can view all users.
   */
  async getUsers(bypassPrivacyCheck = false) {
    let allUsers = [];
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('users').get();
        if (!snapshot.empty) {
          allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore fetch failed, fallback to local', e);
      }
    }
    if (allUsers.length === 0) {
      allUsers = this.data.users || [];
    }

    if (bypassPrivacyCheck) {
      return allUsers;
    }

    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();

    // PUBLIC VISITOR ACCESS RULE: No private patient records accessible
    if (!currentUser) {
      return [];
    }

    // PATIENT ACCESS RULE: Patients can access ONLY their own personal profile
    if (currentUser.role === 'patient') {
      const myId = currentUser.id;
      const myUsername = (currentUser.username || '').toLowerCase();
      return allUsers.filter(u => u.id === myId || (u.username && u.username.toLowerCase() === myUsername));
    }

    // ADMIN ACCESS RULE: Full database access
    if (currentUser.role === 'admin') {
      return allUsers;
    }

    // CLINICAL STAFF: Access to clinical users
    return allUsers;
  }

  async getUserById(id) {
    const users = await this.getUsers(true);
    return users.find(u => u.id === id) || null;
  }

  async getUserByPhone(phone) {
    const users = await this.getUsers(true);
    // Normalize phone matching
    const clean = p => (p || '').replace(/[^0-9]/g, '');
    return users.find(u => clean(u.phone) === clean(phone)) || null;
  }

  async saveUser(userData) {
    if (this.isLive) {
      try {
        await this.firestore.collection('users').doc(userData.id).set(userData, { merge: true });
      } catch (e) {
        console.error('Firestore saveUser error:', e);
      }
    }
    const idx = this.data.users.findIndex(u => u.id === userData.id);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...userData };
    } else {
      this.data.users.push(userData);
    }
    this.persist();
    return userData;
  }

  async getUserByUsername(username) {
    if (!username) return null;
    const cleanU = username.trim().toLowerCase().replace(/[@\s]/g, '');
    const users = await this.getUsers(true);
    return users.find(u => (u.username && u.username.toLowerCase() === cleanU)) || null;
  }

  /**
   * Get all registered patients for Admin management
   * Enforces Admin verification
   */
  async getPatients(searchQuery = '') {
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("UNAUTHORIZED: Only Hospital Administrator can view all registered patients.");
    }

    const allUsers = await this.getUsers(true);
    let patients = allUsers.filter(u => u.role === 'patient');

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      patients = patients.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(q)) ||
        (p.bloodGroup && p.bloodGroup.toLowerCase().includes(q)) ||
        (p.hospitalName && p.hospitalName.toLowerCase().includes(q))
      );
    }

    return patients;
  }

  /**
   * Update a patient's admission, ward, doctor, or health details (Admin Only)
   */
  async updatePatient(patientId, updateData) {
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== patientId)) {
      throw new Error("UNAUTHORIZED: Permission denied to update patient record.");
    }

    const patient = await this.getUserById(patientId);
    if (!patient) {
      throw new Error("Patient not found.");
    }

    const updated = {
      ...patient,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await this.saveUser(updated);
    return updated;
  }

  /**
   * Delete a registered patient (Admin Only)
   */
  async deletePatient(patientId) {
    this.verifyAdminPermission();
    if (this.isLive) {
      try {
        await this.firestore.collection('users').doc(patientId).delete();
      } catch (e) {
        console.error('Firestore delete patient error:', e);
      }
    }
    this.data.users = this.data.users.filter(u => u.id !== patientId);
    this.persist();
    return true;
  }

  /* ================= CUSTOM ADMIN CONFIGURATION ================= */

  /**
   * Reset all Admin credentials, configuration, and active admin session
   */
  resetAdminData() {
    try {
      localStorage.removeItem('smartcare_admin_configured');
      localStorage.removeItem('smartcare_admin_name');
      localStorage.removeItem('smartcare_admin_username');
      localStorage.removeItem('smartcare_admin_email');
      localStorage.removeItem('smartcare_admin_pwd_hash');
      localStorage.removeItem('smartcare_admin_authorized');
      localStorage.removeItem('smartcare_user');
      sessionStorage.removeItem('smartcare_admin_authorized');

      if (this.data) {
        delete this.data.adminConfig;
        this.data.users = (this.data.users || []).filter(u => u.role !== 'admin');
        this.persist();
      }

      if (this.isLive) {
        try {
          this.firestore.collection('adminConfig').doc('root_admin').delete();
        } catch (e) {
          // ignore
        }
      }

      const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
      if (currentUser && currentUser.role === 'admin') {
        window.SMARTCARE_AUTH?.setCurrentUser(null);
      }

      console.log('%c[SMARTCARE] Admin credentials and sessions have been reset. Ready for new registration.', 'color: #f59e0b; font-weight: bold;');
      return { success: true };
    } catch (e) {
      console.warn('Error resetting admin data:', e);
      return { success: false, error: e.message };
    }
  }

  isCustomAdminConfigured() {
    return localStorage.getItem('smartcare_admin_configured') === 'true' ||
           Boolean(this.data.adminConfig && this.data.adminConfig.isConfigured);
  }

  getCustomAdmin() {
    if (!this.isCustomAdminConfigured()) return null;
    return {
      name: localStorage.getItem('smartcare_admin_name') || this.data.adminConfig?.name || 'Administrator',
      username: localStorage.getItem('smartcare_admin_username') || this.data.adminConfig?.username || 'admin',
      email: localStorage.getItem('smartcare_admin_email') || this.data.adminConfig?.email || 'admin@smartcare.hospital',
      passwordHash: localStorage.getItem('smartcare_admin_pwd_hash') || this.data.adminConfig?.passwordHash || '',
      isConfigured: true
    };
  }

  async saveCustomAdmin(adminData) {
    const record = {
      name: adminData.name,
      username: adminData.username.toLowerCase().replace(/[@\s]/g, ''),
      email: adminData.email.toLowerCase().trim(),
      passwordHash: adminData.passwordHash,
      isConfigured: true,
      configuredAt: new Date().toISOString()
    };

    localStorage.setItem('smartcare_admin_configured', 'true');
    localStorage.setItem('smartcare_admin_name', record.name);
    localStorage.setItem('smartcare_admin_username', record.username);
    localStorage.setItem('smartcare_admin_email', record.email);
    localStorage.setItem('smartcare_admin_pwd_hash', record.passwordHash);

    this.data.adminConfig = record;

    if (this.isLive) {
      try {
        await this.firestore.collection('adminConfig').doc('root_admin').set(record);
      } catch (e) {
        console.warn('Firestore adminConfig save warning:', e);
      }
    }

    // Save as admin user document
    const adminUserDoc = {
      id: `usr_adm_${record.username}`,
      username: record.username,
      name: record.name,
      email: record.email,
      phone: adminData.phone || '',
      role: 'admin',
      isAdminAuthorized: true,
      createdAt: record.configuredAt
    };
    await this.saveUser(adminUserDoc);

    this.persist();
    return adminUserDoc;
  }

  /**
   * Register Patient
   * Enforces unique username and phone number
   * Stores all future health data keyed by username
   */
  async registerPatient(patientData) {
    if (!patientData.username || !patientData.username.trim()) {
      throw new Error("Username is required for Patient Registration.");
    }
    const cleanUsername = patientData.username.trim().toLowerCase().replace(/[@\s]/g, '');
    if (cleanUsername.length < 3) {
      throw new Error("Username must be at least 3 characters long (letters, numbers, underscores).");
    }

    // Check unique username
    const existing = await this.getUserByUsername(cleanUsername);
    if (existing && existing.id !== patientData.id) {
      throw new Error(`Username '@${cleanUsername}' is already taken. Please choose another username.`);
    }

    // Validate phone number
    const cleanPhone = (patientData.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      throw new Error("Please enter a valid mobile number with at least 10 digits.");
    }

    const allUsers = await this.getUsers();
    const phoneDuplicate = allUsers.find(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanPhone && u.username !== cleanUsername);
    if (phoneDuplicate) {
      throw new Error(`Mobile number ${patientData.phone} is already registered to user @${phoneDuplicate.username || phoneDuplicate.name}.`);
    }

    const patientRecord = {
      id: patientData.id || `usr_pat_${cleanUsername}`,
      username: cleanUsername,
      name: patientData.name || cleanUsername,
      phone: patientData.phone,
      role: 'patient',
      age: Number(patientData.age) || 30,
      gender: patientData.gender || 'Not Specified',
      bloodGroup: patientData.bloodGroup || 'O+',
      emergencyContact: patientData.emergencyContact || '',
      hospitalName: patientData.hospitalName || 'Apollo Metro Super Specialty Hospital',
      ward: patientData.ward || 'General Outpatient',
      roomNumber: patientData.roomNumber || 'Consultation Suite',
      bedNumber: patientData.bedNumber || 'OP-01',
      admissionStatus: patientData.admissionStatus || 'Registered Patient',
      admissionDate: patientData.admissionDate || new Date().toISOString().split('T')[0],
      primaryDoctorId: patientData.primaryDoctorId || '',
      primaryDoctorName: patientData.primaryDoctorName || 'To be assigned by Hospital Admin',
      diagnosis: patientData.diagnosis || 'General Checkup & Wellness',
      createdAt: new Date().toISOString(),
      avatar: '' // No photos
    };

    await this.saveUser(patientRecord);
    return patientRecord;
  }

  /**
   * Register Hospital Administrator
   * Allows hospital admins to self-onboard and manage staff
   */
  async registerAdmin(adminData) {
    if (!adminData.username || !adminData.username.trim()) {
      throw new Error("Admin username is required.");
    }
    const cleanUsername = adminData.username.trim().toLowerCase().replace(/[@\s]/g, '');
    const existing = await this.getUserByUsername(cleanUsername);
    if (existing && existing.id !== adminData.id) {
      throw new Error(`Admin username '@${cleanUsername}' is already taken.`);
    }

    const adminRecord = {
      id: adminData.id || `usr_adm_${cleanUsername}`,
      username: cleanUsername,
      name: adminData.name || 'Hospital Administrator',
      phone: adminData.phone || '+91 98765 00000',
      role: 'admin',
      qualification: adminData.qualification || 'MHA, MBBS',
      designation: adminData.designation || 'Medical Director & Hospital Administrator',
      hospitalName: adminData.hospitalName || 'Apollo Metro Super Specialty Hospital',
      createdAt: new Date().toISOString(),
      avatar: '' // No photos
    };

    await this.saveUser(adminRecord);
    return adminRecord;
  }

  /* ================= STAFF MANAGEMENT (ADMIN-ONLY) ================= */

  /**
   * Backend Role Verification
   * Strictly verifies that the caller has an active authenticated Admin session.
   * Throws an error to prevent unauthorized client or console calls.
   */
  verifyAdminPermission() {
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin' || !currentUser.isAdminAuthorized) {
      const err = new Error("UNAUTHORIZED_ACCESS: Only an authenticated and authorized Hospital Administrator has permission to add, edit, or delete records.");
      err.code = "permission-denied";
      throw err;
    }
    return true;
  }

  /**
   * Retrieve all staff members with optional role and search filtering
   */
  async getStaff(roleFilter = 'all', searchQuery = '') {
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('staff').get();
        if (!snapshot.empty) {
          this.data.staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getStaff failed, fallback to local', e);
      }
    }
    let list = this.data.staff || [];
    if (roleFilter && roleFilter !== 'all') {
      list = list.filter(s => s.role === roleFilter);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanQ = q.replace(/[^0-9]/g, '');
      list = list.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.specialization && s.specialization.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q)) ||
        (cleanQ && s.mobile && s.mobile.replace(/[^0-9]/g, '').includes(cleanQ))
      );
    }
    return list;
  }

  async getStaffById(id) {
    const staff = await this.getStaff();
    return staff.find(s => s.id === id) || null;
  }

  /**
   * Save (Create or Update) Staff Member
   * - Enforces Admin Authorization
   * - Enforces Mobile Number Uniqueness
   * - Cross-syncs Doctors to `doctors` collection (for patient appointment booking)
   * - Cross-syncs to `users` collection (for mobile OTP login)
   */
  async saveStaff(staffData) {
    // 1. Verify backend admin permission
    this.verifyAdminPermission();

    // 2. Validate mobile number
    if (!staffData.mobile || staffData.mobile.replace(/[^0-9]/g, '').length < 10) {
      throw new Error("Invalid Mobile Number: Please enter a valid mobile number with at least 10 digits.");
    }

    const clean = p => (p || '').replace(/[^0-9]/g, '');
    const cleanPhone = clean(staffData.mobile);

    // 3. Duplicate mobile & email validation across all staff
    const allStaff = this.data.staff || [];
    const duplicate = allStaff.find(s => clean(s.mobile) === cleanPhone && s.id !== staffData.id);
    if (duplicate) {
      throw new Error(`Duplicate Registration: A staff member with mobile number ${staffData.mobile} is already registered (${duplicate.name} - ${duplicate.role.toUpperCase()} [ID: ${duplicate.id}]).`);
    }

    if (staffData.email && staffData.email.trim()) {
      const cleanEmail = staffData.email.trim().toLowerCase();
      const duplicateEmail = allStaff.find(s => (s.email || '').trim().toLowerCase() === cleanEmail && s.id !== staffData.id);
      if (duplicateEmail) {
        throw new Error(`Duplicate Registration: A staff member with email ${staffData.email} is already registered (${duplicateEmail.name}).`);
      }
    }

    // 4. Generate unique staff ID & unique username if new
    const isNew = !staffData.id;
    if (isNew) {
      const prefix = staffData.role === 'doctor' ? 'STF-DOC' : (staffData.role === 'nurse' ? 'STF-NUR' : 'STF-CAR');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      staffData.id = `${prefix}-${randomSuffix}`;
      staffData.createdAt = new Date().toISOString();
      staffData.joinedDate = new Date().toISOString().split('T')[0];
    }

    let cleanUsername = (staffData.username || '').trim().toLowerCase().replace(/[@\s]/g, '');
    if (!cleanUsername) {
      const rolePrefix = staffData.role === 'doctor' ? 'dr' : (staffData.role === 'nurse' ? 'nurse' : 'care');
      const namePart = (staffData.name || 'staff').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
      cleanUsername = `${rolePrefix}_${namePart}`;
    }
    const allUsers = this.data.users || [];
    const duplicateUser = allUsers.find(u => u.username === cleanUsername && u.id !== staffData.id && u.id !== staffData.userId);
    if (duplicateUser) {
      cleanUsername = `${cleanUsername}_${Math.floor(10 + Math.random() * 90)}`;
    }
    staffData.username = cleanUsername;
    staffData.updatedAt = new Date().toISOString();
    staffData.status = staffData.status || 'active';
    staffData.avatar = ''; // No photos

    // 5. Persist to Firestore if live
    if (this.isLive) {
      try {
        await this.firestore.collection('staff').doc(staffData.id).set(staffData, { merge: true });
      } catch (e) {
        console.error('Firestore saveStaff error:', e);
      }
    }

    // 6. Update local staff store
    if (!this.data.staff) this.data.staff = [];
    const idx = this.data.staff.findIndex(s => s.id === staffData.id);
    if (idx >= 0) {
      this.data.staff[idx] = { ...this.data.staff[idx], ...staffData };
    } else {
      this.data.staff.push(staffData);
    }

    // 7. Cross-Module Sync: Sync Doctors to `doctors` collection
    if (staffData.role === 'doctor') {
      const docEntry = {
        id: staffData.userId || staffData.id,
        staffId: staffData.id,
        username: cleanUsername,
        name: staffData.name,
        email: staffData.email || '',
        specialization: staffData.specialization || 'General Medicine',
        qualification: staffData.qualification || 'MBBS',
        experience: Number(staffData.experience) || 5,
        mobile: staffData.mobile,
        hospitalId: staffData.hospitalId || '',
        hospitalName: staffData.hospitalName || 'Main Hospital',
        roomNumber: staffData.roomNumber || 'Consultation Suite',
        availableDays: staffData.availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        timings: staffData.availableTime || staffData.timings || "09:00 AM - 01:00 PM, 04:00 PM - 07:00 PM",
        slots: ["09:30 AM", "10:00 AM", "10:30 AM", "11:15 AM", "12:00 PM", "04:30 PM", "05:15 PM"],
        department: staffData.specialization || 'General Medicine',
        avatar: '' // No photos
      };
      await this.saveDoctor(docEntry);
    }

    // 8. Cross-Module Sync: Sync to `users` for authentication & persona switching
    const userRole = staffData.role === 'caretaker' ? 'caregiver' : staffData.role;
    const userEntry = {
      id: staffData.userId || staffData.id,
      username: cleanUsername,
      name: staffData.name,
      email: staffData.email || '',
      phone: staffData.mobile,
      role: userRole,
      specialization: staffData.specialization || '',
      department: staffData.department || '',
      qualification: staffData.qualification || '',
      experience: staffData.experience || 0,
      hospitalId: staffData.hospitalId || '',
      hospitalName: staffData.hospitalName || 'Main Hospital',
      roomNumber: staffData.roomNumber || '',
      shift: staffData.dutyTiming || staffData.shift || '',
      dutyTiming: staffData.dutyTiming || staffData.shift || '',
      availableTiming: staffData.availableTiming || '',
      servicesProvided: staffData.servicesProvided || '',
      assignedWard: staffData.assignedWard || '',
      assignedPatient: staffData.assignedPatient || '',
      linkedPatientUsername: staffData.linkedPatientUsername || '',
      relationship: staffData.relationship || '',
      avatar: '' // No photos
    };
    await this.saveUser(userEntry);

    this.persist();
    return staffData;
  }

  /**
   * Delete Staff Member
   * - Enforces Admin Authorization
   * - Synchronizes deletion across `doctors` and `users`
   */
  async deleteStaff(staffId) {
    this.verifyAdminPermission();

    const staffMember = (this.data.staff || []).find(s => s.id === staffId);
    if (!staffMember) return false;

    // Delete from Firestore if live
    if (this.isLive) {
      try {
        await this.firestore.collection('staff').doc(staffId).delete();
      } catch (e) {
        console.error('Firestore deleteStaff error:', e);
      }
    }

    // Remove from local staff
    this.data.staff = (this.data.staff || []).filter(s => s.id !== staffId);

    // If it was a doctor, also remove from doctors collection
    if (staffMember.role === 'doctor') {
      const docId = staffMember.userId || staffMember.id;
      await this.deleteDoctor(docId);
      this.data.doctors = (this.data.doctors || []).filter(d => d.id !== docId && d.staffId !== staffId);
    }

    // Remove from users
    const usrId = staffMember.userId || staffMember.id;
    this.data.users = (this.data.users || []).filter(u => u.id !== usrId);

    this.persist();
    return true;
  }

  /* ================= HOSPITALS MANAGEMENT (ADMIN-ONLY) ================= */

  /**
   * Retrieve all registered hospitals with optional search query
   */
  async getHospitals(searchQuery = '') {
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('hospitals').get();
        if (!snapshot.empty) {
          this.data.hospitals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getHospitals failed, fallback to local', e);
      }
    }
    let list = this.data.hospitals || [];
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(h => 
        (h.name && h.name.toLowerCase().includes(q)) ||
        (h.address && h.address.toLowerCase().includes(q)) ||
        (h.city && h.city.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getHospitalById(id) {
    const hospitals = await this.getHospitals();
    return hospitals.find(h => h.id === id) || null;
  }

  /**
   * Save (Create or Update) Hospital Location
   * - Enforces Admin Authorization
   * - Saves real Latitude and Longitude from Google Maps / Places
   * - Validates against duplicate hospital registrations
   */
  async saveHospital(hospitalData) {
    this.verifyAdminPermission();

    if (!hospitalData.name || hospitalData.name.trim().length < 2) {
      throw new Error("Hospital Name is required.");
    }
    if (!hospitalData.address || hospitalData.address.trim().length < 3) {
      throw new Error("Hospital Address is required.");
    }
    if (isNaN(parseFloat(hospitalData.latitude)) || isNaN(parseFloat(hospitalData.longitude))) {
      throw new Error("Valid Latitude and Longitude are required. Please pinpoint the location on Google Maps.");
    }

    const clean = p => (p || '').replace(/[^0-9]/g, '');
    const cleanPhone = clean(hospitalData.contactPhone || hospitalData.phone || '');

    // Duplicate hospital validation (prevent duplicate name or phone)
    const allHosp = this.data.hospitals || [];
    const duplicate = allHosp.find(h => 
      (h.name.trim().toLowerCase() === hospitalData.name.trim().toLowerCase() && h.id !== hospitalData.id) ||
      (cleanPhone && clean(h.contactPhone || h.phone || '') === cleanPhone && h.id !== hospitalData.id)
    );
    if (duplicate) {
      throw new Error(`Duplicate Hospital: A hospital named "${hospitalData.name}" or with contact ${hospitalData.contactPhone} is already registered.`);
    }

    const isNew = !hospitalData.id;
    if (isNew) {
      hospitalData.id = `hosp_${Date.now()}`;
      hospitalData.createdAt = new Date().toISOString();
    }
    hospitalData.updatedAt = new Date().toISOString();
    hospitalData.latitude = parseFloat(hospitalData.latitude);
    hospitalData.longitude = parseFloat(hospitalData.longitude);
    hospitalData.workingHours = hospitalData.workingHours || '24x7 Emergency / OPD: 08:00 AM - 08:00 PM';
    hospitalData.contactPhone = hospitalData.contactPhone || hospitalData.phone || '';
    hospitalData.email = hospitalData.email || '';

    if (this.isLive) {
      try {
        await this.firestore.collection('hospitals').doc(hospitalData.id).set(hospitalData, { merge: true });
      } catch (e) {
        console.error('Firestore saveHospital error:', e);
      }
    }

    if (!this.data.hospitals) this.data.hospitals = [];
    const idx = this.data.hospitals.findIndex(h => h.id === hospitalData.id);
    if (idx >= 0) {
      this.data.hospitals[idx] = { ...this.data.hospitals[idx], ...hospitalData };
    } else {
      this.data.hospitals.push(hospitalData);
    }
    this.persist();
    return hospitalData;
  }

  /**
   * Delete Hospital Location
   * - Enforces Admin Authorization
   */
  async deleteHospital(id) {
    this.verifyAdminPermission();
    if (this.isLive) {
      try {
        await this.firestore.collection('hospitals').doc(id).delete();
      } catch (e) {
        console.error('Firestore deleteHospital error:', e);
      }
    }
    if (this.data.hospitals) {
      this.data.hospitals = this.data.hospitals.filter(h => h.id !== id);
    }
    this.persist();
    return true;
  }

  /* ================= DATABASE BACKUP & SYSTEM RESET ================= */

  /**
   * Complete Database Backup
   * Takes a structured JSON snapshot of all current data and triggers browser file download.
   */
  backupDatabase() {
    const backupObj = {
      system: 'SMARTCARE_HEALTHCARE_SYSTEM',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(this.data))
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    try {
      localStorage.setItem('smartcare_db_backup_last', jsonStr);
    } catch (e) {
      console.warn('Backup localStorage quota exceeded:', e);
    }

    // Trigger browser file download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `smartcare_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return backupObj;
  }

  /**
   * Complete System Data Reset (Admin Confirmation Required)
   * Wipes patient info, doctor info, nurse info, caregiver info, hospital info,
   * appointment info, medicine schedules, old instructions, old location records,
   * while keeping the active Admin credentials and database structure.
   */
  async resetAllData(confirmationPhrase) {
    this.verifyAdminPermission();

    const expected = "DELETE_ALL_DATA";
    if (confirmationPhrase !== expected) {
      throw new Error(`Security confirmation mismatch. You must enter exact phrase "${expected}" to permanently wipe data.`);
    }

    // 1. Take safety backup before wiping
    this.backupDatabase();

    // 2. Identify active authenticated admin account to preserve
    const activeAdmin = window.SMARTCARE_AUTH?.getCurrentUser();
    const preservedUsers = [];
    if (activeAdmin && activeAdmin.role === 'admin') {
      preservedUsers.push(activeAdmin);
    }

    // 3. Clear all collections
    this.data.users = preservedUsers;
    this.data.hospitals = [];
    this.data.doctors = [];
    this.data.staff = [];
    this.data.prescriptions = [];
    this.data.medicationLogs = [];
    this.data.appointments = [];
    this.data.vitals = [];
    this.data.beds = [];
    this.data.ambulances = [];
    this.data.notifications = [];

    // 4. Remote Firestore collection wipe if live
    if (this.isLive) {
      const collections = ['hospitals', 'doctors', 'staff', 'prescriptions', 'medicationLogs', 'appointments', 'vitals', 'beds', 'notifications'];
      for (const col of collections) {
        try {
          const snap = await this.firestore.collection(col).get();
          const batch = this.firestore.batch();
          snap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        } catch (e) {
          console.warn(`Firestore clear collection ${col} error:`, e);
        }
      }
    }

    this.persist();
    return true;
  }

  /* ================= DOCTORS ================= */

  async getDoctors() {
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('doctors').get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getDoctors failed, fallback to local', e);
      }
    }
    return this.data.doctors || [];
  }

  async getDoctorById(id) {
    const doctors = await this.getDoctors();
    return doctors.find(d => d.id === id) || null;
  }

  async saveDoctor(doctorData) {
    if (!doctorData.id) {
      doctorData.id = "doc_" + Date.now();
    }
    if (this.isLive) {
      try {
        await this.firestore.collection('doctors').doc(doctorData.id).set(doctorData, { merge: true });
      } catch (e) {
        console.error('Firestore saveDoctor error:', e);
      }
    }
    const idx = this.data.doctors.findIndex(d => d.id === doctorData.id);
    if (idx >= 0) {
      this.data.doctors[idx] = { ...this.data.doctors[idx], ...doctorData };
    } else {
      this.data.doctors.push(doctorData);
    }
    this.persist();
    return doctorData;
  }

  async deleteDoctor(id) {
    if (this.isLive) {
      try {
        await this.firestore.collection('doctors').doc(id).delete();
      } catch (e) {
        console.error('Firestore deleteDoctor error:', e);
      }
    }
    this.data.doctors = this.data.doctors.filter(d => d.id !== id);
    this.persist();
    return true;
  }

  /* ================= APPOINTMENTS ================= */

  async getAppointments(patientIdentifier = null) {
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    // PUBLIC ACCESS RULE: Unauthenticated visitors cannot read private patient appointments
    if (!currentUser) {
      return [];
    }

    let list = [];
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('appointments').orderBy('createdAt', 'desc').get();
        if (!snapshot.empty) {
          list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getAppointments failed, fallback', e);
      }
    }
    if (list.length === 0) {
      list = this.data.appointments || [];
    }

    // PATIENT ACCESS RULE: Patients can access ONLY their own appointments
    if (currentUser.role === 'patient') {
      const myId = currentUser.id;
      const myUsername = (currentUser.username || '').toLowerCase();
      const myPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');
      return list.filter(a => 
        (a.patientId && a.patientId === myId) || 
        (a.patientUsername && a.patientUsername.toLowerCase() === myUsername) ||
        (myPhone && (a.patientPhone || '').replace(/[^0-9]/g, '') === myPhone)
      );
    }

    // ADMIN & CLINICAL ACCESS RULE:
    if (patientIdentifier) {
      const clean = patientIdentifier.toLowerCase();
      list = list.filter(a => (a.patientUsername && a.patientUsername.toLowerCase() === clean) || a.patientId === patientIdentifier);
    }
    return list;
  }

  async bookAppointment(appointmentData) {
    let patientUsername = appointmentData.patientUsername || '';
    if (!patientUsername && appointmentData.patientId) {
      const patient = await this.getUserById(appointmentData.patientId);
      patientUsername = patient?.username || '';
    }

    const newApt = {
      id: "apt_" + Date.now(),
      status: "pending",
      doctorNotes: "",
      patientUsername: patientUsername,
      createdAt: new Date().toISOString(),
      ...appointmentData
    };

    if (this.isLive) {
      try {
        await this.firestore.collection('appointments').doc(newApt.id).set(newApt);
      } catch (e) {
        console.error('Firestore bookAppointment error:', e);
      }
    }

    this.data.appointments.unshift(newApt);
    
    // Add notification for Doctor
    await this.sendNotification({
      recipientRole: "doctor",
      recipientId: newApt.doctorId,
      title: "New Appointment Request",
      body: `Patient ${newApt.patientName} requested an appointment on ${newApt.appointmentDate} at ${newApt.timeSlot}.`,
      type: "appointment"
    });

    this.persist();
    return newApt;
  }

  async updateAppointmentStatus(appointmentId, newStatus, doctorNotes = '') {
    const apt = this.data.appointments.find(a => a.id === appointmentId);
    if (!apt) return null;

    apt.status = newStatus;
    if (doctorNotes) apt.doctorNotes = doctorNotes;

    if (this.isLive) {
      try {
        await this.firestore.collection('appointments').doc(appointmentId).update({
          status: newStatus,
          doctorNotes: apt.doctorNotes
        });
      } catch (e) {
        console.error('Firestore updateAppointmentStatus error:', e);
      }
    }

    // Send push notification to patient
    await this.sendNotification({
      recipientRole: "patient",
      recipientId: apt.patientId,
      title: `Appointment ${newStatus.toUpperCase()}`,
      body: `Your appointment with ${apt.doctorName} on ${apt.appointmentDate} at ${apt.timeSlot} has been marked as ${newStatus}.`,
      type: "appointment"
    });

    this.persist();
    return apt;
  }

  async cancelAppointment(appointmentId, reason = '') {
    return this.updateAppointmentStatus(appointmentId, 'cancelled', reason);
  }

  /* ================= PRESCRIPTIONS ================= */

  async getPrescriptions(patientIdentifier = null) {
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    // PUBLIC ACCESS RULE: Unauthenticated visitors cannot read private prescriptions
    if (!currentUser) {
      return [];
    }

    let list = [];
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('prescriptions').orderBy('createdAt', 'desc').get();
        if (!snapshot.empty) {
          list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getPrescriptions failed, fallback', e);
      }
    }
    if (list.length === 0) {
      list = this.data.prescriptions || [];
    }

    // PATIENT ACCESS RULE: Patients can access ONLY their own prescriptions
    if (currentUser.role === 'patient') {
      const myId = currentUser.id;
      const myUsername = (currentUser.username || '').toLowerCase();
      return list.filter(r => 
        (r.patientId && r.patientId === myId) || 
        (r.patientUsername && r.patientUsername.toLowerCase() === myUsername)
      );
    }

    // ADMIN & DOCTOR ACCESS:
    if (patientIdentifier) {
      const clean = patientIdentifier.toLowerCase();
      list = list.filter(r => (r.patientUsername && r.patientUsername.toLowerCase() === clean) || r.patientId === patientIdentifier);
    }
    return list;
  }

  async createPrescription(rxData) {
    let patientUsername = rxData.patientUsername || '';
    if (!patientUsername && rxData.patientId) {
      const patient = await this.getUserById(rxData.patientId);
      patientUsername = patient?.username || '';
    }

    const newRx = {
      id: "rx_" + Date.now(),
      status: "active",
      createdAt: new Date().toISOString(),
      patientUsername: patientUsername,
      ...rxData
    };

    if (this.isLive) {
      try {
        await this.firestore.collection('prescriptions').doc(newRx.id).set(newRx);
      } catch (e) {
        console.error('Firestore createPrescription error:', e);
      }
    }

    this.data.prescriptions.unshift(newRx);

    // Automatically generate today's scheduled medication logs for Nurse and Patient
    const timings = Array.isArray(newRx.timings) ? newRx.timings : [newRx.timings || "Morning (08:00 AM)"];
    for (const timeSlot of timings) {
      const logEntry = {
        id: "medlog_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        prescriptionId: newRx.id,
        patientId: newRx.patientId,
        patientUsername: patientUsername,
        patientName: newRx.patientName,
        medicineName: `${newRx.medicineName} (${newRx.dosage})`,
        dosage: newRx.dosage,
        slot: timeSlot,
        scheduledDate: new Date().toISOString().split('T')[0],
        status: "pending",
        administeredBy: null,
        notes: `Instruction: ${newRx.instructions} [${newRx.mealInstruction}]`,
        recordedAt: null
      };
      this.data.medicationLogs.unshift(logEntry);
    }

    // Trigger notification to Patient
    await this.sendNotification({
      recipientRole: "patient",
      recipientId: newRx.patientId,
      recipientUsername: patientUsername,
      title: `New Prescription Added by ${newRx.doctorName}`,
      body: `Prescribed: ${newRx.medicineName} (${newRx.dosage}). Frequency: ${newRx.frequency || 'Daily'}.`,
      type: "medication"
    });

    // Trigger notification to Nurse
    await this.sendNotification({
      recipientRole: "nurse",
      recipientId: "all_nurses",
      title: `New Medication Order for ${newRx.patientName}`,
      body: `${newRx.medicineName} (${newRx.dosage}) prescribed by ${newRx.doctorName}. Added to administration schedule.`,
      type: "medication"
    });

    this.persist();
    return newRx;
  }

  /* ================= MEDICATION LOGS & REMINDERS ================= */

  async getMedicationLogs(patientIdentifier = null) {
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    // PUBLIC ACCESS RULE: Unauthenticated visitors cannot read private medication schedules
    if (!currentUser) {
      return [];
    }

    let list = [];
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('medicationLogs').orderBy('scheduledDate', 'desc').get();
        if (!snapshot.empty) {
          list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getMedicationLogs failed, fallback', e);
      }
    }
    if (list.length === 0) {
      list = this.data.medicationLogs || [];
    }

    // PATIENT ACCESS RULE: Patients can access ONLY their own medication schedules
    if (currentUser.role === 'patient') {
      const myId = currentUser.id;
      const myUsername = (currentUser.username || '').toLowerCase();
      return list.filter(l => 
        (l.patientId && l.patientId === myId) || 
        (l.patientUsername && l.patientUsername.toLowerCase() === myUsername)
      );
    }

    // ADMIN & NURSE ACCESS:
    if (patientIdentifier) {
      const clean = patientIdentifier.toLowerCase();
      list = list.filter(l => (l.patientUsername && l.patientUsername.toLowerCase() === clean) || l.patientId === patientIdentifier);
    }
    return list;
  }

  async markMedicationAdministered(logId, nurseName, notes = '') {
    const log = this.data.medicationLogs.find(l => l.id === logId);
    if (!log) return null;

    log.status = "administered";
    log.administeredBy = nurseName;
    log.notes = notes || "Administered as scheduled";
    log.recordedAt = new Date().toISOString();

    if (this.isLive) {
      try {
        await this.firestore.collection('medicationLogs').doc(logId).update({
          status: log.status,
          administeredBy: log.administeredBy,
          notes: log.notes,
          recordedAt: log.recordedAt
        });
      } catch (e) {
        console.error('Firestore markAdministered error:', e);
      }
    }

    this.persist();
    return log;
  }

  async markMedicationTaken(logId, patientName) {
    const log = this.data.medicationLogs.find(l => l.id === logId);
    if (!log) return null;

    log.status = "taken";
    log.administeredBy = `${patientName} (Self)`;
    log.notes = "Patient marked as taken";
    log.recordedAt = new Date().toISOString();

    if (this.isLive) {
      try {
        await this.firestore.collection('medicationLogs').doc(logId).update({
          status: log.status,
          administeredBy: log.administeredBy,
          notes: log.notes,
          recordedAt: log.recordedAt
        });
      } catch (e) {
        console.error('Firestore markMedicationTaken error:', e);
      }
    }

    this.persist();
    return log;
  }

  /* ================= PATIENT HEALTH VITALS ================= */

  async getVitals(patientIdentifier = null) {
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    // PUBLIC ACCESS RULE: Unauthenticated visitors cannot read private patient vitals
    if (!currentUser) {
      return [];
    }

    let list = [];
    if (this.isLive) {
      try {
        let query = this.firestore.collection('vitals').orderBy('recordedAt', 'desc');
        const snapshot = await query.get();
        if (!snapshot.empty) {
          list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getVitals failed, fallback', e);
      }
    }
    if (list.length === 0) {
      list = this.data.vitals || [];
    }

    // PATIENT ACCESS RULE: Patients can access ONLY their own vitals
    if (currentUser.role === 'patient') {
      const myId = currentUser.id;
      const myUsername = (currentUser.username || '').toLowerCase();
      return list.filter(v => 
        (v.patientId && v.patientId === myId) || 
        (v.patientUsername && v.patientUsername.toLowerCase() === myUsername)
      );
    }

    // ADMIN, DOCTOR & NURSE ACCESS:
    if (patientIdentifier) {
      const clean = patientIdentifier.toLowerCase();
      list = list.filter(v => (v.patientUsername && v.patientUsername.toLowerCase() === clean) || v.patientId === patientIdentifier);
    }
    return list;
  }

  async recordVitals(vitalsData) {
    let patientUsername = vitalsData.patientUsername || '';
    if (!patientUsername && vitalsData.patientId) {
      const patient = await this.getUserById(vitalsData.patientId);
      patientUsername = patient?.username || '';
    }

    const newVital = {
      id: "vit_" + Date.now(),
      recordedAt: new Date().toISOString(),
      patientUsername: patientUsername,
      ...vitalsData
    };

    if (this.isLive) {
      try {
        await this.firestore.collection('vitals').doc(newVital.id).set(newVital);
      } catch (e) {
        console.error('Firestore recordVitals error:', e);
      }
    }

    this.data.vitals.unshift(newVital);

    // If critical condition or fever, alert doctor & caregiver
    const isCritical = newVital.condition === 'Critical' || 
                       parseFloat(newVital.temperature) >= 102 || 
                       (newVital.spO2 && parseInt(newVital.spO2) < 92);

    if (isCritical) {
      await this.sendNotification({
        recipientRole: "doctor",
        recipientId: "all_doctors",
        title: `ALERT: Critical Vitals for ${newVital.patientName}`,
        body: `Condition: ${newVital.condition}, Temp: ${newVital.temperature}°F, BP: ${newVital.bloodPressure}, SpO2: ${newVital.spO2}%. Nurse Notes: ${newVital.nursingNotes}`,
        type: "emergency"
      });

      await this.sendNotification({
        recipientRole: "caregiver",
        recipientId: "all_caregivers",
        title: `Health Update: ${newVital.patientName}`,
        body: `Nurse recorded critical vitals: Temp ${newVital.temperature}°F, SpO2 ${newVital.spO2}%. Medical team alerted.`,
        type: "emergency"
      });
    }

    this.persist();
    return newVital;
  }

  /* ================= HOSPITAL BEDS & ROOMS ================= */

  async getBeds() {
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('beds').get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getBeds failed, fallback', e);
      }
    }
    return this.data.beds || [];
  }

  async allocateBed(bedId, patientId, patientName) {
    this.verifyAdminPermission();
    const bed = this.data.beds.find(b => b.id === bedId);
    if (!bed) return null;

    bed.status = "occupied";
    bed.patientId = patientId;
    bed.patientName = patientName;

    // Update patient profile with room and bed
    const patient = this.data.users.find(u => u.id === patientId);
    if (patient) {
      patient.roomNumber = bed.roomNumber;
      patient.bedNumber = bed.bedNumber;
      patient.ward = bed.ward;
      patient.admissionStatus = "Admitted";
    }

    if (this.isLive) {
      try {
        await this.firestore.collection('beds').doc(bedId).update(bed);
        if (patient) {
          await this.firestore.collection('users').doc(patientId).update({
            roomNumber: bed.roomNumber,
            bedNumber: bed.bedNumber,
            ward: bed.ward,
            admissionStatus: "Admitted"
          });
        }
      } catch (e) {
        console.error('Firestore allocateBed error:', e);
      }
    }

    this.persist();
    return bed;
  }

  async vacateBed(bedId) {
    this.verifyAdminPermission();
    const bed = this.data.beds.find(b => b.id === bedId);
    if (!bed) return null;

    const prevPatientId = bed.patientId;
    bed.status = "available";
    bed.patientId = null;
    bed.patientName = null;

    if (prevPatientId) {
      const patient = this.data.users.find(u => u.id === prevPatientId);
      if (patient) {
        patient.admissionStatus = "Discharged";
      }
    }

    if (this.isLive) {
      try {
        await this.firestore.collection('beds').doc(bedId).update(bed);
      } catch (e) {
        console.error('Firestore vacateBed error:', e);
      }
    }

    this.persist();
    return bed;
  }

  /* ================= NOTIFICATIONS & EMERGENCY ALERTS ================= */

  async getNotifications(recipientRole = null, recipientId = null) {
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('notifications').orderBy('timestamp', 'desc').limit(30).get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore getNotifications failed, fallback', e);
      }
    }
    let list = this.data.notifications || [];
    if (recipientRole) {
      list = list.filter(n => n.recipientRole === recipientRole || n.recipientRole === 'all' || (recipientId && n.recipientId === recipientId));
    }
    return list;
  }

  async sendNotification(notifData) {
    const notif = {
      id: "notif_" + Date.now(),
      read: false,
      timestamp: new Date().toISOString(),
      ...notifData
    };

    if (this.isLive) {
      try {
        await this.firestore.collection('notifications').doc(notif.id).set(notif);
      } catch (e) {
        console.error('Firestore sendNotification error:', e);
      }
    }

    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(notif);

    // Trigger in-app sound chime and Web Notification
    if (window.SMARTCARE_FCM) {
      window.SMARTCARE_FCM.triggerLocalAlert(notif.title, notif.body, notif.type);
    }

    this.persist();
    return notif;
  }

  async markNotificationAsRead(notifId) {
    const notif = this.data.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      if (this.isLive) {
        try {
          await this.firestore.collection('notifications').doc(notifId).update({ read: true });
        } catch (e) {
          console.error('Firestore markRead error:', e);
        }
      }
      this.persist();
    }
  }

  async sendEmergencySOS(patient) {
    const alert = {
      recipientRole: "all",
      recipientId: "emergency_broadcast",
      title: `EMERGENCY SOS: ${patient.name} (${patient.roomNumber || 'Ward'}, ${patient.bedNumber || 'Bed'})`,
      body: `Immediate assistance required for Patient ${patient.name}. Emergency trigger activated by ${patient.role}. Attending Doctor: ${patient.primaryDoctorName || 'Duty Physician'}.`,
      type: "emergency"
    };
    return await this.sendNotification(alert);
  }

  /* ================= HOSPITAL & AMBULANCE ================= */

  async getHospitalInfo() {
    if (this.isLive) {
      try {
        const doc = await this.firestore.collection('hospital').doc('main_campus').get();
        if (doc.exists) return doc.data();
      } catch (e) {
        console.warn('Firestore hospital fetch failed, fallback to local', e);
      }
    }
    return this.data.hospital || INITIAL_MOCK_DATA.hospital;
  }

  async getAmbulances() {
    if (this.isLive) {
      try {
        const snapshot = await this.firestore.collection('ambulances').get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('Firestore ambulances fetch failed, fallback to local', e);
      }
    }
    return this.data.ambulances || INITIAL_MOCK_DATA.ambulances;
  }

  async updateAmbulanceStatus(ambId, status, location, eta) {
    const amb = (this.data.ambulances || []).find(a => a.id === ambId);
    if (amb) {
      amb.status = status;
      if (location) amb.location = location;
      if (eta) amb.eta = eta;
      if (this.isLive) {
        try {
          await this.firestore.collection('ambulances').doc(ambId).set(amb, { merge: true });
        } catch (e) {
          console.error('Firestore updateAmbulanceStatus error:', e);
        }
      }
      this.persist();
    }
    return amb;
  }

  async dispatchAmbulance(dispatchData) {
    const ambulances = await this.getAmbulances();
    const availableAmb = ambulances.find(a => a.status === 'available') || ambulances[0];
    if (availableAmb) {
      availableAmb.status = 'dispatched';
      availableAmb.location = `En route to ${dispatchData.pickupLocation || 'Emergency Site'}`;
      availableAmb.eta = '6-10 Mins';
      this.persist();

      // Broadcast high priority notification
      await this.sendNotification({
        recipientRole: 'all',
        title: `🚨 AMBULANCE DISPATCHED: ${availableAmb.vehicleNumber}`,
        body: `${availableAmb.type} dispatched to ${dispatchData.pickupLocation || 'Emergency Site'}. Driver: ${availableAmb.driverName} (${availableAmb.driverPhone}). ETA: ${availableAmb.eta}.`,
        type: 'emergency'
      });
    }
    return availableAmb;
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    this.persist();
  }
}

window.SMARTCARE_DB = new DatabaseService();
