/**
 * SMARTCARE – Main Application Controller
 * Handles view routing, dynamic UI rendering, role-based workflows, and real-time syncing.
 */

class SmartCareApp {
  constructor() {
    this.currentSubTabs = {
      patient: 'medications',
      doctor: 'requests',
      nurse: 'med-schedule',
      admin: 'hospitals'
    };
    this.staffSearchQuery = '';
    this.staffRoleFilter = 'all';
    this.adminMapPicker = null;
    this.patientMapController = null;
    this.selectedHospitalForNav = null;
    
    // Bind UI once DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    console.log('[SMARTCARE] Application initialized.');

    // Update connection status badge
    this.updateConnectionBadge();

    // Initialize i18n
    if (window.SMARTCARE_I18N) {
      window.SMARTCARE_I18N.applyTranslations();
    }

    // Subscribe to auth state
    window.SMARTCARE_AUTH.onAuthStateChanged(user => {
      this.handleUserChange(user);
    });

    // Subscribe to database updates
    window.SMARTCARE_DB.subscribe(() => {
      const user = window.SMARTCARE_AUTH.getCurrentUser();
      if (user) {
        this.renderCurrentRoleView(user);
        this.updateNotificationBadge();
      }
    });

    // Set today's date in forms and displays
    this.setInitialDates();

    // Start background reminder interval checker (runs every 60 seconds)
    this.startMedicationReminderTimer();
  }

  updateConnectionBadge() {
    const isLive = window.SMARTCARE_CONFIG?.isFirebaseConfigured();
    const badge = document.getElementById('system-mode-badge');
    const text = document.getElementById('system-mode-text');
    
    if (badge && text) {
      if (isLive) {
        badge.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/40';
        text.innerText = 'Firebase Cloud Connected';
      } else {
        badge.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-500/40';
        text.innerText = 'Demo Mode (Zero-Setup Active)';
      }
    }
  }

  setInitialDates() {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const bookDateInput = document.getElementById('book-date');
    if (bookDateInput) bookDateInput.value = today;

    const rxStartDate = document.getElementById('rx-start-date');
    if (rxStartDate) rxStartDate.value = today;

    const rxEndDate = document.getElementById('rx-end-date');
    if (rxEndDate) rxEndDate.value = nextMonth;

    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
      dateDisplay.innerText = new Date().toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
    }
  }

  /**
   * Helper to derive stylized initials for zero-photo avatars
   */
  getInitials(name) {
    if (!name) return 'SC';
    const clean = name.replace(/^(Dr\.|Sister|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0] || 'SC').slice(0, 2).toUpperCase();
  }

  /**
   * Handle session user change
   */
  async handleUserChange(user) {
    const avatarBadge = document.getElementById('header-avatar-badge');
    const username = document.getElementById('header-username');
    const userphone = document.getElementById('header-userphone');
    const roleBadge = document.getElementById('header-role-badge');
    const logoutBtn = document.getElementById('header-logout-btn');

    if (!user) {
      if (avatarBadge) avatarBadge.innerText = '--';
      if (username) username.innerText = 'Visitor';
      if (userphone) userphone.innerText = 'Sign in to access';
      if (roleBadge) {
        roleBadge.innerText = 'PUBLIC ACCESS';
        roleBadge.className = 'badge-status badge-observation';
      }
      if (logoutBtn) logoutBtn.classList.add('hidden');
      document.querySelectorAll('.persona-btn').forEach(btn => btn.classList.remove('ring-2', 'ring-white/50'));
      document.querySelectorAll('.role-view').forEach(view => view.classList.add('hidden'));
      this.openAuthModal();
      return;
    }

    if (logoutBtn) logoutBtn.classList.remove('hidden');

    // Update Header Profile Info (Initials badge & username)
    if (avatarBadge) avatarBadge.innerText = this.getInitials(user.name);
    if (username) username.innerText = user.name || 'User';
    if (userphone) {
      const handle = user.username ? `@${user.username}` : '';
      userphone.innerText = handle ? `${handle} • ${user.phone || ''}` : (user.phone || '');
    }
    if (roleBadge) {
      roleBadge.innerText = `${user.role.toUpperCase()} PORTAL`;
      roleBadge.className = `badge-status ${
        user.role === 'doctor' ? 'badge-confirmed' :
        user.role === 'nurse' ? 'badge-stable' :
        user.role === 'admin' ? 'badge-pending' :
        user.role === 'caregiver' ? 'badge-observation' : 'badge-observation'
      }`;
    }

    // Highlight active persona switch button
    document.querySelectorAll('.persona-btn').forEach(btn => {
      if (btn.getAttribute('data-role') === user.role) {
        btn.classList.add('ring-2', 'ring-white/50');
      } else {
        btn.classList.remove('ring-2', 'ring-white/50');
      }
    });

    // Render active dashboard
    this.renderCurrentRoleView(user);
    this.updateNotificationBadge();
  }

  /**
   * Display the appropriate view based on role
   */
  async renderCurrentRoleView(user) {
    const role = user.role || 'patient';

    // Hide all role views
    document.querySelectorAll('.role-view').forEach(view => {
      view.classList.add('hidden');
    });

    const activeView = document.getElementById(`view-${role}`);
    if (activeView) {
      activeView.classList.remove('hidden');
    }

    // Render specific dashboard data
    switch (role) {
      case 'patient':
        await this.renderPatientDashboard(user);
        break;
      case 'doctor':
        await this.renderDoctorDashboard(user);
        break;
      case 'nurse':
        await this.renderNurseDashboard(user);
        break;
      case 'caregiver':
        await this.renderCaregiverDashboard(user);
        break;
      case 'admin':
        if (!window.SMARTCARE_AUTH.isAdminAuthorized()) {
          this.openAdminLoginModal();
          return;
        }
        await this.renderAdminDashboard(user);
        break;
    }
  }

  /* ========================================================== */
  /* 1. PATIENT DASHBOARD LOGIC                                 */
  /* ========================================================== */

  async renderPatientDashboard(user) {
    // Populate Profile Card (Zero-photo stylized initials & username)
    const patCardName = document.getElementById('pat-card-name');
    if (patCardName) patCardName.innerText = user.name || 'Patient';
    const patCardBadge = document.getElementById('pat-card-badge');
    if (patCardBadge) patCardBadge.innerText = this.getInitials(user.name || 'Patient');
    const patCardUser = document.getElementById('pat-card-username');
    if (patCardUser) patCardUser.innerText = user.username ? `@${user.username}` : '@patient';

    const patCardAge = document.getElementById('pat-card-age');
    if (patCardAge) patCardAge.innerText = user.age || '--';
    const patCardBlood = document.getElementById('pat-card-blood');
    if (patCardBlood) patCardBlood.innerText = user.bloodGroup || '--';
    const patCardPhone = document.getElementById('pat-card-phone');
    if (patCardPhone) patCardPhone.innerText = user.phone || '--';
    const patCardDiag = document.getElementById('pat-card-diag');
    if (patCardDiag) patCardDiag.innerText = `Diagnosis: ${user.diagnosis || 'General Checkup'}`;
    const patCardRoomBed = document.getElementById('pat-card-roombed');
    if (patCardRoomBed) patCardRoomBed.innerText = (user.roomNumber && user.bedNumber) ? `${user.roomNumber}, ${user.bedNumber}` : (user.admissionStatus || 'Outpatient');
    const patCardWard = document.getElementById('pat-card-ward');
    if (patCardWard) patCardWard.innerText = user.ward || 'General Outpatient';
    const patCardDoctor = document.getElementById('pat-card-doctor');
    if (patCardDoctor) patCardDoctor.innerText = user.primaryDoctorName || 'To be assigned by Hospital Admin';

    // 1. Render Medicine Schedule Timeline indexed by Username / ID
    const patientIdentifier = user.username || user.id;
    const patientLogs = await window.SMARTCARE_DB.getMedicationLogs(patientIdentifier);
    
    const timelineContainer = document.getElementById('pat-medicine-timeline');
    if (timelineContainer) {
      if (patientLogs.length === 0) {
        timelineContainer.innerHTML = `
          <div class="glass-card p-6 text-center text-slate-400 text-xs">
            No medication scheduled for today. Consult your attending physician.
          </div>
        `;
      } else {
        timelineContainer.innerHTML = patientLogs.map(log => {
          const isTaken = log.status === 'taken' || log.status === 'administered';
          return `
            <div class="glass-card glass-card-hover p-4 border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl ${isTaken ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'} flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h4 class="font-bold text-white text-sm">${log.medicineName}</h4>
                    <span class="badge-status ${isTaken ? 'badge-taken' : 'badge-pending'}">${log.status}</span>
                  </div>
                  <div class="text-xs text-sky-400 font-medium mt-0.5">Scheduled: ${log.slot}</div>
                  <p class="text-xs text-slate-300 mt-1">${log.notes || 'Take as advised by your doctor.'}</p>
                  ${log.administeredBy ? `<div class="text-[11px] text-slate-400 mt-1">Confirmed by: <strong class="text-slate-200">${log.administeredBy}</strong></div>` : ''}
                </div>
              </div>

              <div class="flex items-center gap-2 self-end sm:self-center">
                ${!isTaken ? `
                  <button onclick="window.SMARTCARE_APP.markPatientMedication('${log.id}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Mark as Taken
                  </button>
                ` : `
                  <span class="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Dose Complete
                  </span>
                `}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Calculate Adherence Score
    const totalDoses = patientLogs.length;
    const completedDoses = patientLogs.filter(l => l.status === 'taken' || l.status === 'administered').length;
    const adherencePct = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 100;
    const adherenceElem = document.getElementById('pat-adherence-pct');
    if (adherenceElem) adherenceElem.innerText = `${adherencePct}%`;

    // 2. Render Active Prescriptions Table
    const allRx = await window.SMARTCARE_DB.getPrescriptions(patientIdentifier);
    const patientRx = allRx.filter(r => (r.patientUsername === user.username || r.patientId === user.id) && r.status === 'active');
    const rxTable = document.getElementById('pat-active-prescriptions-table');
    if (rxTable) {
      if (patientRx.length === 0) {
        rxTable.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">No active prescriptions currently on record.</td></tr>`;
      } else {
        rxTable.innerHTML = patientRx.map(rx => `
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="p-3 font-semibold text-white">${rx.medicineName} <span class="text-xs text-sky-400 font-normal">(${rx.dosage})</span></td>
            <td class="p-3 text-slate-300">${Array.isArray(rx.timings) ? rx.timings.join(', ') : rx.timings}</td>
            <td class="p-3"><span class="badge-status badge-observation">${rx.mealInstruction || 'After Food'}</span></td>
            <td class="p-3 text-slate-300 max-w-xs">${rx.instructions}</td>
            <td class="p-3 text-slate-400">${rx.startDate} to ${rx.endDate}</td>
          </tr>
        `).join('');
      }
    }

    // 3. Render Doctors for Appointment Booking
    await this.renderAppointmentDoctorCards();

    // 4. Render My Booked Appointments
    await this.renderPatientAppointmentsList(patientIdentifier);

    // 5. Render Recent Vitals History
    const vitals = await window.SMARTCARE_DB.getVitals(patientIdentifier);
    const vitalsContainer = document.getElementById('pat-latest-vitals-container');
    if (vitalsContainer) {
      if (vitals.length === 0) {
        vitalsContainer.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No clinical vitals logged yet today.</div>`;
      } else {
        vitalsContainer.innerHTML = vitals.map(v => `
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-white flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${v.condition === 'Stable' ? 'bg-emerald-400' : 'bg-red-400'}"></span>
                Condition: ${v.condition}
              </span>
              <span class="text-slate-400 font-mono text-[11px]">${new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="grid grid-cols-4 gap-2 text-center text-xs py-1 bg-slate-950/40 rounded-lg">
              <div>
                <div class="text-[10px] text-slate-400">Temp</div>
                <div class="font-bold text-slate-200">${v.temperature}°F</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-400">BP</div>
                <div class="font-bold text-sky-400">${v.bloodPressure}</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-400">Pulse</div>
                <div class="font-bold text-emerald-400">${v.pulse} bpm</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-400">SpO2</div>
                <div class="font-bold text-teal-400">${v.spO2}%</div>
              </div>
            </div>
            <p class="text-xs text-slate-300 italic">"${v.nursingNotes || v.generalObservations}"</p>
            <div class="text-[10px] text-slate-400 text-right">Nurse: ${v.nurseName}</div>
          </div>
        `).join('');
      }
    }

    // 6. Render Hospital Location & Interactive Google Maps Navigation
    await this.renderPatientHospitalMap();
    await this.renderHospitalLocation();

    // 7. Render 24x7 Ambulance Fleet
    await this.renderAmbulanceFleet();
  }

  async renderAppointmentDoctorCards(department = 'All') {
    const doctors = await window.SMARTCARE_DB.getDoctors();
    const filtered = department === 'All' ? doctors : doctors.filter(d => d.department === department);
    const container = document.getElementById('apt-doctor-cards-grid');

    if (container) {
      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-full p-8 text-center glass-card border border-dashed border-slate-700/80 rounded-2xl">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3 text-2xl">👨‍⚕️</div>
            <h4 class="text-white font-bold text-sm">No Doctors Registered Yet</h4>
            <p class="text-slate-400 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
              Staff records are centralized. As soon as the Hospital Administrator registers doctors in the <strong>Admin Dashboard > Staff Management</strong>, they will instantly appear here for one-click appointment booking.
            </p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(doc => `
        <div class="glass-card glass-card-hover p-5 border-slate-700/60 flex flex-col justify-between space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-lg font-bold ring-2 ring-teal-500/30 select-none shrink-0 shadow-lg">
              ${this.getInitials(doc.name)}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-white text-base">${doc.name}</h4>
                <span class="text-xs font-mono text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-500/30">@${doc.username || 'doctor'}</span>
              </div>
              <div class="text-xs text-sky-400 font-semibold mt-0.5">${doc.specialization}</div>
              <div class="text-xs text-slate-300 mt-0.5">${doc.qualification} • ${doc.experience} Yrs Exp</div>
              <div class="text-[11px] text-slate-400 mt-1">Room: <strong class="text-slate-200">${doc.roomNumber}</strong></div>
            </div>
          </div>

          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <div class="flex justify-between text-slate-400">
              <span>Available Days:</span>
              <span class="font-medium text-slate-200">${Array.isArray(doc.availableDays) ? doc.availableDays.join(', ') : doc.availableDays}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Consultation Hours:</span>
              <span class="font-medium text-emerald-400">${doc.timings}</span>
            </div>
          </div>

          <button onclick="window.SMARTCARE_APP.selectDoctorForBooking('${doc.id}')" class="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Select Doctor & Book Slot
          </button>
        </div>
      `).join('');
    }
  }

  filterDoctorsByDepartment(dept) {
    this.renderAppointmentDoctorCards(dept);
  }

  async selectDoctorForBooking(doctorId) {
    const doc = await window.SMARTCARE_DB.getDoctorById(doctorId);
    if (!doc) return;

    const box = document.getElementById('appointment-booking-box');
    const docName = document.getElementById('booking-doc-name');
    const docMeta = document.getElementById('booking-doc-meta');
    const docIdInput = document.getElementById('book-doc-id');
    const slotSelect = document.getElementById('book-slot');

    if (box && docName && docMeta && docIdInput && slotSelect) {
      docName.innerText = doc.name;
      docMeta.innerText = `${doc.specialization} • ${doc.hospitalName} (${doc.roomNumber})`;
      docIdInput.value = doc.id;

      // Populate doctor's available slots
      const slots = doc.slots && doc.slots.length > 0 
        ? doc.slots 
        : ["09:30 AM", "10:00 AM", "10:30 AM", "11:15 AM", "12:00 PM", "04:30 PM", "05:15 PM"];

      slotSelect.innerHTML = slots.map(s => `<option value="${s}">${s}</option>`).join('');

      box.classList.remove('hidden');
      box.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async handleBookAppointment(event) {
    event.preventDefault();
    const user = window.SMARTCARE_AUTH.getCurrentUser();
    const docId = document.getElementById('book-doc-id').value;
    const doc = await window.SMARTCARE_DB.getDoctorById(docId);
    const date = document.getElementById('book-date').value;
    const slot = document.getElementById('book-slot').value;
    const reason = document.getElementById('book-reason').value;

    if (!doc) return;

    const appointment = {
      patientId: user.id,
      patientUsername: user.username || '',
      patientName: user.name,
      patientPhone: user.phone,
      doctorId: doc.id,
      doctorName: doc.name,
      department: doc.specialization,
      appointmentDate: date,
      timeSlot: slot,
      reason: reason
    };

    await window.SMARTCARE_DB.bookAppointment(appointment);
    window.SMARTCARE_FCM.showToast('Appointment Booked!', `Your slot with ${doc.name} on ${date} at ${slot} is sent for confirmation.`, 'success');

    // Reset and hide form
    document.getElementById('appointment-booking-box').classList.add('hidden');
    document.getElementById('book-reason').value = '';

    // Refresh views
    this.renderPatientAppointmentsList(user.username || user.id);
  }

  async renderPatientAppointmentsList(patientIdentifier) {
    const myApts = await window.SMARTCARE_DB.getAppointments(patientIdentifier);
    const container = document.getElementById('pat-appointments-list');

    if (container) {
      if (myApts.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">No appointment bookings found.</div>`;
      } else {
        container.innerHTML = myApts.map(apt => `
          <div class="glass-card glass-card-hover p-4 border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-white text-sm">${apt.doctorName}</h4>
                <span class="badge-status ${
                  apt.status === 'confirmed' ? 'badge-confirmed' :
                  apt.status === 'pending' ? 'badge-pending' :
                  apt.status === 'completed' ? 'badge-stable' : 'badge-critical'
                }">${apt.status}</span>
              </div>
              <div class="text-xs text-sky-400 mt-0.5">${apt.department} • Scheduled: <strong>${apt.appointmentDate} at ${apt.timeSlot}</strong></div>
              <p class="text-xs text-slate-300 mt-1">Reason: ${apt.reason}</p>
              ${apt.doctorNotes ? `<div class="text-xs text-emerald-400 mt-1 font-medium">Doctor's Remark: "${apt.doctorNotes}"</div>` : ''}
            </div>

            <div class="flex items-center gap-2 self-end sm:self-center">
              ${apt.status === 'pending' || apt.status === 'confirmed' ? `
                <button onclick="window.SMARTCARE_APP.cancelPatientAppointment('${apt.id}')" class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-semibold transition-all">
                  Cancel Booking
                </button>
              ` : ''}
            </div>
          </div>
        `).join('');
      }
    }
  }

  async cancelPatientAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment according to hospital cancellation rules?')) {
      await window.SMARTCARE_DB.cancelAppointment(appointmentId, 'Cancelled by patient request.');
      window.SMARTCARE_FCM.showToast('Appointment Cancelled', 'Your appointment has been cancelled.', 'info');
      const user = window.SMARTCARE_AUTH.getCurrentUser();
      this.renderPatientAppointmentsList(user.id);
    }
  }

  async markPatientMedication(logId) {
    const user = window.SMARTCARE_AUTH.getCurrentUser();
    await window.SMARTCARE_DB.markMedicationTaken(logId, user.name);
    window.SMARTCARE_FCM.showToast('Medication Confirmed!', 'Great job maintaining your medication schedule on time.', 'success');
    this.renderPatientDashboard(user);
  }

  /* ========================================================== */
  /* 2. DOCTOR DASHBOARD LOGIC                                  */
  /* ========================================================== */

  async renderDoctorDashboard(user) {
    // Populate Hero (Zero-photo stylized initials & username)
    document.getElementById('doc-hero-name').innerText = user.name;
    document.getElementById('doc-hero-spec').innerText = `${user.specialization || 'Cardiology'} • ${user.qualification || 'MD, DM'} • ${user.experience || '14'} Yrs Exp`;
    document.getElementById('doc-hero-room').innerText = user.roomNumber || 'OPD Suite 104';
    const docBadge = document.getElementById('doc-hero-badge');
    if (docBadge) docBadge.innerText = this.getInitials(user.name);
    const docUserSpan = document.getElementById('doc-hero-username');
    if (docUserSpan) docUserSpan.innerText = `@${user.username || 'dr_sarah'}`;

    // 1. Render Appointment Requests
    const appointments = await window.SMARTCARE_DB.getAppointments();
    const docApts = appointments.filter(a => a.doctorId === user.id || user.name.includes(a.doctorName) || a.doctorId === 'usr_doc_1');
    const aptList = document.getElementById('doc-appointments-list');

    if (aptList) {
      if (docApts.length === 0) {
        aptList.innerHTML = `<div class="glass-card p-6 text-center text-slate-400 text-xs">No appointment requests found.</div>`;
      } else {
        aptList.innerHTML = docApts.map(apt => `
          <div class="glass-card glass-card-hover p-4 border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-white text-sm">${apt.patientName}</h4>
                <span class="text-xs font-mono text-slate-400 font-semibold">${apt.patientPhone}</span>
                <span class="badge-status ${
                  apt.status === 'confirmed' ? 'badge-confirmed' :
                  apt.status === 'pending' ? 'badge-pending' :
                  apt.status === 'completed' ? 'badge-stable' : 'badge-critical'
                }">${apt.status}</span>
              </div>
              <div class="text-xs text-sky-400 mt-1">Requested Slot: <strong>${apt.appointmentDate} at ${apt.timeSlot}</strong></div>
              <p class="text-xs text-slate-300 mt-1">Symptoms: ${apt.reason}</p>
            </div>

            <div class="flex flex-wrap items-center gap-2 self-end md:self-center">
              ${apt.status === 'pending' ? `
                <button onclick="window.SMARTCARE_APP.updateAppointmentStatus('${apt.id}', 'confirmed')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30">
                  Accept Slot
                </button>
                <button onclick="window.SMARTCARE_APP.updateAppointmentStatus('${apt.id}', 'rejected')" class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-bold">
                  Reject
                </button>
              ` : apt.status === 'confirmed' ? `
                <button onclick="window.SMARTCARE_APP.updateAppointmentStatus('${apt.id}', 'completed')" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold">
                  Mark Consulted
                </button>
              ` : `
                <span class="text-xs text-slate-400 font-semibold">Processed</span>
              `}
            </div>
          </div>
        `).join('');
      }
    }

    // 2. Populate Patient Select Dropdown for Prescriptions (Bound to patient username)
    const users = await window.SMARTCARE_DB.getUsers();
    const patients = users.filter(u => u.role === 'patient');
    const patSelect = document.getElementById('rx-patient-select');
    if (patSelect) {
      patSelect.innerHTML = patients.map(p => `
        <option value="${p.id}" data-username="${p.username || ''}" data-name="${p.name}" data-room="${p.roomNumber || 'Outpatient'}">${p.name} (@${p.username || 'patient'}) - ${p.phone} (${p.roomNumber || 'OPD'})</option>
      `).join('');
    }

    // 3. Render Prescriptions Issued by this Doctor
    const allRx = await window.SMARTCARE_DB.getPrescriptions();
    const docRx = allRx.filter(r => r.doctorId === user.id || r.doctorName === user.name || r.doctorId === 'usr_doc_1');
    const rxHistContainer = document.getElementById('doc-prescriptions-history');

    if (rxHistContainer) {
      if (docRx.length === 0) {
        rxHistContainer.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No prescriptions recorded yet.</div>`;
      } else {
        rxHistContainer.innerHTML = docRx.map(r => `
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white text-sm">${r.medicineName}</span>
                <span class="badge-status badge-observation">${r.dosage}</span>
                <span class="badge-status badge-confirmed">${r.status}</span>
              </div>
              <div class="text-slate-400 mt-1">Patient: <strong class="text-slate-200">${r.patientName}</strong> • Frequency: ${r.frequency} (${r.mealInstruction})</div>
              <div class="text-slate-300 mt-1 italic">Instructions: "${r.instructions}"</div>
            </div>
            <div class="text-[11px] text-slate-400 text-right">
              <div>Valid: ${r.startDate} to ${r.endDate}</div>
            </div>
          </div>
        `).join('');
      }
    }

    // 4. Render Patient Vitals Monitor
    const vitals = await window.SMARTCARE_DB.getVitals();
    const vitalsGrid = document.getElementById('doc-patient-vitals-grid');
    if (vitalsGrid) {
      vitalsGrid.innerHTML = vitals.map(v => `
        <div class="glass-card p-4 border-slate-700/60 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-bold text-white text-sm">${v.patientName}</h4>
              <span class="text-[11px] text-slate-400">Recorded by ${v.nurseName}</span>
            </div>
            <span class="badge-status ${v.condition === 'Stable' ? 'badge-stable' : v.condition === 'Critical' ? 'badge-critical' : 'badge-observation'}">${v.condition}</span>
          </div>

          <div class="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-slate-900/80 rounded-xl border border-slate-800">
            <div>
              <div class="text-[10px] text-slate-400">Temp</div>
              <div class="font-bold ${parseFloat(v.temperature) >= 100 ? 'text-red-400' : 'text-slate-200'}">${v.temperature}°F</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">BP</div>
              <div class="font-bold text-sky-400">${v.bloodPressure}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">Pulse</div>
              <div class="font-bold text-emerald-400">${v.pulse} bpm</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">SpO2</div>
              <div class="font-bold ${parseInt(v.spO2) < 94 ? 'text-red-400' : 'text-teal-400'}">${v.spO2}%</div>
            </div>
          </div>

          <div class="text-xs text-slate-300">
            <strong>Nursing Notes:</strong> ${v.nursingNotes || v.generalObservations}
          </div>
          <div class="text-[10px] text-slate-500 font-mono text-right">${new Date(v.recordedAt).toLocaleString()}</div>
        </div>
      `).join('');
    }
  }

  async updateAppointmentStatus(appointmentId, status) {
    let notes = '';
    if (status === 'confirmed') {
      notes = prompt('Add optional pre-consultation notes for patient:', 'Please carry your previous medical records.');
    }
    await window.SMARTCARE_DB.updateAppointmentStatus(appointmentId, status, notes || '');
    window.SMARTCARE_FCM.showToast(`Appointment ${status.toUpperCase()}`, `Patient has been notified of the update.`, 'success');
    const user = window.SMARTCARE_AUTH.getCurrentUser();
    this.renderDoctorDashboard(user);
  }

  async handleCreatePrescription(event) {
    event.preventDefault();
    const doc = window.SMARTCARE_AUTH.getCurrentUser();
    const patSelect = document.getElementById('rx-patient-select');
    const selectedOption = patSelect.options[patSelect.selectedIndex];
    
    const patientId = patSelect.value;
    const patientUsername = selectedOption.getAttribute('data-username') || '';
    const patientName = selectedOption.getAttribute('data-name');
    const patientRoom = selectedOption.getAttribute('data-room');

    const medicineName = document.getElementById('rx-med-name').value;
    const dosage = document.getElementById('rx-dosage').value;
    const frequency = document.getElementById('rx-frequency').value;
    const mealInstruction = document.getElementById('rx-meal-inst').value;

    const timings = [];
    if (document.getElementById('time-morning').checked) timings.push('Morning (08:00 AM)');
    if (document.getElementById('time-afternoon').checked) timings.push('Afternoon (01:00 PM)');
    if (document.getElementById('time-night').checked) timings.push('Night (08:00 PM)');

    if (timings.length === 0) {
      alert('Please select at least one dosage timing (Morning, Afternoon, or Night).');
      return;
    }

    const startDate = document.getElementById('rx-start-date').value;
    const endDate = document.getElementById('rx-end-date').value;
    const instructions = document.getElementById('rx-instructions').value;
    const additionalCare = document.getElementById('rx-additional-care').value;

    const prescription = {
      patientId,
      patientUsername,
      patientName,
      patientRoom,
      doctorId: doc.id,
      doctorName: doc.name,
      medicineName,
      dosage,
      timings,
      frequency,
      mealInstruction,
      startDate,
      endDate,
      instructions,
      additionalCare
    };

    await window.SMARTCARE_DB.createPrescription(prescription);
    window.SMARTCARE_FCM.showToast('Prescription Saved!', `${medicineName} added. Nurse and Patient schedules updated.`, 'success');

    // Reset fields
    document.getElementById('rx-med-name').value = '';
    document.getElementById('rx-dosage').value = '';
    document.getElementById('rx-instructions').value = '';
    document.getElementById('rx-additional-care').value = '';

    this.renderDoctorDashboard(doc);
  }

  openDoctorAvailabilityModal() {
    const doc = window.SMARTCARE_AUTH.getCurrentUser();
    const room = prompt('Enter your consultation room / suite:', doc.roomNumber || 'OPD Suite 104');
    if (room) {
      doc.roomNumber = room;
      window.SMARTCARE_DB.saveDoctor(doc);
      window.SMARTCARE_FCM.showToast('Availability Updated', 'Your room details have been saved.', 'success');
      this.renderDoctorDashboard(doc);
    }
  }

  /* ========================================================== */
  /* 3. NURSE DASHBOARD LOGIC                                   */
  /* ========================================================== */

  async renderNurseDashboard(user) {
    // Populate Hero (Zero-photo stylized initials & username)
    const nurseHeroName = document.getElementById('nurse-hero-name');
    if (nurseHeroName) nurseHeroName.innerText = user.name || 'Hospital Staff Nurse';
    const nurseBadge = document.getElementById('nurse-hero-badge');
    if (nurseBadge) nurseBadge.innerText = this.getInitials(user.name);
    const nurseUserSpan = document.getElementById('nurse-hero-username');
    if (nurseUserSpan) nurseUserSpan.innerText = `@${user.username || 'nurse_anita'}`;

    // 1. Medication Administration Schedule
    const logs = await window.SMARTCARE_DB.getMedicationLogs();
    const checklist = document.getElementById('nurse-med-checklist');

    if (checklist) {
      if (logs.length === 0) {
        checklist.innerHTML = `<div class="glass-card p-6 text-center text-slate-400 text-xs">No active inpatient medication doses due.</div>`;
      } else {
        checklist.innerHTML = logs.map(log => {
          const isDone = log.status === 'administered' || log.status === 'taken';
          return `
            <div class="glass-card glass-card-hover p-4 border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl ${isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'} flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                </div>
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h4 class="font-bold text-white text-sm">${log.patientName}</h4>
                    <span class="text-xs text-sky-400 font-mono font-semibold">${log.medicineName}</span>
                    <span class="badge-status ${isDone ? 'badge-administered' : 'badge-pending'}">${log.status}</span>
                  </div>
                  <div class="text-xs text-slate-400 mt-1">Due Slot: <strong class="text-amber-400">${log.slot}</strong> • Instructions: ${log.notes || 'Take as advised.'}</div>
                  ${log.administeredBy ? `<div class="text-[11px] text-emerald-400 mt-0.5">Administered by: <strong>${log.administeredBy}</strong></div>` : ''}
                </div>
              </div>

              <div class="flex items-center gap-2 self-end md:self-center">
                ${!isDone ? `
                  <button onclick="window.SMARTCARE_APP.administerMedicationAsNurse('${log.id}')" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Confirm Administered
                  </button>
                ` : `
                  <span class="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Completed
                  </span>
                `}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Populate Patient Select for Vitals (Bound to patient username)
    const users = await window.SMARTCARE_DB.getUsers();
    const admittedPatients = users.filter(u => u.role === 'patient');
    const vitalsPatSelect = document.getElementById('vitals-patient-select');
    if (vitalsPatSelect) {
      vitalsPatSelect.innerHTML = admittedPatients.map(p => `
        <option value="${p.id}" data-username="${p.username || ''}" data-name="${p.name}">${p.name} (@${p.username || 'patient'}) - ${p.roomNumber || 'Room 204'}, ${p.bedNumber || 'Bed B-02'}</option>
      `).join('');
    }

    // 3. Nurse Vitals History
    const vitals = await window.SMARTCARE_DB.getVitals();
    const vitalsHistory = document.getElementById('nurse-vitals-history');
    if (vitalsHistory) {
      vitalsHistory.innerHTML = vitals.map(v => `
        <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
          <div class="flex justify-between items-center">
            <span class="font-bold text-white">${v.patientName}</span>
            <span class="badge-status ${v.condition === 'Stable' ? 'badge-stable' : v.condition === 'Critical' ? 'badge-critical' : 'badge-observation'}">${v.condition}</span>
          </div>
          <div class="text-slate-300">Temp: <strong>${v.temperature}°F</strong> | BP: <strong>${v.bloodPressure}</strong> | Pulse: <strong>${v.pulse} bpm</strong> | SpO2: <strong>${v.spO2}%</strong></div>
          <div class="text-slate-400 italic">"${v.nursingNotes}"</div>
          <div class="text-[10px] text-slate-500 font-mono text-right">Logged: ${new Date(v.recordedAt).toLocaleString()} by ${v.nurseName}</div>
        </div>
      `).join('');
    }

    // 4. Ward Beds Grid
    const beds = await window.SMARTCARE_DB.getBeds();
    const wardBedsGrid = document.getElementById('nurse-ward-beds-grid');
    if (wardBedsGrid) {
      wardBedsGrid.innerHTML = beds.map(b => `
        <div class="p-4 rounded-xl border ${b.status === 'occupied' ? 'bg-slate-900/90 border-sky-500/40' : 'bg-slate-900/40 border-slate-800'} space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="font-bold text-white">${b.roomNumber} • ${b.bedNumber}</span>
            <span class="badge-status ${b.status === 'occupied' ? 'badge-confirmed' : 'badge-pending'}">${b.status}</span>
          </div>
          <div class="text-slate-400">${b.ward}</div>
          <div class="text-sm font-semibold text-slate-200 mt-1">${b.patientName || 'Available Bed'}</div>
        </div>
      `).join('');
    }
  }

  async administerMedicationAsNurse(logId) {
    const nurse = window.SMARTCARE_AUTH.getCurrentUser();
    const notes = prompt('Enter administration observation notes (optional):', 'Dose swallowed smoothly with water. Pre-dose vitals normal.');
    await window.SMARTCARE_DB.markMedicationAdministered(logId, nurse.name, notes || '');
    window.SMARTCARE_FCM.showToast('Medication Administered', 'Dose administration logged and verified.', 'success');
    this.renderNurseDashboard(nurse);
  }

  async handleRecordVitals(event) {
    event.preventDefault();
    const nurse = window.SMARTCARE_AUTH.getCurrentUser();
    const patSelect = document.getElementById('vitals-patient-select');
    const selectedOption = patSelect.options[patSelect.selectedIndex];

    const vitalsData = {
      patientId: patSelect.value,
      patientUsername: selectedOption.getAttribute('data-username') || '',
      patientName: selectedOption.getAttribute('data-name'),
      condition: document.getElementById('vitals-condition').value,
      temperature: parseFloat(document.getElementById('vitals-temp').value),
      bloodPressure: document.getElementById('vitals-bp').value,
      pulse: parseInt(document.getElementById('vitals-pulse').value),
      spO2: parseInt(document.getElementById('vitals-spo2').value),
      generalObservations: document.getElementById('vitals-observations').value,
      nursingNotes: document.getElementById('vitals-notes').value,
      nurseId: nurse.id,
      nurseName: nurse.name
    };

    await window.SMARTCARE_DB.recordVitals(vitalsData);
    window.SMARTCARE_FCM.showToast('Vitals Recorded Successfully', `Updated health status for ${vitalsData.patientName}.`, 'success');

    // Reset observation and notes
    document.getElementById('vitals-observations').value = '';
    document.getElementById('vitals-notes').value = '';

    this.renderNurseDashboard(nurse);
  }

  /* ========================================================== */
  /* 4. CAREGIVER DASHBOARD LOGIC                               */
  /* ========================================================== */

  async renderCaregiverDashboard(user) {
    const targetUsername = user.linkedPatientUsername || '';
    let patient = null;
    if (targetUsername) {
      patient = (await window.SMARTCARE_DB.getUserByUsername(targetUsername)) || 
                (user.linkedPatientId ? await window.SMARTCARE_DB.getUserById(user.linkedPatientId) : null);
    }
    const patientIdentifier = patient ? (patient.username || patient.id) : targetUsername;

    // Zero-photo initials badge & username display
    const caregiverNameElem = document.getElementById('caregiver-hero-name');
    if (caregiverNameElem) caregiverNameElem.innerText = user.name || 'Caregiver';
    const caregiverUserSpan = document.getElementById('caregiver-hero-username');
    if (caregiverUserSpan) caregiverUserSpan.innerText = `@${user.username || 'caregiver'}`;
    const caregiverBadge = document.getElementById('caregiver-hero-badge');
    if (caregiverBadge) caregiverBadge.innerText = this.getInitials(user.name || 'Caregiver');

    const monitoringNameElem = document.getElementById('caregiver-monitoring-patient');
    if (monitoringNameElem) monitoringNameElem.innerText = patient ? patient.name : 'No Patient Linked';
    const monitoringUserElem = document.getElementById('caregiver-monitoring-username');
    if (monitoringUserElem) monitoringUserElem.innerText = patient ? `@${patient.username}` : 'Pending assignment';

    const vitals = await window.SMARTCARE_DB.getVitals(patientIdentifier);
    const latestVital = vitals[0] || {
      condition: 'Stable',
      temperature: 98.6,
      bloodPressure: '122/80',
      pulse: 74,
      spO2: 98
    };

    // Vitals Gauges
    const gauges = document.getElementById('caregiver-vitals-gauges');
    if (gauges) {
      gauges.innerHTML = `
        <div class="glass-card p-4 border-slate-700/60 text-center">
          <div class="text-[11px] uppercase font-bold text-slate-400">Condition</div>
          <div class="text-xl font-extrabold text-white mt-1">${latestVital.condition}</div>
          <div class="text-[11px] text-emerald-400 mt-1">Normal Resting</div>
        </div>
        <div class="glass-card p-4 border-slate-700/60 text-center">
          <div class="text-[11px] uppercase font-bold text-slate-400">Body Temp</div>
          <div class="text-xl font-extrabold text-slate-200 mt-1">${latestVital.temperature}°F</div>
          <div class="text-[11px] ${latestVital.temperature > 99.5 ? 'text-red-400' : 'text-emerald-400'} mt-1">
            ${latestVital.temperature > 99.5 ? 'Mild Fever' : 'Normal'}
          </div>
        </div>
        <div class="glass-card p-4 border-slate-700/60 text-center">
          <div class="text-[11px] uppercase font-bold text-slate-400">Blood Pressure</div>
          <div class="text-xl font-extrabold text-sky-400 mt-1">${latestVital.bloodPressure}</div>
          <div class="text-[11px] text-sky-300 mt-1">Target Controlled</div>
        </div>
        <div class="glass-card p-4 border-slate-700/60 text-center">
          <div class="text-[11px] uppercase font-bold text-slate-400">Oxygen SpO2</div>
          <div class="text-xl font-extrabold text-teal-400 mt-1">${latestVital.spO2}%</div>
          <div class="text-[11px] text-teal-300 mt-1">Optimal Oxygenation</div>
        </div>
      `;
    }

    // Medication Feed by patient username / identifier
    const patLogs = await window.SMARTCARE_DB.getMedicationLogs(patientIdentifier);
    const feed = document.getElementById('caregiver-med-feed');

    if (feed) {
      feed.innerHTML = patLogs.map(log => `
        <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div class="font-bold text-white">${log.medicineName}</div>
            <div class="text-slate-400 mt-0.5">Time: ${log.slot}</div>
            ${log.administeredBy ? `<div class="text-[11px] text-emerald-400 mt-1 font-medium">Logged by: ${log.administeredBy}</div>` : ''}
          </div>
          <span class="badge-status ${log.status === 'taken' || log.status === 'administered' ? 'badge-taken' : 'badge-pending'}">${log.status}</span>
        </div>
      `).join('');
    }

    // Caregiver upcoming appointments by patient username / identifier
    const patApts = await window.SMARTCARE_DB.getAppointments(patientIdentifier);
    const aptContainer = document.getElementById('caregiver-upcoming-apt');

    if (aptContainer) {
      aptContainer.innerHTML = patApts.slice(0, 3).map(a => `
        <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
          <div>
            <div class="font-bold text-white">${a.doctorName} (${a.department})</div>
            <div class="text-slate-400 mt-0.5">${a.appointmentDate} at ${a.timeSlot}</div>
          </div>
          <span class="badge-status ${a.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}">${a.status}</span>
        </div>
      `).join('');
    }
  }

  /* ========================================================== */
  /* 5. ADMINISTRATOR DASHBOARD LOGIC                           */
  /* ========================================================== */

  async renderAdminDashboard(user) {
    // Populate Hero (Zero-photo stylized initials & username)
    const adminHeroName = document.getElementById('admin-hero-name');
    if (adminHeroName) adminHeroName.innerText = user.name || 'Hospital Administrator';
    const adminBadge = document.getElementById('admin-hero-badge');
    if (adminBadge) adminBadge.innerText = this.getInitials(user.name);
    const adminUserSpan = document.getElementById('admin-hero-username');
    if (adminUserSpan) adminUserSpan.innerText = `@${user.username || 'admin'}`;

    const users = await window.SMARTCARE_DB.getUsers();
    const beds = await window.SMARTCARE_DB.getBeds();
    const appointments = await window.SMARTCARE_DB.getAppointments();
    const logs = await window.SMARTCARE_DB.getMedicationLogs();

    // 1. Render Hospitals & Google Maps Picker
    await this.renderAdminHospitals();

    // 2. Populate Dropdowns for Doctors, Nurses, Caregivers
    await this.populateHospitalDropdowns();

    // 3. Render Role Registration Sections
    await this.renderAdminDoctors();
    await this.renderAdminNurses();
    await this.renderAdminCaregivers();

    // 4. Render All Staff Master Table
    await this.renderStaffManagement();

    // 5. Render Registered Patients Directory
    await this.renderAdminPatients();

    // 2. Patient & System Counters
    const patKpi = document.getElementById('kpi-patients');
    if (patKpi) patKpi.innerText = `${users.filter(u => u.role === 'patient').length} Patients`;

    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const occupancyPct = beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0;
    const bedKpi = document.getElementById('kpi-bed-occupancy');
    if (bedKpi) bedKpi.innerText = `${occupancyPct}%`;

    const completedLogs = logs.filter(l => l.status === 'taken' || l.status === 'administered').length;
    const sysAdherence = logs.length > 0 ? Math.round((completedLogs / logs.length) * 100) : 100;
    const adhKpi = document.getElementById('kpi-adherence');
    if (adhKpi) adhKpi.innerText = `${sysAdherence}%`;

    // 3. Beds Management Grid
    const bedsGrid = document.getElementById('admin-beds-grid');
    if (bedsGrid) {
      bedsGrid.innerHTML = beds.map(b => `
        <div class="glass-card p-4 border-slate-700/60 space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="font-bold text-white text-sm">${b.roomNumber} • ${b.bedNumber}</span>
            <span class="badge-status ${b.status === 'occupied' ? 'badge-critical' : 'badge-stable'}">${b.status}</span>
          </div>
          <div class="text-slate-400">${b.ward}</div>
          <div class="text-sm font-semibold text-slate-200">${b.patientName || 'Vacant / Available'}</div>
          
          <div class="pt-2 flex justify-end">
            ${b.status === 'occupied' ? `
              <button onclick="window.SMARTCARE_APP.vacateBed('${b.id}')" class="px-3 py-1 rounded bg-slate-800 hover:bg-red-900 text-red-300 font-semibold text-xs">
                Discharge / Vacate
              </button>
            ` : `
              <button onclick="window.SMARTCARE_APP.allocateBedModal('${b.id}')" class="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs">
                Allocate Patient
              </button>
            `}
          </div>
        </div>
      `).join('');
    }

    // 4. All Appointments
    const aptList = document.getElementById('admin-all-appointments-list');
    if (aptList) {
      aptList.innerHTML = appointments.map(a => `
        <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
          <div>
            <span class="font-bold text-white">${a.patientName}</span> with <span class="text-sky-400 font-semibold">${a.doctorName}</span>
            <div class="text-slate-400 mt-0.5">${a.department} • ${a.appointmentDate} at ${a.timeSlot}</div>
          </div>
          <span class="badge-status ${a.status === 'confirmed' ? 'badge-confirmed' : a.status === 'pending' ? 'badge-pending' : 'badge-stable'}">${a.status}</span>
        </div>
      `).join('');
    }

    // 5. Audit & Emergency Logs
    const notifications = await window.SMARTCARE_DB.getNotifications();
    const auditLogs = document.getElementById('admin-audit-logs-container');
    if (auditLogs) {
      auditLogs.innerHTML = notifications.map(n => `
        <div class="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start gap-2 ${n.type === 'emergency' ? 'border-red-500/50 bg-red-950/20' : ''}">
          <span class="text-slate-500 text-[11px] shrink-0">${new Date(n.timestamp).toLocaleTimeString()}</span>
          <div class="flex-1">
            <span class="font-bold ${n.type === 'emergency' ? 'text-red-400' : 'text-slate-200'}">[${(n.type || 'SYSTEM').toUpperCase()}]</span>
            <span class="text-slate-300"> ${n.title} – ${n.body}</span>
          </div>
        </div>
      `).join('');
    }
  }

  /* ========================================================== */
  /* CENTRALIZED STAFF MANAGEMENT SYSTEM (ADMIN ONLY)           */
  /* ========================================================== */

  async renderStaffManagement() {
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn';
    const allStaff = await window.SMARTCARE_DB.getStaff();
    const filtered = await window.SMARTCARE_DB.getStaff(this.staffRoleFilter, this.staffSearchQuery);

    // Update staff KPI metrics pills
    const totalCount = allStaff.length;
    const docCount = allStaff.filter(s => s.role === 'doctor').length;
    const nurCount = allStaff.filter(s => s.role === 'nurse').length;
    const carCount = allStaff.filter(s => s.role === 'caretaker').length;

    const kpiCount = document.getElementById('kpi-staff-count');
    if (kpiCount) kpiCount.innerText = `${totalCount} Staff`;
    const kpiSub = document.getElementById('kpi-staff-subtext');
    if (kpiSub) kpiSub.innerText = `${docCount} Docs • ${nurCount} Nurses • ${carCount} Care`;

    const mTotal = document.getElementById('staff-metric-total');
    if (mTotal) mTotal.innerText = isKn ? `ಒಟ್ಟು: ${totalCount}` : `Total: ${totalCount}`;
    const mDocs = document.getElementById('staff-metric-doctors');
    if (mDocs) mDocs.innerText = isKn ? `👨‍⚕️ ವೈದ್ಯರು: ${docCount}` : `👨‍⚕️ Doctors: ${docCount}`;
    const mNurs = document.getElementById('staff-metric-nurses');
    if (mNurs) mNurs.innerText = isKn ? `👩‍⚕️ ನರ್ಸ್‌ಗಳು: ${nurCount}` : `👩‍⚕️ Nurses: ${nurCount}`;
    const mCars = document.getElementById('staff-metric-caretakers');
    if (mCars) mCars.innerText = isKn ? `🤝 ಆರೈಕೆದಾರರು: ${carCount}` : `🤝 Caretakers: ${carCount}`;

    // Render table
    const tableBody = document.getElementById('admin-staff-table-body');
    if (!tableBody) return;

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-400 text-xs">
            No staff records found matching your query. Click "+ Register Staff Member" above to add new staff.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(s => {
      let roleBadgeClass = '';
      let roleLabel = '';
      let deptLabel = '';
      let stationLabel = '';

      if (s.role === 'doctor') {
        roleBadgeClass = 'bg-teal-500/20 text-teal-300 border-teal-500/30';
        roleLabel = isKn ? '👨‍⚕️ ವೈದ್ಯರು' : '👨‍⚕️ Doctor';
        deptLabel = `<span class="font-semibold text-slate-200">${s.specialization || 'General Medicine'}</span> <span class="text-[11px] text-slate-400">(${s.qualification || 'MBBS'})</span>`;
        stationLabel = `<span class="text-sky-300 font-mono">${s.roomNumber || 'OPD Suite'}</span> • <span class="text-[11px] text-slate-400">${s.timings || 'Consultation Hours'}</span>`;
      } else if (s.role === 'nurse') {
        roleBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        roleLabel = isKn ? '👩‍⚕️ ಶುಶ್ರೂಷಕಿ' : '👩‍⚕️ Nurse';
        deptLabel = `<span class="font-semibold text-slate-200">${s.department || 'Inpatient Care'}</span> <span class="text-[11px] text-slate-400">(${s.qualification || 'B.Sc Nursing'})</span>`;
        stationLabel = `<span class="text-emerald-300">${s.assignedWard || 'Ward A'}</span> • <span class="text-[11px] text-slate-400">${s.shift || 'Shift'}</span>`;
      } else {
        roleBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        roleLabel = isKn ? '🤝 ಆರೈಕೆದಾರ' : '🤝 Caretaker';
        deptLabel = `<span class="font-semibold text-slate-200">${s.relationship || 'Family Caregiver'}</span>`;
        stationLabel = `<span class="text-purple-300">${s.assignedPatient || 'Assigned Inpatient'}</span>`;
      }

      return `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="p-3.5 font-mono text-xs text-amber-400 font-bold">
            ${s.id}
          </td>
          <td class="p-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold ${
                s.role === 'doctor' ? 'text-teal-300' : s.role === 'nurse' ? 'text-emerald-300' : 'text-purple-300'
              } shrink-0">
                ${this.getInitials(s.name)}
              </div>
              <div>
                <div class="font-bold text-white leading-tight flex items-center gap-1.5">
                  <span>${s.name}</span>
                  <span class="font-mono text-[10px] text-slate-400 font-normal">@${s.username || ''}</span>
                </div>
                <span class="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${roleBadgeClass} mt-0.5">${roleLabel}</span>
              </div>
            </div>
          </td>
          <td class="p-3.5">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs text-slate-200 font-semibold">${s.mobile}</span>
              <a href="tel:${s.mobile}" title="Call Staff Member" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </a>
            </div>
            <span class="text-[10px] text-slate-500 font-mono">OTP Verified • 1-Time Reg</span>
          </td>
          <td class="p-3.5 text-xs text-slate-300">
            ${deptLabel}
          </td>
          <td class="p-3.5 text-xs text-slate-300">
            ${stationLabel}
          </td>
          <td class="p-3.5">
            <span class="badge-status badge-confirmed text-[10px] py-0.5 px-2">Active</span>
          </td>
          <td class="p-3.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="window.SMARTCARE_APP.openEditStaffModal('${s.id}')" title="Edit Staff Member" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-900 text-sky-300 border border-slate-700 hover:border-sky-500/40 transition-all font-semibold text-[11px] flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                <span>Edit</span>
              </button>
              <button onclick="window.SMARTCARE_APP.handleDeleteStaff('${s.id}')" title="Delete Staff Member" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 border border-slate-700 hover:border-red-500/40 transition-all font-semibold text-[11px] flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  handleStaffSearch(query) {
    this.staffSearchQuery = query;
    this.renderStaffManagement();
  }

  handleStaffFilter(role) {
    this.staffRoleFilter = role;
    this.renderStaffManagement();
  }

  onStaffRoleChange(role) {
    const docFields = document.getElementById('staff-doctor-fields');
    const nurFields = document.getElementById('staff-nurse-fields');
    const carFields = document.getElementById('staff-caretaker-fields');

    if (docFields) docFields.classList.toggle('hidden', role !== 'doctor');
    if (nurFields) nurFields.classList.toggle('hidden', role !== 'nurse');
    if (carFields) carFields.classList.toggle('hidden', role !== 'caretaker');
  }

  /* ========================================================== */
  /* ADMIN HOSPITAL MANAGEMENT & GOOGLE MAPS PICKER             */
  /* ========================================================== */

  async initAdminHospitalMapPicker() {
    const container = document.getElementById('admin-hospital-map-picker');
    if (!container) return;

    if (!this.adminMapPicker && window.SMARTCARE_MAPS) {
      this.adminMapPicker = window.SMARTCARE_MAPS.initAdminMapPicker('admin-hospital-map-picker', {
        searchInputId: 'admin-hospital-address',
        latInputId: 'admin-hospital-lat',
        lngInputId: 'admin-hospital-lng',
        initialLat: 12.8988,
        initialLng: 77.5986,
        initialZoom: 14,
        onLocationChange: (lat, lng, address) => {
          const latInput = document.getElementById('admin-hospital-lat');
          const lngInput = document.getElementById('admin-hospital-lng');
          const addrInput = document.getElementById('admin-hospital-address');
          if (latInput) latInput.value = Number(lat).toFixed(6);
          if (lngInput) lngInput.value = Number(lng).toFixed(6);
          if (addrInput && address && !addrInput.value) addrInput.value = address;
        }
      });
    }
  }

  async renderAdminHospitals() {
    const hospitals = await window.SMARTCARE_DB.getHospitals();
    const countBadge = document.getElementById('admin-hospitals-count-badge');
    if (countBadge) countBadge.innerText = `${hospitals.length} Hospitals`;

    // Ensure map picker is initialized
    await this.initAdminHospitalMapPicker();

    const tbody = document.getElementById('admin-hospitals-table-body');
    if (!tbody) return;

    if (hospitals.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-slate-400 text-xs">
            No hospitals registered yet. Use the registration form above to add hospital centers with verified Google Maps coordinates.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = hospitals.map(h => {
      const gmapsLink = window.SMARTCARE_MAPS ? window.SMARTCARE_MAPS.getDirectionsUrl(h.latitude, h.longitude, h.name) : `https://www.google.com/maps/search/?api=1&query=${h.latitude},${h.longitude}`;
      return `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="p-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-sm font-bold shrink-0">
                🏥
              </div>
              <div>
                <span class="font-bold text-white text-xs">${h.name}</span>
                <span class="block text-[10px] text-slate-400 font-mono">${h.id}</span>
              </div>
            </div>
          </td>
          <td class="p-3.5 text-xs text-slate-300 max-w-xs">
            <p class="truncate" title="${h.address}">${h.address}</p>
          </td>
          <td class="p-3.5 text-xs">
            <a href="tel:${h.phone}" class="text-sky-400 font-mono font-semibold hover:underline block">${h.phone}</a>
            <a href="mailto:${h.email}" class="text-slate-400 text-[11px] hover:underline block truncate">${h.email}</a>
          </td>
          <td class="p-3.5 text-xs text-amber-300">
            ${h.workingHours || '24/7'}
          </td>
          <td class="p-3.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
            <div>Lat: <span class="text-sky-400 font-semibold">${Number(h.latitude).toFixed(4)}°</span></div>
            <div>Lng: <span class="text-teal-400 font-semibold">${Number(h.longitude).toFixed(4)}°</span></div>
          </td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" title="View on Google Maps" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
              <button onclick="window.SMARTCARE_APP.editHospital('${h.id}')" title="Edit Hospital" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-900 text-sky-300 border border-slate-700 font-semibold text-[11px] flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                <span>Edit</span>
              </button>
              <button onclick="window.SMARTCARE_APP.deleteHospital('${h.id}')" title="Delete Hospital" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 border border-slate-700 font-semibold text-[11px] flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async handleSaveHospital(event) {
    event.preventDefault();
    const id = document.getElementById('admin-hospital-id')?.value.trim();
    const name = document.getElementById('admin-hospital-name')?.value.trim();
    const address = document.getElementById('admin-hospital-address')?.value.trim();
    const phone = document.getElementById('admin-hospital-phone')?.value.trim();
    const email = document.getElementById('admin-hospital-email')?.value.trim();
    const workingHours = document.getElementById('admin-hospital-hours')?.value.trim();
    const latStr = document.getElementById('admin-hospital-lat')?.value.trim();
    const lngStr = document.getElementById('admin-hospital-lng')?.value.trim();

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      window.SMARTCARE_FCM.showToast('Location Required', 'Please select the hospital location on Google Maps.', 'warning');
      return;
    }

    try {
      const hospitalData = {
        name,
        address,
        phone,
        email,
        workingHours,
        latitude,
        longitude
      };
      if (id) hospitalData.id = id;

      const saved = await window.SMARTCARE_DB.saveHospital(hospitalData);
      window.SMARTCARE_FCM.showToast('Hospital Saved', `"${saved.name}" has been permanently registered in Firebase.`, 'success');

      this.resetHospitalForm();
      await this.renderAdminHospitals();
      await this.populateHospitalDropdowns();
      if (typeof this.renderPatientHospitalMap === 'function') {
        await this.renderPatientHospitalMap();
      }
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Registration Error', err.message || 'Failed to save hospital.', 'error');
    }
  }

  async editHospital(id) {
    const hosp = await window.SMARTCARE_DB.getHospitalById(id);
    if (!hosp) return;

    const idInput = document.getElementById('admin-hospital-id');
    const nameInput = document.getElementById('admin-hospital-name');
    const addrInput = document.getElementById('admin-hospital-address');
    const phoneInput = document.getElementById('admin-hospital-phone');
    const emailInput = document.getElementById('admin-hospital-email');
    const hoursInput = document.getElementById('admin-hospital-hours');
    const latInput = document.getElementById('admin-hospital-lat');
    const lngInput = document.getElementById('admin-hospital-lng');
    const submitBtn = document.getElementById('admin-hospital-submit-btn');

    if (idInput) idInput.value = hosp.id;
    if (nameInput) nameInput.value = hosp.name || '';
    if (addrInput) addrInput.value = hosp.address || '';
    if (phoneInput) phoneInput.value = hosp.phone || '';
    if (emailInput) emailInput.value = hosp.email || '';
    if (hoursInput) hoursInput.value = hosp.workingHours || '';
    if (latInput) latInput.value = Number(hosp.latitude).toFixed(6);
    if (lngInput) lngInput.value = Number(hosp.longitude).toFixed(6);

    if (submitBtn) {
      submitBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <span>Update Hospital Details</span>
      `;
    }

    if (this.adminMapPicker) {
      this.adminMapPicker.updateLocation(hosp.latitude, hosp.longitude, hosp.address);
    }

    const form = document.getElementById('admin-hospital-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async deleteHospital(id) {
    const hosp = await window.SMARTCARE_DB.getHospitalById(id);
    if (!hosp) return;

    if (!confirm(`Are you sure you want to delete "${hosp.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await window.SMARTCARE_DB.deleteHospital(id);
      window.SMARTCARE_FCM.showToast('Hospital Deleted', `"${hosp.name}" has been removed.`, 'info');
      await this.renderAdminHospitals();
      await this.populateHospitalDropdowns();
      if (typeof this.renderPatientHospitalMap === 'function') {
        await this.renderPatientHospitalMap();
      }
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Delete Failed', err.message || 'Cannot delete hospital.', 'error');
    }
  }

  resetHospitalForm() {
    const form = document.getElementById('admin-hospital-form');
    if (form) form.reset();
    const idInput = document.getElementById('admin-hospital-id');
    if (idInput) idInput.value = '';
    const submitBtn = document.getElementById('admin-hospital-submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <span>Save Hospital to Database</span>
      `;
    }
    const hoursInput = document.getElementById('admin-hospital-hours');
    if (hoursInput) hoursInput.value = '24/7 Emergency & Inpatient Services';
  }

  /* ========================================================== */
  /* POPULATE HOSPITAL DROPDOWNS ACROSS ALL STAFF FORMS         */
  /* ========================================================== */

  async populateHospitalDropdowns() {
    const hospitals = await window.SMARTCARE_DB.getHospitals();
    const selects = [
      document.getElementById('admin-doctor-hospital-select'),
      document.getElementById('admin-nurse-hospital-select'),
      document.getElementById('admin-caregiver-hospital-select')
    ];

    selects.forEach(select => {
      if (!select) return;
      const currentVal = select.value;
      if (hospitals.length === 0) {
        select.innerHTML = '<option value="">-- No Hospitals Registered Yet (Add in Hospitals Tab) --</option>';
      } else {
        select.innerHTML = '<option value="">-- Select Registered Hospital --</option>' +
          hospitals.map(h => `<option value="${h.id}" data-name="${h.name}">${h.name} (${h.address ? h.address.substring(0, 30) + '...' : ''})</option>`).join('');
        if (currentVal) select.value = currentVal;
      }
    });
  }

  /* ========================================================== */
  /* DOCTOR REGISTRATION & DIRECTORY (ADMIN ONLY)               */
  /* ========================================================== */

  async renderAdminDoctors() {
    const doctors = await window.SMARTCARE_DB.getStaff('doctor');
    const badge = document.getElementById('admin-doctors-count-badge');
    if (badge) badge.innerText = `${doctors.length} Doctors`;

    const tbody = document.getElementById('admin-doctors-table-body');
    if (!tbody) return;

    if (doctors.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center text-slate-400 text-xs">
            No doctors registered yet. Register doctors using the form above.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = doctors.map(doc => `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <td class="p-3.5 font-mono text-xs text-amber-400 font-bold">${doc.id}</td>
        <td class="p-3.5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center text-xs font-bold shrink-0">
              ${this.getInitials(doc.name)}
            </div>
            <div>
              <div class="font-bold text-white text-xs">${doc.name}</div>
              <div class="font-mono text-[10px] text-slate-400">@${doc.username || ''}</div>
            </div>
          </div>
        </td>
        <td class="p-3.5 font-mono text-xs text-slate-200">${doc.mobile}</td>
        <td class="p-3.5 text-xs text-slate-300">${doc.email || '--'}</td>
        <td class="p-3.5 text-xs">
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-950 text-teal-300 border border-teal-500/30">
            ${doc.specialization || 'General Medicine'}
          </span>
        </td>
        <td class="p-3.5 text-xs text-sky-300 font-medium">${doc.hospitalName || 'General Hospital'}</td>
        <td class="p-3.5 text-xs text-slate-300">
          <div class="font-mono text-sky-400">${doc.roomNumber || 'Room 101'}</div>
          <div class="text-[11px] text-slate-400">${doc.availableDays || 'Mon-Fri'} • ${doc.availableTime || '09:00 - 13:00'}</div>
        </td>
        <td class="p-3.5 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="window.SMARTCARE_APP.editDoctor('${doc.id}')" title="Edit Doctor" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-900 text-teal-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              <span>Edit</span>
            </button>
            <button onclick="window.SMARTCARE_APP.deleteDoctor('${doc.id}')" title="Delete Doctor" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 border border-slate-700 text-[11px] font-semibold flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async handleSaveDoctor(event) {
    event.preventDefault();
    const id = document.getElementById('admin-doctor-id')?.value.trim();
    const name = document.getElementById('admin-doctor-name')?.value.trim();
    const mobile = document.getElementById('admin-doctor-phone')?.value.trim();
    const email = document.getElementById('admin-doctor-email')?.value.trim();
    const specialization = document.getElementById('admin-doctor-spec')?.value.trim();
    const hospSelect = document.getElementById('admin-doctor-hospital-select');
    const hospitalId = hospSelect?.value;
    const hospitalName = hospSelect?.selectedOptions[0]?.getAttribute('data-name') || hospSelect?.selectedOptions[0]?.text || '';
    const roomNumber = document.getElementById('admin-doctor-room')?.value.trim();
    const availableDays = document.getElementById('admin-doctor-days')?.value.trim();
    const availableTime = document.getElementById('admin-doctor-time')?.value.trim();

    try {
      const docData = {
        name,
        mobile,
        email,
        role: 'doctor',
        specialization,
        hospitalId,
        hospitalName,
        roomNumber,
        availableDays,
        availableTime,
        timings: availableTime
      };
      if (id) docData.id = id;

      const saved = await window.SMARTCARE_DB.saveStaff(docData);
      window.SMARTCARE_FCM.showToast('Doctor Registered', `${saved.name} registered and synchronized permanently.`, 'success');
      this.resetDoctorForm();
      await this.renderAdminDoctors();
      await this.renderStaffManagement();
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Registration Error', err.message || 'Cannot register doctor.', 'error');
    }
  }

  async editDoctor(id) {
    const staff = await window.SMARTCARE_DB.getStaffById(id);
    if (!staff) return;

    const idInp = document.getElementById('admin-doctor-id');
    const nameInp = document.getElementById('admin-doctor-name');
    const phoneInp = document.getElementById('admin-doctor-phone');
    const emailInp = document.getElementById('admin-doctor-email');
    const specInp = document.getElementById('admin-doctor-spec');
    const hospSel = document.getElementById('admin-doctor-hospital-select');
    const roomInp = document.getElementById('admin-doctor-room');
    const daysInp = document.getElementById('admin-doctor-days');
    const timeInp = document.getElementById('admin-doctor-time');
    const btn = document.getElementById('admin-doctor-submit-btn');

    if (idInp) idInp.value = staff.id;
    if (nameInp) nameInp.value = staff.name || '';
    if (phoneInp) phoneInp.value = staff.mobile || '';
    if (emailInp) emailInp.value = staff.email || '';
    if (specInp) specInp.value = staff.specialization || '';
    if (hospSel && staff.hospitalId) hospSel.value = staff.hospitalId;
    if (roomInp) roomInp.value = staff.roomNumber || '';
    if (daysInp) daysInp.value = staff.availableDays || '';
    if (timeInp) timeInp.value = staff.availableTime || staff.timings || '';

    if (btn) btn.innerHTML = `<span>Update Doctor</span>`;
    const form = document.getElementById('admin-doctor-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async deleteDoctor(id) {
    const staff = await window.SMARTCARE_DB.getStaffById(id);
    if (!staff) return;
    if (!confirm(`Are you sure you want to delete ${staff.name}?`)) return;

    try {
      await window.SMARTCARE_DB.deleteStaff(id);
      window.SMARTCARE_FCM.showToast('Doctor Deleted', `${staff.name} removed.`, 'info');
      await this.renderAdminDoctors();
      await this.renderStaffManagement();
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Error', err.message || 'Cannot delete doctor.', 'error');
    }
  }

  resetDoctorForm() {
    const form = document.getElementById('admin-doctor-form');
    if (form) form.reset();
    const idInp = document.getElementById('admin-doctor-id');
    if (idInp) idInp.value = '';
    const btn = document.getElementById('admin-doctor-submit-btn');
    if (btn) {
      btn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        <span>Register Doctor</span>
      `;
    }
  }

  /* ========================================================== */
  /* NURSE REGISTRATION & DIRECTORY (ADMIN ONLY)                */
  /* ========================================================== */

  async renderAdminNurses() {
    const nurses = await window.SMARTCARE_DB.getStaff('nurse');
    const badge = document.getElementById('admin-nurses-count-badge');
    if (badge) badge.innerText = `${nurses.length} Nurses`;

    const tbody = document.getElementById('admin-nurses-table-body');
    if (!tbody) return;

    if (nurses.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center text-slate-400 text-xs">
            No nurses registered yet. Register nurses using the form above.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = nurses.map(nur => `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <td class="p-3.5 font-mono text-xs text-amber-400 font-bold">${nur.id}</td>
        <td class="p-3.5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-bold shrink-0">
              ${this.getInitials(nur.name)}
            </div>
            <div>
              <div class="font-bold text-white text-xs">${nur.name}</div>
              <div class="font-mono text-[10px] text-slate-400">@${nur.username || ''}</div>
            </div>
          </div>
        </td>
        <td class="p-3.5 font-mono text-xs text-slate-200">${nur.mobile}</td>
        <td class="p-3.5 text-xs text-slate-300">${nur.email || '--'}</td>
        <td class="p-3.5 text-xs text-sky-300 font-medium">${nur.hospitalName || 'General Hospital'}</td>
        <td class="p-3.5 text-xs">
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
            ${nur.department || 'Inpatient Care'}
          </span>
        </td>
        <td class="p-3.5 text-xs text-slate-300 font-mono">${nur.dutyTiming || nur.shift || 'Shift'}</td>
        <td class="p-3.5 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="window.SMARTCARE_APP.editNurse('${nur.id}')" title="Edit Nurse" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900 text-emerald-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              <span>Edit</span>
            </button>
            <button onclick="window.SMARTCARE_APP.deleteNurse('${nur.id}')" title="Delete Nurse" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 border border-slate-700 text-[11px] font-semibold flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async handleSaveNurse(event) {
    event.preventDefault();
    const id = document.getElementById('admin-nurse-id')?.value.trim();
    const name = document.getElementById('admin-nurse-name')?.value.trim();
    const mobile = document.getElementById('admin-nurse-phone')?.value.trim();
    const email = document.getElementById('admin-nurse-email')?.value.trim();
    const hospSelect = document.getElementById('admin-nurse-hospital-select');
    const hospitalId = hospSelect?.value;
    const hospitalName = hospSelect?.selectedOptions[0]?.getAttribute('data-name') || hospSelect?.selectedOptions[0]?.text || '';
    const department = document.getElementById('admin-nurse-dept')?.value.trim();
    const dutyTiming = document.getElementById('admin-nurse-shift')?.value.trim();

    try {
      const nurseData = {
        name,
        mobile,
        email,
        role: 'nurse',
        hospitalId,
        hospitalName,
        department,
        dutyTiming,
        shift: dutyTiming
      };
      if (id) nurseData.id = id;

      const saved = await window.SMARTCARE_DB.saveStaff(nurseData);
      window.SMARTCARE_FCM.showToast('Nurse Registered', `${saved.name} registered and synchronized permanently.`, 'success');
      this.resetNurseForm();
      await this.renderAdminNurses();
      await this.renderStaffManagement();
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Registration Error', err.message || 'Cannot register nurse.', 'error');
    }
  }

  async editNurse(id) {
    const staff = await window.SMARTCARE_DB.getStaffById(id);
    if (!staff) return;

    const idInp = document.getElementById('admin-nurse-id');
    const nameInp = document.getElementById('admin-nurse-name');
    const phoneInp = document.getElementById('admin-nurse-phone');
    const emailInp = document.getElementById('admin-nurse-email');
    const hospSel = document.getElementById('admin-nurse-hospital-select');
    const deptInp = document.getElementById('admin-nurse-dept');
    const shiftInp = document.getElementById('admin-nurse-shift');
    const btn = document.getElementById('admin-nurse-submit-btn');

    if (idInp) idInp.value = staff.id;
    if (nameInp) nameInp.value = staff.name || '';
    if (phoneInp) phoneInp.value = staff.mobile || '';
    if (emailInp) emailInp.value = staff.email || '';
    if (hospSel && staff.hospitalId) hospSel.value = staff.hospitalId;
    if (deptInp) deptInp.value = staff.department || '';
    if (shiftInp) shiftInp.value = staff.dutyTiming || staff.shift || '';

    if (btn) btn.innerHTML = `<span>Update Nurse</span>`;
    const form = document.getElementById('admin-nurse-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async deleteNurse(id) {
    const staff = await window.SMARTCARE_DB.getStaffById(id);
    if (!staff) return;
    if (!confirm(`Are you sure you want to delete ${staff.name}?`)) return;

    try {
      await window.SMARTCARE_DB.deleteStaff(id);
      window.SMARTCARE_FCM.showToast('Nurse Deleted', `${staff.name} removed.`, 'info');
      await this.renderAdminNurses();
      await this.renderStaffManagement();
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Error', err.message || 'Cannot delete nurse.', 'error');
    }
  }

  resetNurseForm() {
    const form = document.getElementById('admin-nurse-form');
    if (form) form.reset();
    const idInp = document.getElementById('admin-nurse-id');
    if (idInp) idInp.value = '';
    const btn = document.getElementById('admin-nurse-submit-btn');
    if (btn) {
      btn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        <span>Register Nurse</span>
      `;
    }
  }

  /* ========================================================== */
  /* CAREGIVER REGISTRATION & DIRECTORY (ADMIN ONLY)            */
  /* ========================================================== */

  async renderAdminCaregivers() {
    const caregivers = await window.SMARTCARE_DB.getStaff('caregiver');
    const badge = document.getElementById('admin-caregivers-count-badge');
    if (badge) badge.innerText = `${caregivers.length} Caregivers`;

    const tbody = document.getElementById('admin-caregivers-table-body');
    if (!tbody) return;

    if (caregivers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center text-slate-400 text-xs">
            No caregivers registered yet. Register caregivers using the form above.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = caregivers.map(cg => `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <td class="p-3.5 font-mono text-xs text-amber-400 font-bold">${cg.id}</td>
        <td class="p-3.5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs font-bold shrink-0">
              ${this.getInitials(cg.name)}
            </div>
            <div>
              <div class="font-bold text-white text-xs">${cg.name}</div>
              <div class="font-mono text-[10px] text-slate-400">@${cg.username || ''}</div>
            </div>
          </div>
        </td>
        <td class="p-3.5 font-mono text-xs text-slate-200">${cg.mobile}</td>
        <td class="p-3.5 text-xs text-slate-300">${cg.email || '--'}</td>
        <td class="p-3.5 text-xs text-sky-300 font-medium">${cg.hospitalName || 'General Hospital'}</td>
        <td class="p-3.5 text-xs text-amber-300 font-medium">${cg.availableTiming || '24/7'}</td>
        <td class="p-3.5 text-xs text-slate-300 max-w-xs truncate" title="${cg.servicesProvided || ''}">
          ${cg.servicesProvided || 'Elderly Care, Inpatient Support'}
        </td>
        <td class="p-3.5 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="window.SMARTCARE_APP.editCaregiver('${cg.id}')" title="Edit Caregiver" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-900 text-purple-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              <span>Edit</span>
            </button>
            <button onclick="window.SMARTCARE_APP.deleteCaregiver('${cg.id}')" title="Delete Caregiver" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 border border-slate-700 text-[11px] font-semibold flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async handleSaveCaregiver(event) {
    event.preventDefault();
    const id = document.getElementById('admin-caregiver-id')?.value.trim();
    const name = document.getElementById('admin-caregiver-name')?.value.trim();
    const mobile = document.getElementById('admin-caregiver-phone')?.value.trim();
    const email = document.getElementById('admin-caregiver-email')?.value.trim();
    const hospSelect = document.getElementById('admin-caregiver-hospital-select');
    const hospitalId = hospSelect?.value;
    const hospitalName = hospSelect?.selectedOptions[0]?.getAttribute('data-name') || hospSelect?.selectedOptions[0]?.text || '';
    const availableTiming = document.getElementById('admin-caregiver-timing')?.value.trim();
    const servicesProvided = document.getElementById('admin-caregiver-services')?.value.trim();

    try {
      const cgData = {
        name,
        mobile,
        email,
        role: 'caregiver',
        hospitalId,
        hospitalName,
        availableTiming,
        servicesProvided,
        shift: availableTiming
      };
      if (id) cgData.id = id;

      const saved = await window.SMARTCARE_DB.saveStaff(cgData);
      window.SMARTCARE_FCM.showToast('Caregiver Registered', `${saved.name} registered and synchronized permanently.`, 'success');
      this.resetCaregiverForm();
      await this.renderAdminCaregivers();
      await this.renderStaffManagement();
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Registration Error', err.message || 'Cannot register caregiver.', 'error');
    }
  }

  async editCaregiver(id) {
    const staff = await window.SMARTCARE_DB.getStaffById(id);
    if (!staff) return;

    const idInp = document.getElementById('admin-caregiver-id');
    const nameInp = document.getElementById('admin-caregiver-name');
    const phoneInp = document.getElementById('admin-caregiver-phone');
    const emailInp = document.getElementById('admin-caregiver-email');
    const hospSel = document.getElementById('admin-caregiver-hospital-select');
    const timeInp = document.getElementById('admin-caregiver-timing');
    const servInp = document.getElementById('admin-caregiver-services');
    const btn = document.getElementById('admin-caregiver-submit-btn');

    if (idInp) idInp.value = staff.id;
    if (nameInp) nameInp.value = staff.name || '';
    if (phoneInp) phoneInp.value = staff.mobile || '';
    if (emailInp) emailInp.value = staff.email || '';
    if (hospSel && staff.hospitalId) hospSel.value = staff.hospitalId;
    if (timeInp) timeInp.value = staff.availableTiming || staff.shift || '';
    if (servInp) servInp.value = staff.servicesProvided || '';

    if (btn) btn.innerHTML = `<span>Update Caregiver</span>`;
    const form = document.getElementById('admin-caregiver-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async deleteCaregiver(id) {
    const staff = await window.SMARTCARE_DB.getStaffById(id);
    if (!staff) return;
    if (!confirm(`Are you sure you want to delete ${staff.name}?`)) return;

    try {
      await window.SMARTCARE_DB.deleteStaff(id);
      window.SMARTCARE_FCM.showToast('Caregiver Deleted', `${staff.name} removed.`, 'info');
      await this.renderAdminCaregivers();
      await this.renderStaffManagement();
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Error', err.message || 'Cannot delete caregiver.', 'error');
    }
  }

  resetCaregiverForm() {
    const form = document.getElementById('admin-caregiver-form');
    if (form) form.reset();
    const idInp = document.getElementById('admin-caregiver-id');
    if (idInp) idInp.value = '';
    const btn = document.getElementById('admin-caregiver-submit-btn');
    if (btn) {
      btn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        <span>Register Caregiver</span>
      `;
    }
  }

  /* ========================================================== */
  /* ADMIN SETUP, LOGIN & AUTHENTICATION GUARD                  */
  /* ========================================================== */

  async handleAdminButtonClick() {
    const isConfigured = await window.SMARTCARE_AUTH.isCustomAdminConfigured();
    if (!isConfigured) {
      this.openAdminSetupModal();
      return;
    }

    if (window.SMARTCARE_AUTH.isAdminAuthorized()) {
      this.switchPersona('admin');
    } else {
      this.openAdminLoginModal();
    }
  }

  async openAdminSetupModal() {
    const isConfigured = await window.SMARTCARE_AUTH.isCustomAdminConfigured();
    if (isConfigured) {
      window.SMARTCARE_FCM?.showToast(
        'Admin Already Registered',
        'Hospital Administrator account is already registered. Please sign in with your password.',
        'info'
      );
      this.openAdminLoginModal();
      return;
    }
    this.closeAdminLoginModal();
    this.closeAuthModal();
    const modal = document.getElementById('admin-setup-modal');
    if (modal) modal.classList.remove('hidden');
    const err = document.getElementById('setup-admin-error');
    if (err) err.classList.add('hidden');
    const nameInput = document.getElementById('setup-admin-name');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 100);
    }
  }

  closeAdminSetupModal() {
    const modal = document.getElementById('admin-setup-modal');
    if (modal) modal.classList.add('hidden');
  }

  async handleAdminInitialSetup(event) {
    event.preventDefault();
    const name = document.getElementById('setup-admin-name')?.value.trim();
    const username = document.getElementById('setup-admin-username')?.value.trim();
    const email = document.getElementById('setup-admin-email')?.value.trim();
    const password = document.getElementById('setup-admin-password')?.value;
    const confirmPassword = document.getElementById('setup-admin-confirm-password')?.value;
    const errBox = document.getElementById('setup-admin-error');
    const submitBtn = document.getElementById('setup-admin-submit-btn');

    if (errBox) errBox.classList.add('hidden');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await window.SMARTCARE_AUTH.setupInitialAdmin({
        name,
        username,
        email,
        password,
        confirmPassword
      });

      if (res.success) {
        this.closeAdminSetupModal();
        window.SMARTCARE_FCM.showToast(
          'Administrator Setup Locked',
          `Welcome, ${res.user.name}. Your custom admin credentials are saved permanently.`,
          'success'
        );
        this.switchPersona('admin');
      } else {
        throw new Error(res.error || 'Failed to initialize administrator account.');
      }
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Setup error. Please verify your details.';
        errBox.classList.remove('hidden');
      } else {
        alert(err.message);
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async openAdminLoginModal() {
    // If not configured, redirect to setup wizard
    const isConfigured = await window.SMARTCARE_AUTH.isCustomAdminConfigured();
    if (!isConfigured) {
      this.openAdminSetupModal();
      return;
    }

    const setupShortcut = document.getElementById('admin-login-setup-shortcut');
    if (setupShortcut) {
      setupShortcut.style.display = 'none';
    }

    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('hidden');
    const err = document.getElementById('admin-login-error');
    if (err) err.classList.add('hidden');
    const pwdInput = document.getElementById('admin-login-password');
    if (pwdInput) {
      pwdInput.value = '';
      setTimeout(() => pwdInput.focus(), 100);
    }
  }

  closeAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.add('hidden');
  }

  async handleAdminLogin(event) {
    event.preventDefault();
    const id = document.getElementById('admin-login-identifier')?.value.trim();
    const pwd = document.getElementById('admin-login-password')?.value;
    const btn = document.getElementById('admin-login-submit-btn');

    if (btn) btn.disabled = true;

    try {
      const res = await window.SMARTCARE_AUTH.loginAdmin(id, pwd);
      if (res.success) {
        this.closeAdminLoginModal();
        window.SMARTCARE_FCM.showToast('Admin Authorized', `Welcome, ${res.user.name}.`, 'success');
        this.switchPersona('admin');
      } else {
        const err = document.getElementById('admin-login-error');
        const errText = document.getElementById('admin-login-error-text');
        if (err) err.classList.remove('hidden');
        if (errText) errText.innerText = res.error || 'Invalid administrator credentials.';

        if (res.notConfigured) {
          setTimeout(() => {
            this.openAdminSetupModal();
          }, 1500);
        }
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async handleLogout() {
    await window.SMARTCARE_AUTH.logout();
    window.SMARTCARE_FCM?.showToast('Signed Out', 'You have been securely signed out.', 'info');
    this.handleUserChange(null);
  }

  /* ========================================================== */
  /* ADMIN REGISTERED PATIENTS DIRECTORY & PRIVACY CONTROLS      */
  /* ========================================================== */

  async renderAdminPatients(searchQuery = '') {
    const tableBody = document.getElementById('admin-patients-table-body');
    const countBadge = document.getElementById('admin-patients-count');
    const kpiPatients = document.getElementById('kpi-patients');

    if (!tableBody) return;

    try {
      const patients = await window.SMARTCARE_DB.getPatients(searchQuery);

      if (countBadge) countBadge.innerText = `${patients.length} Patients`;
      if (kpiPatients) kpiPatients.innerText = `${patients.length} Patients`;

      if (patients.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
              No registered patients found ${searchQuery ? `matching "${searchQuery}"` : 'in the hospital database'}.
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = patients.map(p => `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="py-3 px-3">
            <div class="font-bold text-white text-xs">${p.name || 'Unnamed Patient'}</div>
            <div class="text-[10px] font-mono text-sky-400">@${p.username || p.id}</div>
          </td>
          <td class="py-3 px-3">
            <div class="font-mono text-xs text-emerald-300 flex items-center gap-1">
              <span>✓</span> ${p.phone || '—'}
            </div>
            <span class="text-[9px] text-slate-400">SMS OTP Verified</span>
          </td>
          <td class="py-3 px-3">
            <div class="text-xs text-slate-200">${p.age || '—'} Yrs • ${p.gender || '—'}</div>
            <span class="text-[10px] font-bold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/30">${p.bloodGroup || '—'}</span>
          </td>
          <td class="py-3 px-3">
            <div class="text-xs font-semibold text-slate-300">${p.ward || 'General Ward'}</div>
            <div class="text-[11px] text-slate-400 font-mono">${p.roomNumber || 'Room —'}, ${p.bedNumber || 'Bed —'}</div>
          </td>
          <td class="py-3 px-3">
            <div class="text-xs text-amber-300 font-medium">${p.primaryDoctorName || 'To be assigned'}</div>
          </td>
          <td class="py-3 px-3">
            <div class="text-xs text-slate-300 max-w-[180px] truncate" title="${p.diagnosis || ''}">${p.diagnosis || 'General Observation'}</div>
          </td>
          <td class="py-3 px-3 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button type="button" onclick="window.SMARTCARE_APP.openEditPatientModal('${p.id}')" class="p-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900 text-sky-400 border border-sky-500/30 text-[11px] font-semibold" title="Edit Patient Details">
                ✏️ Edit
              </button>
              <button type="button" onclick="window.SMARTCARE_APP.handleDeletePatient('${p.id}')" class="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-500/30 text-[11px] font-semibold" title="Delete Patient Record">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('[renderAdminPatients Error]', error);
      tableBody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-red-400 text-xs">Error loading patients: ${error.message}</td></tr>`;
    }
  }

  handleSearchPatients(query) {
    this.renderAdminPatients(query);
  }

  async openEditPatientModal(patientId) {
    const isAuthorized = window.SMARTCARE_AUTH?.isAdminAuthorized();
    if (!isAuthorized) {
      window.SMARTCARE_FCM.showToast('Access Denied', 'Only Hospital Administrator can edit patient records.', 'error');
      return;
    }

    const patient = await window.SMARTCARE_DB.getUserById(patientId);
    if (!patient) {
      window.SMARTCARE_FCM.showToast('Not Found', 'Patient record not found.', 'error');
      return;
    }

    const modal = document.getElementById('admin-patient-modal');
    if (!modal) return;

    document.getElementById('edit-pat-id').value = patient.id;
    document.getElementById('edit-pat-name').value = patient.name || '';
    document.getElementById('edit-pat-username').value = patient.username || '';
    document.getElementById('edit-pat-phone').value = patient.phone || '';
    document.getElementById('edit-pat-diagnosis').value = patient.diagnosis || '';
    document.getElementById('edit-pat-ward').value = patient.ward || '';
    document.getElementById('edit-pat-room').value = patient.roomNumber || '';
    document.getElementById('edit-pat-bed').value = patient.bedNumber || '';

    // Populate Doctor dropdown
    const docSelect = document.getElementById('edit-pat-doctor');
    if (docSelect) {
      const doctors = await window.SMARTCARE_DB.getDoctors();
      docSelect.innerHTML = `
        <option value="">-- Select Attending Senior Doctor --</option>
        ${doctors.map(d => `<option value="${d.name}" ${d.name === patient.primaryDoctorName ? 'selected' : ''}>${d.name} (${d.specialization || 'Consultant'})</option>`).join('')}
      `;
    }

    const errBox = document.getElementById('edit-pat-error');
    if (errBox) errBox.classList.add('hidden');

    modal.classList.remove('hidden');
  }

  closeEditPatientModal() {
    const modal = document.getElementById('admin-patient-modal');
    if (modal) modal.classList.add('hidden');
  }

  async handleSavePatientEdits(event) {
    event.preventDefault();
    const patientId = document.getElementById('edit-pat-id')?.value;
    const phone = document.getElementById('edit-pat-phone')?.value.trim();
    const diagnosis = document.getElementById('edit-pat-diagnosis')?.value.trim();
    const ward = document.getElementById('edit-pat-ward')?.value.trim();
    const roomNumber = document.getElementById('edit-pat-room')?.value.trim();
    const bedNumber = document.getElementById('edit-pat-bed')?.value.trim();
    const primaryDoctorName = document.getElementById('edit-pat-doctor')?.value;
    const errBox = document.getElementById('edit-pat-error');

    if (!patientId) return;

    try {
      await window.SMARTCARE_DB.updatePatient(patientId, {
        phone,
        diagnosis,
        ward,
        roomNumber,
        bedNumber,
        primaryDoctorName
      });

      window.SMARTCARE_FCM.showToast('Patient Updated', 'Patient records saved successfully.', 'success');
      this.closeEditPatientModal();
      await this.renderAdminPatients();
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Error updating patient.';
        errBox.classList.remove('hidden');
      } else {
        alert(err.message);
      }
    }
  }

  async handleDeletePatient(patientId) {
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn';
    const confirmMsg = isKn
      ? 'ಈ ರೋಗಿಯ ವಿವರಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?'
      : 'Are you sure you want to permanently delete this patient record from SMARTCARE?';

    if (confirm(confirmMsg)) {
      try {
        await window.SMARTCARE_DB.deletePatient(patientId);
        window.SMARTCARE_FCM.showToast('Patient Deleted', 'Patient record removed from database.', 'info');
        await this.renderAdminPatients();
      } catch (err) {
        window.SMARTCARE_FCM.showToast('Delete Error', err.message, 'error');
      }
    }
  }

  /* ========================================================== */
  /* DATABASE BACKUP & FACTORY RESET HANDLERS                   */
  /* ========================================================== */

  async handleResetAdminData() {
    if (!confirm('Are you sure you want to reset all Administrator credentials and configuration? This will clear the current Admin account and allow fresh initial Admin setup.')) {
      return;
    }
    const res = window.SMARTCARE_AUTH?.resetAdminData() || window.SMARTCARE_DB?.resetAdminData();
    if (res?.success) {
      window.SMARTCARE_FCM?.showToast('Admin Data Reset', 'Administrator credentials and session have been cleared.', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  async handleBackupDatabase() {
    try {
      const backup = await window.SMARTCARE_DB.backupDatabase();
      window.SMARTCARE_FCM.showToast('Backup Generated', `Database snapshot saved: ${backup.filename}`, 'success');
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Backup Error', err.message || 'Cannot generate backup.', 'error');
    }
  }

  openResetDatabaseModal() {
    const modal = document.getElementById('admin-reset-modal');
    if (modal) modal.classList.remove('hidden');
    const input = document.getElementById('admin-reset-confirm-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
    const err = document.getElementById('admin-reset-error');
    if (err) err.classList.add('hidden');
  }

  closeResetDatabaseModal() {
    const modal = document.getElementById('admin-reset-modal');
    if (modal) modal.classList.add('hidden');
  }

  async handleConfirmResetDatabase() {
    const input = document.getElementById('admin-reset-confirm-input')?.value.trim();
    const err = document.getElementById('admin-reset-error');

    if (input !== 'DELETE_ALL_DATA') {
      if (err) err.classList.remove('hidden');
      return;
    }

    try {
      const res = await window.SMARTCARE_DB.resetAllData('DELETE_ALL_DATA');
      if (res.success) {
        this.closeResetDatabaseModal();
        window.SMARTCARE_FCM.showToast('Database Wiped Clean', 'All demo and test data deleted. System reset to clean state.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      window.SMARTCARE_FCM.showToast('Reset Failed', err.message || 'Could not reset database.', 'error');
    }
  }

  openAddStaffModal(defaultRole = 'doctor') {
    // Strict Admin Authorization Check
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      window.SMARTCARE_FCM.showToast('Access Denied', 'Only Hospital Administrator can add staff records.', 'error');
      return;
    }

    const modal = document.getElementById('staff-modal');
    if (!modal) return;

    // Reset Form Fields
    document.getElementById('staff-form-id').value = '';
    const uInp = document.getElementById('staff-form-username');
    if (uInp) uInp.value = '';
    document.getElementById('staff-form-name').value = '';
    document.getElementById('staff-form-mobile').value = '';
    document.getElementById('staff-form-qual').value = '';
    document.getElementById('staff-form-exp').value = '5';
    document.getElementById('staff-form-spec').value = '';
    document.getElementById('staff-form-room').value = '';
    document.getElementById('staff-form-timings').value = '09:00 AM - 01:00 PM, 04:00 PM - 07:00 PM';
    document.getElementById('staff-form-dept').value = '';
    document.getElementById('staff-form-ward').value = '';
    document.getElementById('staff-form-rel').value = '';
    document.getElementById('staff-form-patient').value = '';
    const puInp = document.getElementById('staff-form-patient-username');
    if (puInp) puInp.value = '';

    const roleSelect = document.getElementById('staff-form-role');
    if (roleSelect) {
      roleSelect.value = defaultRole;
      this.onStaffRoleChange(defaultRole);
    }

    const errBox = document.getElementById('staff-form-error');
    if (errBox) errBox.classList.add('hidden');

    const title = document.getElementById('staff-modal-title');
    if (title) title.innerText = window.SMARTCARE_I18N?.t('staff_modal_add_title') || 'Register New Staff Member';

    modal.classList.remove('hidden');
  }

  async openEditStaffModal(staffId) {
    // Strict Admin Authorization Check
    const currentUser = window.SMARTCARE_AUTH?.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      window.SMARTCARE_FCM.showToast('Access Denied', 'Only Hospital Administrator can edit staff records.', 'error');
      return;
    }

    const staff = await window.SMARTCARE_DB.getStaffById(staffId);
    if (!staff) {
      window.SMARTCARE_FCM.showToast('Not Found', 'Staff record not found.', 'error');
      return;
    }

    const modal = document.getElementById('staff-modal');
    if (!modal) return;

    document.getElementById('staff-form-id').value = staff.id;
    const uInpEdit = document.getElementById('staff-form-username');
    if (uInpEdit) uInpEdit.value = staff.username || '';
    document.getElementById('staff-form-role').value = staff.role;
    document.getElementById('staff-form-name').value = staff.name || '';
    document.getElementById('staff-form-mobile').value = staff.mobile || '';
    document.getElementById('staff-form-qual').value = staff.qualification || '';
    document.getElementById('staff-form-exp').value = staff.experience || 5;

    // Doctor fields
    document.getElementById('staff-form-spec').value = staff.specialization || '';
    document.getElementById('staff-form-room').value = staff.roomNumber || '';
    document.getElementById('staff-form-timings').value = staff.timings || '09:00 AM - 01:00 PM';

    // Nurse fields
    document.getElementById('staff-form-dept').value = staff.department || '';
    document.getElementById('staff-form-shift').value = staff.shift || 'Day Shift (07:00 AM - 03:00 PM)';
    document.getElementById('staff-form-ward').value = staff.assignedWard || '';

    // Caretaker fields
    document.getElementById('staff-form-rel').value = staff.relationship || '';
    document.getElementById('staff-form-patient').value = staff.assignedPatient || '';
    const puInpEdit = document.getElementById('staff-form-patient-username');
    if (puInpEdit) puInpEdit.value = staff.linkedPatientUsername || '';

    this.onStaffRoleChange(staff.role);

    const errBox = document.getElementById('staff-form-error');
    if (errBox) errBox.classList.add('hidden');

    const title = document.getElementById('staff-modal-title');
    if (title) title.innerText = window.SMARTCARE_I18N?.t('staff_modal_edit_title') || 'Edit Staff Member Details';

    modal.classList.remove('hidden');
  }

  closeStaffModal() {
    const modal = document.getElementById('staff-modal');
    if (modal) modal.classList.add('hidden');
    const errBox = document.getElementById('staff-form-error');
    if (errBox) errBox.classList.add('hidden');
  }

  async handleSaveStaff(event) {
    event.preventDefault();
    const errBox = document.getElementById('staff-form-error');
    const errText = document.getElementById('staff-form-error-text');

    try {
      const staffId = document.getElementById('staff-form-id').value.trim();
      const username = document.getElementById('staff-form-username')?.value.trim() || '';
      const role = document.getElementById('staff-form-role').value;
      const name = document.getElementById('staff-form-name').value.trim();
      const mobile = document.getElementById('staff-form-mobile').value.trim();
      const qualification = document.getElementById('staff-form-qual').value.trim();
      const experience = parseInt(document.getElementById('staff-form-exp').value) || 0;

      const staffData = {
        role,
        name,
        mobile,
        qualification,
        experience,
        hospitalName: "Apollo Metro Super Specialty Hospital"
      };

      if (username) {
        staffData.username = username;
      }

      if (staffId) {
        staffData.id = staffId;
      }

      if (role === 'doctor') {
        staffData.specialization = document.getElementById('staff-form-spec').value.trim() || 'General Medicine';
        staffData.roomNumber = document.getElementById('staff-form-room').value.trim() || 'OPD Suite 101';
        staffData.timings = document.getElementById('staff-form-timings').value.trim() || '09:00 AM - 01:00 PM';
        staffData.department = staffData.specialization;
      } else if (role === 'nurse') {
        staffData.department = document.getElementById('staff-form-dept').value.trim() || 'Inpatient Nursing Care';
        staffData.shift = document.getElementById('staff-form-shift').value;
        staffData.assignedWard = document.getElementById('staff-form-ward').value.trim() || 'Cardiology Ward A';
      } else if (role === 'caretaker') {
        staffData.relationship = document.getElementById('staff-form-rel').value.trim() || 'Primary Caregiver';
        staffData.assignedPatient = document.getElementById('staff-form-patient').value.trim() || 'Admitted Inpatient';
        staffData.linkedPatientUsername = document.getElementById('staff-form-patient-username')?.value.trim() || '';
      }

      // Save to central database with duplicate phone checking & admin verification
      const savedStaff = await window.SMARTCARE_DB.saveStaff(staffData);

      // Close modal & show toast
      this.closeStaffModal();
      window.SMARTCARE_FCM.showToast(
        'Staff Saved Successfully',
        `${savedStaff.name} (${savedStaff.role.toUpperCase()}) saved with ID ${savedStaff.id}. Synchronized hospital-wide.`,
        'success'
      );

      // Refresh admin dashboard & doctor lists throughout the website
      const user = window.SMARTCARE_AUTH.getCurrentUser();
      await this.renderAdminDashboard(user);
      await this.renderAppointmentDoctorCards();

    } catch (error) {
      console.error('[SaveStaff Error]', error);
      if (errBox && errText) {
        errText.innerText = error.message || 'Error saving staff information.';
        errBox.classList.remove('hidden');
      } else {
        alert(error.message);
      }
    }
  }

  async handleDeleteStaff(staffId) {
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn';
    const confirmMsg = isKn 
      ? 'ಈ ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಈ ಕ್ರಿಯೆಯಿಂದ ವೈದ್ಯರು/ನರ್ಸ್ ವಿವರಗಳು ಆಸ್ಪತ್ರೆಯ ಎಲ್ಲಾ ವಿಭಾಗಗಳಿಂದ ತೆಗೆದುಹಾಕಲ್ಪಡುತ್ತವೆ.'
      : 'Are you sure you want to delete this staff record? This will permanently remove their profile across all hospital appointment and duty modules.';

    if (confirm(confirmMsg)) {
      try {
        await window.SMARTCARE_DB.deleteStaff(staffId);
        window.SMARTCARE_FCM.showToast('Staff Deleted', 'Staff member removed from hospital registry.', 'info');
        const user = window.SMARTCARE_AUTH.getCurrentUser();
        await this.renderAdminDashboard(user);
        await this.renderAppointmentDoctorCards();
      } catch (error) {
        window.SMARTCARE_FCM.showToast('Delete Error', error.message, 'error');
      }
    }
  }

  // Backward compatibility alias methods
  openAddDoctorModal() {
    this.openAddStaffModal('doctor');
  }

  async handleSaveDoctor(event) {
    await this.handleSaveStaff(event);
  }

  async deleteDoctor(docId) {
    await this.handleDeleteStaff(docId);
  }

  async allocateBedModal(bedId) {
    const patientName = prompt('Enter Patient Name to allocate bed:');
    if (patientName) {
      await window.SMARTCARE_DB.allocateBed(bedId, 'usr_pat_' + Date.now(), patientName);
      window.SMARTCARE_FCM.showToast('Bed Allocated', `Bed allocated to ${patientName}.`, 'success');
      const user = window.SMARTCARE_AUTH.getCurrentUser();
      this.renderAdminDashboard(user);
    }
  }

  async vacateBed(bedId) {
    if (confirm('Discharge patient and vacate this bed?')) {
      await window.SMARTCARE_DB.vacateBed(bedId);
      window.SMARTCARE_FCM.showToast('Bed Vacated', 'Bed is now clean and available.', 'info');
      const user = window.SMARTCARE_AUTH.getCurrentUser();
      this.renderAdminDashboard(user);
    }
  }

  /* ========================================================== */
  /* GENERAL UI & MODAL HANDLERS                                */
  /* ========================================================== */

  switchPersona(role) {
    window.SMARTCARE_AUTH.switchRole(role);
    window.SMARTCARE_FCM.showToast('Persona Switched', `Logged in as ${role.toUpperCase()}.`, 'info');
  }

  switchSubTab(role, tabKey, buttonEl) {
    this.currentSubTabs[role] = tabKey;

    // Toggle active styles on buttons
    const parent = buttonEl.parentElement;
    parent.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active', 'text-white');
      btn.classList.add('text-slate-400');
    });
    buttonEl.classList.add('active', 'text-white');
    buttonEl.classList.remove('text-slate-400');

    // Toggle content visibility
    const roleView = document.getElementById(`view-${role}`);
    if (roleView) {
      roleView.querySelectorAll('.subtab-content').forEach(sub => {
        sub.classList.add('hidden');
      });
      const targetSub = document.getElementById(`subtab-${role}-${tabKey}`);
      if (targetSub) {
        targetSub.classList.remove('hidden');
      }

      if (role === 'admin' && tabKey === 'patients') {
        this.renderAdminPatients();
      }
    }
  }

  async openAuthModal() {
    const isConfigured = await window.SMARTCARE_AUTH?.isCustomAdminConfigured();
    const portalBtn = document.getElementById('auth-admin-portal-btn');
    const portalText = document.getElementById('auth-admin-portal-text');
    if (portalBtn && portalText) {
      if (!isConfigured) {
        portalText.innerText = "New Administrator Setup Required:";
        portalBtn.innerText = "Register Admin Account →";
      } else {
        portalText.innerText = "Hospital Administrator?";
        portalBtn.innerText = "Admin Sign In →";
      }
    }
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
    this.resetAuthModal();
  }

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  resetAuthModal() {
    this.switchAuthTab('signin');
    this.switchLoginMode('phone');

    const uInp = document.getElementById('auth-username-input');
    if (uInp) uInp.value = '';
    const phoneInp = document.getElementById('auth-phone-input');
    if (phoneInp) phoneInp.value = '';
    const otpInp = document.getElementById('auth-otp-input');
    if (otpInp) otpInp.value = '';
    const stepPhone = document.getElementById('auth-step-phone');
    if (stepPhone) stepPhone.classList.remove('hidden');
    const stepOtp = document.getElementById('auth-step-otp');
    if (stepOtp) stepOtp.classList.add('hidden');
    const uErr = document.getElementById('auth-user-error');
    if (uErr) uErr.classList.add('hidden');
    const phoneErr = document.getElementById('auth-phone-error');
    if (phoneErr) phoneErr.classList.add('hidden');
    const otpErr = document.getElementById('auth-otp-error');
    if (otpErr) otpErr.classList.add('hidden');

    // Reset registration form
    const regPhoneInp = document.getElementById('reg-phone-input');
    if (regPhoneInp) regPhoneInp.value = '';
    const regUsernameInp = document.getElementById('reg-pat-username');
    if (regUsernameInp) regUsernameInp.value = '';
    const regNameInp = document.getElementById('reg-pat-name');
    if (regNameInp) regNameInp.value = '';
    const regAgeInp = document.getElementById('reg-pat-age');
    if (regAgeInp) regAgeInp.value = '32';
    const regDiagInp = document.getElementById('reg-pat-diag');
    if (regDiagInp) regDiagInp.value = '';
    const regEmergInp = document.getElementById('reg-pat-emergency');
    if (regEmergInp) regEmergInp.value = '';
    const patErr = document.getElementById('reg-pat-error');
    if (patErr) patErr.classList.add('hidden');
  }

  switchAuthTab(tab) {
    const tabs = ['signin', 'reg-pat'];
    tabs.forEach(t => {
      const btn = document.getElementById(`auth-tab-btn-${t}`);
      const pane = document.getElementById(`auth-tab-pane-${t}`);
      if (t === tab) {
        if (btn) {
          btn.className = 'flex-1 py-2 text-xs font-semibold rounded-t-lg transition-all text-sky-400 border-b-2 border-sky-500 bg-slate-800/40';
        }
        if (pane) pane.classList.remove('hidden');
      } else {
        if (btn) {
          btn.className = 'flex-1 py-2 text-xs font-semibold rounded-t-lg transition-all text-slate-400 hover:text-white';
        }
        if (pane) pane.classList.add('hidden');
      }
    });
  }

  switchLoginMode(mode) {
    const btnUser = document.getElementById('auth-mode-btn-user');
    const btnPhone = document.getElementById('auth-mode-btn-phone');
    const formUser = document.getElementById('auth-form-username');
    const formPhone = document.getElementById('auth-form-phone');

    if (mode === 'username') {
      if (btnUser) btnUser.className = 'flex-1 py-1.5 rounded-lg font-semibold bg-sky-600 text-white transition-all';
      if (btnPhone) btnPhone.className = 'flex-1 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white transition-all';
      if (formUser) formUser.classList.remove('hidden');
      if (formPhone) formPhone.classList.add('hidden');
    } else {
      if (btnUser) btnUser.className = 'flex-1 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white transition-all';
      if (btnPhone) btnPhone.className = 'flex-1 py-1.5 rounded-lg font-semibold bg-sky-600 text-white transition-all';
      if (formUser) formUser.classList.add('hidden');
      if (formPhone) formPhone.classList.remove('hidden');
    }
  }

  async handleUsernameLogin(event) {
    event.preventDefault();
    const username = document.getElementById('auth-username-input').value.trim();
    const role = document.getElementById('auth-user-role-select').value;
    const errBox = document.getElementById('auth-user-error');

    if (!username) {
      if (errBox) {
        errBox.innerText = 'Please enter your username.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    const res = await window.SMARTCARE_AUTH.loginWithUsername(username, role);
    if (res.success) {
      if (errBox) errBox.classList.add('hidden');
      window.SMARTCARE_FCM.showToast('Login Successful!', `Signed in as @${res.user.username || res.user.name} (${res.user.role.toUpperCase()}).`, 'success');
      this.closeAuthModal();
    } else {
      if (errBox) {
        errBox.innerText = res.error || 'User not found. Please register or check username.';
        errBox.classList.remove('hidden');
      } else {
        alert(res.error);
      }
    }
  }

  /* ========================================================== */
  /* REAL OTP AUTHENTICATION & COUNTDOWN TIMER UTILITIES        */
  /* ========================================================== */

  startOtpTimer(buttonId, countdownId, durationSec = 60) {
    this.otpTimers = this.otpTimers || {};
    if (this.otpTimers[buttonId]) {
      clearInterval(this.otpTimers[buttonId]);
    }

    const btn = document.getElementById(buttonId);
    const countdown = document.getElementById(countdownId);
    if (btn) btn.disabled = true;

    let remaining = durationSec;
    if (countdown) countdown.innerText = `Resend in ${remaining}s`;

    this.otpTimers[buttonId] = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(this.otpTimers[buttonId]);
        delete this.otpTimers[buttonId];
        if (btn) btn.disabled = false;
        if (countdown) countdown.innerText = '';
      } else {
        if (countdown) countdown.innerText = `Resend in ${remaining}s`;
      }
    }, 1000);
  }

  async handleSendPatientLoginOtp() {
    const countryCode = document.getElementById('auth-country-code')?.value || '+91';
    const rawPhone = document.getElementById('auth-phone-input')?.value.trim();
    const errBox = document.getElementById('auth-phone-error');
    const sendBtn = document.getElementById('auth-send-otp-btn');

    if (errBox) errBox.classList.add('hidden');

    if (!rawPhone || rawPhone.length < 5) {
      if (errBox) {
        errBox.innerText = 'Please enter a valid mobile number.';
        errBox.classList.remove('hidden');
      } else {
        alert('Please enter a valid mobile number.');
      }
      return;
    }

    const cleanNumber = rawPhone.replace(/^0+/, '').replace(/[\s-]/g, '');
    const fullPhone = `${countryCode}${cleanNumber}`;

    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await window.SMARTCARE_AUTH.sendOtp(fullPhone, 'recaptcha-container');
      if (res.success) {
        this.loginTargetPhone = fullPhone;
        const targetDisplay = document.getElementById('auth-target-phone');
        if (targetDisplay) targetDisplay.innerText = fullPhone;

        const stepPhone = document.getElementById('auth-step-phone');
        const stepOtp = document.getElementById('auth-step-otp');
        if (stepPhone) stepPhone.classList.add('hidden');
        if (stepOtp) stepOtp.classList.remove('hidden');

        // Start 60s countdown timer
        this.startOtpTimer('auth-resend-otp-btn', 'auth-resend-countdown', 60);

        window.SMARTCARE_FCM.showToast('Verification Code Sent', res.message, 'info');
      } else {
        if (errBox) {
          errBox.innerText = res.error || 'Failed to send OTP.';
          errBox.classList.remove('hidden');
        } else {
          alert(res.error);
        }
      }
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  async handleVerifyPatientLoginOtp() {
    const otp = document.getElementById('auth-otp-input')?.value.trim();
    const errBox = document.getElementById('auth-otp-error');
    const verifyBtn = document.getElementById('auth-verify-otp-btn');

    if (errBox) errBox.classList.add('hidden');

    if (!otp || otp.length !== 6) {
      if (errBox) {
        errBox.innerText = 'Please enter the 6-digit OTP code received on SMS.';
        errBox.classList.remove('hidden');
      } else {
        alert('Please enter 6-digit OTP.');
      }
      return;
    }

    if (verifyBtn) verifyBtn.disabled = true;

    try {
      const res = await window.SMARTCARE_AUTH.verifyOtp(otp);
      if (res.success) {
        const verifiedPhone = res.phone || this.loginTargetPhone;
        // Sign in using verified phone number
        const loginRes = await window.SMARTCARE_AUTH.loginWithVerifiedPhone(verifiedPhone);

        if (loginRes.success) {
          window.SMARTCARE_FCM.showToast('Login Successful!', `Welcome back, ${loginRes.user.name}.`, 'success');
          this.closeAuthModal();
        } else if (loginRes.notFound) {
          // Unregistered patient with verified phone: guide seamlessly into patient registration
          window.SMARTCARE_FCM.showToast(
            'Mobile Verified',
            'No existing account found. Please complete your one-time patient registration below.',
            'info'
          );
          this.switchAuthTab('reg-pat');
          // Mark step 1 verified in registration form
          this.markRegistrationPhoneVerified(verifiedPhone);
        } else {
          throw new Error(loginRes.error);
        }
      } else {
        if (errBox) {
          errBox.innerText = res.error || 'Invalid OTP code.';
          errBox.classList.remove('hidden');
        } else {
          alert(res.error);
        }
      }
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Verification error.';
        errBox.classList.remove('hidden');
      } else {
        alert(err.message);
      }
    } finally {
      if (verifyBtn) verifyBtn.disabled = false;
    }
  }

  handleResendPatientLoginOtp() {
    this.handleSendPatientLoginOtp();
  }

  resetAuthLoginStep() {
    const stepPhone = document.getElementById('auth-step-phone');
    const stepOtp = document.getElementById('auth-step-otp');
    if (stepPhone) stepPhone.classList.remove('hidden');
    if (stepOtp) stepOtp.classList.add('hidden');
    const errBox = document.getElementById('auth-phone-error');
    if (errBox) errBox.classList.add('hidden');
  }

  /* ========================================================== */
  /* PATIENT REGISTRATION WITH REAL OTP VERIFICATION            */
  /* ========================================================== */

  async handleSendRegistrationOtp() {
    const countryCode = document.getElementById('reg-country-code')?.value || '+91';
    const rawPhone = document.getElementById('reg-phone-input')?.value.trim();
    const errBox = document.getElementById('reg-pat-error');
    const sendBtn = document.getElementById('reg-send-otp-btn');

    if (errBox) errBox.classList.add('hidden');

    if (!rawPhone || rawPhone.length < 5) {
      if (errBox) {
        errBox.innerText = 'Please enter a valid mobile number.';
        errBox.classList.remove('hidden');
      } else {
        alert('Please enter a valid mobile number.');
      }
      return;
    }

    const cleanNumber = rawPhone.replace(/^0+/, '').replace(/[\s-]/g, '');
    const fullPhone = `${countryCode}${cleanNumber}`;

    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await window.SMARTCARE_AUTH.sendOtp(fullPhone, 'reg-recaptcha-container');
      if (res.success) {
        this.regPendingPhone = fullPhone;
        const targetDisplay = document.getElementById('reg-target-phone');
        if (targetDisplay) targetDisplay.innerText = fullPhone;

        const otpStep = document.getElementById('reg-step-otp');
        if (otpStep) otpStep.classList.remove('hidden');

        // Start 60s countdown timer
        this.startOtpTimer('reg-resend-otp-btn', 'reg-resend-countdown', 60);

        window.SMARTCARE_FCM.showToast('Verification Code Sent', res.message, 'info');
      } else {
        if (errBox) {
          errBox.innerText = res.error || 'Failed to send OTP.';
          errBox.classList.remove('hidden');
        } else {
          alert(res.error);
        }
      }
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  async handleVerifyRegistrationOtp() {
    const otp = document.getElementById('reg-otp-input')?.value.trim();
    const errBox = document.getElementById('reg-pat-error');
    const verifyBtn = document.getElementById('reg-verify-otp-btn');

    if (errBox) errBox.classList.add('hidden');

    if (!otp || otp.length !== 6) {
      if (errBox) {
        errBox.innerText = 'Please enter the 6-digit verification code received on SMS.';
        errBox.classList.remove('hidden');
      } else {
        alert('Please enter 6-digit OTP.');
      }
      return;
    }

    if (verifyBtn) verifyBtn.disabled = true;

    try {
      const res = await window.SMARTCARE_AUTH.verifyOtp(otp);
      if (res.success) {
        const verifiedPhone = res.phone || this.regPendingPhone;
        this.markRegistrationPhoneVerified(verifiedPhone);
        window.SMARTCARE_FCM.showToast('Mobile Verified!', 'You may now fill out your patient profile.', 'success');
      } else {
        if (errBox) {
          errBox.innerText = res.error || 'Invalid OTP code.';
          errBox.classList.remove('hidden');
        } else {
          alert(res.error);
        }
      }
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Verification error.';
        errBox.classList.remove('hidden');
      } else {
        alert(err.message);
      }
    } finally {
      if (verifyBtn) verifyBtn.disabled = false;
    }
  }

  markRegistrationPhoneVerified(phoneNumber) {
    this.regPhoneVerified = true;
    this.regVerifiedPhoneNumber = phoneNumber;

    // Hide input row & OTP step
    const inputRow = document.getElementById('reg-phone-input-row');
    const otpStep = document.getElementById('reg-step-otp');
    if (inputRow) inputRow.classList.add('hidden');
    if (otpStep) otpStep.classList.add('hidden');

    // Show verified badge
    const verifiedBadge = document.getElementById('reg-verified-badge');
    const phoneDisplay = document.getElementById('reg-verified-phone-display');
    if (verifiedBadge) verifiedBadge.classList.remove('hidden');
    if (phoneDisplay) phoneDisplay.innerText = phoneNumber;

    const statusBadge = document.getElementById('reg-status-badge');
    if (statusBadge) {
      statusBadge.innerText = 'PHONE VERIFIED ✓';
      statusBadge.className = 'text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold border border-emerald-500/30';
    }

    // Unlock Step 2 Profile Fields
    const detailsFields = document.getElementById('reg-patient-details-fields');
    if (detailsFields) {
      detailsFields.classList.remove('opacity-50', 'pointer-events-none');
    }
    const submitBtn = document.getElementById('reg-pat-submit-btn');
    if (submitBtn) submitBtn.disabled = false;
  }

  handleResendRegistrationOtp() {
    this.handleSendRegistrationOtp();
  }

  async handleRegisterPatient(event) {
    event.preventDefault();
    const errBox = document.getElementById('reg-pat-error');
    if (errBox) errBox.classList.add('hidden');

    try {
      const countryCode = document.getElementById('reg-country-code')?.value || '+91';
      const rawPhone = document.getElementById('reg-phone-input')?.value.trim();
      const username = document.getElementById('reg-pat-username')?.value.trim();
      const name = document.getElementById('reg-pat-name')?.value.trim();
      const age = parseInt(document.getElementById('reg-pat-age')?.value) || 32;
      const gender = document.getElementById('reg-pat-gender')?.value || 'Not Specified';
      const bloodGroup = document.getElementById('reg-pat-blood')?.value || 'O+';
      const diagnosis = document.getElementById('reg-pat-diag')?.value.trim() || 'General Medical Care';
      const emergencyContact = document.getElementById('reg-pat-emergency')?.value.trim() || '';

      if (!rawPhone || rawPhone.replace(/[^0-9]/g, '').length < 5) {
        throw new Error('Please enter a valid mobile number.');
      }
      if (!username || username.length < 3) {
        throw new Error('Please choose a username of at least 3 characters.');
      }
      if (!name) {
        throw new Error('Please enter your full name.');
      }

      const cleanNumber = rawPhone.replace(/^0+/, '').replace(/[\s-]/g, '');
      const fullPhone = `${countryCode}${cleanNumber}`;

      const patientData = {
        username,
        name,
        phone: fullPhone,
        phoneVerified: true,
        age,
        gender,
        bloodGroup,
        diagnosis,
        emergencyContact
      };

      const res = await window.SMARTCARE_AUTH.registerPatient(patientData);
      if (res.success) {
        window.SMARTCARE_FCM.showToast(
          'Patient Registered Successfully!', 
          `Welcome to SMARTCARE, ${res.user.name}. Signed in as @${res.user.username}.`, 
          'success'
        );
        this.closeAuthModal();
      } else {
        throw new Error(res.error || 'Registration failed');
      }
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Error completing patient registration.';
        errBox.classList.remove('hidden');
      } else {
        alert(err.message);
      }
    }
  }

  // Backward compatibility alias methods
  async handleSendOtp() {
    return this.handleSendPatientLoginOtp();
  }

  async handleVerifyOtp() {
    return this.handleVerifyPatientLoginOtp();
  }

  quickLoginRole(role) {
    this.switchPersona(role);
    this.closeAuthModal();
  }

  async triggerEmergencySOS() {
    const user = window.SMARTCARE_AUTH.getCurrentUser() || { name: 'Patient / Bed Station 204', role: 'patient' };
    await window.SMARTCARE_DB.sendEmergencySOS(user);
    window.SMARTCARE_FCM.triggerLocalAlert(
      `🚨 EMERGENCY ALERT ACTIVATED!`,
      `Hospital Emergency Team, Attending Physician, and Ward Nurses have been dispatched to ${user.roomNumber || 'Cardiology Station'}.`,
      'emergency'
    );
  }

  async toggleNotificationPanel() {
    const drawer = document.getElementById('notification-drawer');
    if (drawer) {
      drawer.classList.toggle('translate-x-full');
      if (!drawer.classList.contains('translate-x-full')) {
        this.renderNotificationsList();
      }
    }
  }

  async renderNotificationsList() {
    const user = window.SMARTCARE_AUTH.getCurrentUser();
    const notifs = await window.SMARTCARE_DB.getNotifications(user?.role, user?.id);
    const container = document.getElementById('notif-list-container');

    if (container) {
      if (notifs.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">No notifications yet.</div>`;
      } else {
        container.innerHTML = notifs.map(n => `
          <div class="p-3 rounded-xl bg-slate-800/80 border ${n.type === 'emergency' ? 'border-red-500/50 bg-red-950/20' : 'border-slate-700/60'} text-xs space-y-1">
            <div class="flex justify-between items-center">
              <span class="font-bold ${n.type === 'emergency' ? 'text-red-400' : 'text-white'}">${n.title}</span>
              <span class="text-[10px] text-slate-400">${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p class="text-slate-300 leading-relaxed">${n.body}</p>
          </div>
        `).join('');
      }
    }
  }

  async updateNotificationBadge() {
    const user = window.SMARTCARE_AUTH.getCurrentUser();
    const notifs = await window.SMARTCARE_DB.getNotifications(user?.role, user?.id);
    const unread = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('notif-count-badge');
    if (badge) {
      badge.innerText = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
  }

  async clearAllNotifications() {
    const notifs = await window.SMARTCARE_DB.getNotifications();
    for (const n of notifs) {
      await window.SMARTCARE_DB.markNotificationAsRead(n.id);
    }
    this.renderNotificationsList();
    this.updateNotificationBadge();
    window.SMARTCARE_FCM.showToast('All Read', 'Notifications marked as read.', 'info');
  }

  /* ========================================================== */
  /* MULTILINGUAL & SHORTCUT NAVIGATION                        */
  /* ========================================================== */

  toggleLanguage() {
    if (window.SMARTCARE_I18N) {
      const lang = window.SMARTCARE_I18N.toggleLanguage();
      const user = window.SMARTCARE_AUTH.getCurrentUser();
      if (user) {
        this.renderCurrentRoleView(user);
      }
      this.renderHospitalLocation();
      this.renderAmbulanceFleet();
      window.SMARTCARE_FCM.showToast(
        lang === 'kn' ? 'ಭಾಷೆ ಬದಲಾಗಿದೆ' : 'Language Changed',
        lang === 'kn' ? 'ಕನ್ನಡ ಭಾಷೆ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ.' : 'Switched to English interface.',
        'info'
      );
    }
  }

  async navigateToTab(role, tabKey) {
    const user = window.SMARTCARE_AUTH.getCurrentUser();
    if (user?.role !== role) {
      await this.switchPersona(role);
    }
    const roleView = document.getElementById(`view-${role}`);
    if (roleView) {
      const btn = roleView.querySelector(`button[onclick*="'${tabKey}'"]`);
      if (btn) {
        this.switchSubTab(role, tabKey, btn);
      }
    }
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  /* ========================================================== */
  /* PATIENT HOSPITAL MAP & GOOGLE MAPS DRIVING NAVIGATION      */
  /* ========================================================== */

  async renderPatientHospitalMap() {
    const hospitals = await window.SMARTCARE_DB.getHospitals();
    const countBadge = document.getElementById('patient-hospital-count-badge');
    if (countBadge) countBadge.innerText = `${hospitals.length} Hospitals`;

    // Populate Hospital Select List
    const listContainer = document.getElementById('patient-hospital-list');
    if (listContainer) {
      if (hospitals.length === 0) {
        listContainer.innerHTML = `
          <div class="p-4 text-center text-slate-400 text-xs">
            No registered hospitals found. Contact Administrator.
          </div>
        `;
      } else {
        listContainer.innerHTML = hospitals.map((h, idx) => `
          <div onclick="window.SMARTCARE_APP.selectHospitalForNavigationById('${h.id}')" class="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 cursor-pointer transition-all flex items-center justify-between text-xs group">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[10px]">
                ${idx + 1}
              </span>
              <div>
                <div class="font-bold text-white group-hover:text-sky-300 leading-tight">${h.name}</div>
                <div class="text-[11px] text-slate-400 truncate max-w-[200px]">${h.address}</div>
              </div>
            </div>
            <span class="text-sky-400 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform">➔</span>
          </div>
        `).join('');
      }
    }

    // Mount Interactive Map
    if (window.SMARTCARE_MAPS) {
      this.patientMapController = window.SMARTCARE_MAPS.initPatientHospitalMap(
        'patient-hospital-map',
        hospitals,
        (selected) => this.selectHospitalForNavigation(selected)
      );
    }

    // Select first hospital by default if available
    if (hospitals.length > 0) {
      this.selectHospitalForNavigation(hospitals[0]);
    } else {
      this.selectedHospitalForNav = null;
    }
  }

  async selectHospitalForNavigationById(id) {
    const hosp = await window.SMARTCARE_DB.getHospitalById(id);
    if (hosp) {
      this.selectHospitalForNavigation(hosp);
      if (this.patientMapController) {
        this.patientMapController.selectHospital(hosp.id);
      }
    }
  }

  selectHospitalForNavigation(hospital) {
    this.selectedHospitalForNav = hospital;

    const nameEl = document.getElementById('pat-selected-hosp-name');
    const addrEl = document.getElementById('pat-selected-hosp-address');
    const phoneEl = document.getElementById('pat-selected-hosp-phone');
    const phoneLink = document.getElementById('pat-selected-hosp-phone-link');
    const emailEl = document.getElementById('pat-selected-hosp-email');
    const emailLink = document.getElementById('pat-selected-hosp-email-link');
    const hoursEl = document.getElementById('pat-selected-hosp-hours');
    const coordsEl = document.getElementById('pat-selected-hosp-coords');

    if (nameEl) nameEl.innerText = hospital.name;
    if (addrEl) addrEl.innerText = hospital.address;
    if (phoneEl) phoneEl.innerText = hospital.phone;
    if (phoneLink) phoneLink.href = `tel:${hospital.phone}`;
    if (emailEl) emailEl.innerText = hospital.email || 'emergency@smartcare.hospital';
    if (emailLink) emailLink.href = `mailto:${hospital.email || 'emergency@smartcare.hospital'}`;
    if (hoursEl) hoursEl.innerText = hospital.workingHours || '24/7 Service';
    if (coordsEl) coordsEl.innerText = `${Number(hospital.latitude).toFixed(4)}° N, ${Number(hospital.longitude).toFixed(4)}° E`;
  }

  handlePatientHospitalSearch(query) {
    if (this.patientMapController) {
      this.patientMapController.filterHospitals(query);
    }
  }

  async getDirectionsToSelectedHospital() {
    if (!this.selectedHospitalForNav) {
      window.SMARTCARE_FCM.showToast('Select a Hospital', 'Please click on a hospital from the list or map first.', 'info');
      return;
    }

    const hosp = this.selectedHospitalForNav;
    window.SMARTCARE_FCM.showToast('Acquiring GPS...', 'Detecting your device location to calculate driving route.', 'info');

    let userPos = null;
    try {
      userPos = await window.SMARTCARE_MAPS.getCurrentPosition(7000);
    } catch (e) {
      console.warn('[SMARTCARE] GPS unavailable or timed out:', e.message);
    }

    const userLat = userPos ? userPos.lat : null;
    const userLng = userPos ? userPos.lng : null;

    // 1. Try to render driving route on interactive map
    if (this.patientMapController && userPos) {
      this.patientMapController.renderRoute(
        { lat: userLat, lng: userLng },
        { lat: hosp.latitude, lng: hosp.longitude },
        (res) => {
          if (res) {
            const strip = document.getElementById('patient-route-summary-strip');
            const dist = document.getElementById('patient-route-distance');
            const dur = document.getElementById('patient-route-duration');
            if (strip) strip.classList.remove('hidden');
            if (dist) dist.innerText = `• Distance: ${res.distance}`;
            if (dur) dur.innerText = `• Est. Time: ${res.duration}`;
          }
        }
      );
    }

    // 2. Open universal Google Maps turn-by-turn navigation in browser / native Android Maps app
    const navUrl = window.SMARTCARE_MAPS.getDirectionsUrl(
      hosp.latitude,
      hosp.longitude,
      hosp.name,
      userLat,
      userLng
    );

    window.open(navUrl, '_blank');
    window.SMARTCARE_FCM.showToast('Opening Navigation', `Launching turn-by-turn route to ${hosp.name}.`, 'success');
  }

  clearPatientRoute() {
    if (this.patientMapController) {
      this.patientMapController.clearRoute();
    }
    const strip = document.getElementById('patient-route-summary-strip');
    if (strip) strip.classList.add('hidden');
  }

  /* ========================================================== */
  /* HOSPITAL LOCATION & GOOGLE MAPS                            */
  /* ========================================================== */

  async renderHospitalLocation() {
    const hospital = await window.SMARTCARE_DB.getHospitalInfo();
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn';
    const floorList = document.getElementById('map-floor-directory-list');
    if (floorList && hospital?.floorDirectory) {
      floorList.innerHTML = hospital.floorDirectory.map(f => `
        <div class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
          <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[10px] shrink-0 whitespace-nowrap">
            ${isKn && f.knFloor ? f.knFloor : f.floor}
          </span>
          <span class="text-slate-300 text-xs leading-tight">
            ${f.departments}
          </span>
        </div>
      `).join('');
    }
  }

  /* ========================================================== */
  /* 24x7 AMBULANCE SERVICES & DISPATCH                         */
  /* ========================================================== */

  async renderAmbulanceFleet() {
    const ambulances = await window.SMARTCARE_DB.getAmbulances();
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn';
    const container = document.getElementById('ambulance-fleet-grid');
    if (container) {
      container.innerHTML = ambulances.map(amb => {
        const isAvail = amb.status === 'available';
        const isDisp = amb.status === 'dispatched';
        const statusClass = isAvail ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : (isDisp ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30');
        const statusText = isKn 
          ? (isAvail ? 'ಲಭ್ಯವಿದೆ (ತಕ್ಷಣ)' : (isDisp ? 'ದಾರಿಯಲ್ಲಿದೆ' : 'ಸ್ಥಳದಲ್ಲಿದೆ'))
          : (isAvail ? 'Available' : (isDisp ? 'Dispatched / En Route' : 'On-Scene'));

        return `
          <div class="glass-card p-5 border-slate-700/60 flex flex-col justify-between space-y-4 hover:border-red-500/30 transition-all">
            <div>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-base font-extrabold text-white font-mono">${amb.vehicleNumber}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}">
                      ${statusText}
                    </span>
                  </div>
                  <h4 class="text-xs font-bold text-red-300 mt-1">
                    ${isKn && amb.kannadaType ? amb.kannadaType : amb.type}
                  </h4>
                </div>
                <div class="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
              </div>

              <div class="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-400">Driver / Paramedic:</span>
                  <span class="font-semibold text-slate-200">${amb.driverName} (${amb.paramedicName})</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Location:</span>
                  <span class="text-sky-400 font-medium">${isKn && amb.kannadaLocation ? amb.kannadaLocation : amb.location}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">ETA:</span>
                  <span class="font-bold text-amber-400 font-mono">${amb.eta}</span>
                </div>
                <div class="pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                  <strong class="text-slate-300">Equipped:</strong> ${isKn && amb.kannadaEquipment ? amb.kannadaEquipment : amb.equipment}
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 pt-2">
              <a href="tel:${amb.driverPhone}" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <span>${isKn ? 'ಚಾಲಕರಿಗೆ ಕರೆ ಮಾಡಿ' : 'Call Driver'}</span>
              </a>
              <span class="text-xs font-mono text-slate-400">${amb.driverPhone}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  openAmbulanceDispatchModal() {
    const modal = document.getElementById('ambulance-dispatch-modal');
    if (modal) modal.classList.remove('hidden');
  }

  async handleAmbulanceDispatch(event) {
    event.preventDefault();
    const condition = document.getElementById('amb-condition-select').value;
    const pickupLocation = document.getElementById('amb-pickup-input').value;
    const phone = document.getElementById('amb-phone-input').value;

    const dispatchedAmb = await window.SMARTCARE_DB.dispatchAmbulance({
      condition,
      pickupLocation,
      phone
    });

    document.getElementById('ambulance-dispatch-modal').classList.add('hidden');
    window.SMARTCARE_FCM.playNotificationSound('emergency');
    
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn';
    const title = isKn ? '🚨 ಆಂಬ್ಯುಲೆನ್ಸ್ ರವಾನಿಸಲಾಗಿದೆ!' : '🚨 Ambulance Dispatched!';
    const msg = isKn 
      ? `${dispatchedAmb.vehicleNumber} ವಾಹನವು ${pickupLocation} ಕಡೆಗೆ ಹೊರಟಿದೆ. ಚಾಲಕ: ${dispatchedAmb.driverName} (${dispatchedAmb.driverPhone}). ಆಗಮನ ಸಮಯ: ${dispatchedAmb.eta}.`
      : `Vehicle ${dispatchedAmb.vehicleNumber} dispatched to ${pickupLocation}. Driver: ${dispatchedAmb.driverName} (${dispatchedAmb.driverPhone}). ETA: ${dispatchedAmb.eta}.`;
    
    window.SMARTCARE_FCM.showToast(title, msg, 'emergency');
    await this.renderAmbulanceFleet();
  }

  /* ========================================================== */
  /* GOOGLE HEALTH ASSISTANT (VOICE & CHAT AGENT)               */
  /* ========================================================== */

  openGoogleAssistant() {
    const modal = document.getElementById('google-assistant-modal');
    if (modal) modal.classList.remove('hidden');
    const chatLog = document.getElementById('asst-chat-log');
    if (chatLog && chatLog.children.length === 0) {
      const user = window.SMARTCARE_AUTH.getCurrentUser();
      const isKn = window.SMARTCARE_I18N?.getLang() === 'kn';
      const greeting = isKn 
        ? `ನಮಸ್ಕಾರ ${user?.name || ''}! ನಾನು ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್‌ಕೇರ್ ಗೂಗಲ್ ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮ್ಮ ಔಷಧಿ, ವೈದ್ಯರ ಕೊಠಡಿ, ಆರೋಗ್ಯ ಸ್ಥಿತಿ ಅಥವಾ ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಬಗ್ಗೆ ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕೇಳಿ.`
        : `Hello ${user?.name || ''}! I am your SMARTCARE Google Health Assistant. You can speak or ask about your medicine schedule, doctor's room, latest vitals, or call an ambulance in English or Kannada.`;
      this.appendAssistantMessage('assistant', greeting);
      if (this.assistantTTS) {
        this.speakText(greeting, isKn ? 'kn-IN' : 'en-US');
      }
    }
  }

  closeGoogleAssistant() {
    const modal = document.getElementById('google-assistant-modal');
    if (modal) modal.classList.add('hidden');
    if (this.assistantRecognition) {
      try { this.assistantRecognition.stop(); } catch (e) {}
    }
  }

  toggleAssistantTTS() {
    this.assistantTTS = this.assistantTTS === undefined ? false : !this.assistantTTS;
    const btn = document.getElementById('asst-tts-toggle');
    if (btn) btn.innerText = this.assistantTTS ? '🔊' : '🔇';
    window.SMARTCARE_FCM.showToast('Voice Output', this.assistantTTS ? 'Voice enabled.' : 'Voice muted.', 'info');
  }

  appendAssistantMessage(sender, text) {
    const isAsst = sender === 'assistant';

    // 1. Append to Floating Modal Chat Log
    const chatLog = document.getElementById('asst-chat-log');
    if (chatLog) {
      const bubble = document.createElement('div');
      bubble.className = `flex gap-2.5 ${isAsst ? '' : 'justify-end'}`;
      bubble.innerHTML = isAsst ? `
        <div class="w-7 h-7 rounded-lg bg-sky-600/30 text-sky-400 flex items-center justify-center shrink-0 text-xs font-bold border border-sky-500/30">🤖</div>
        <div class="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-sm p-3 max-w-[85%] text-slate-100 shadow-md leading-relaxed whitespace-pre-wrap">${text}</div>
      ` : `
        <div class="bg-sky-600 rounded-2xl rounded-tr-sm p-3 max-w-[85%] text-white shadow-md leading-relaxed whitespace-pre-wrap font-medium">${text}</div>
        <div class="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 text-xs font-bold">👤</div>
      `;
      chatLog.appendChild(bubble);
      chatLog.scrollTop = chatLog.scrollHeight;
    }

    // 2. Append to Dedicated Patient Health Assistant Tab Stream
    const tabStream = document.getElementById('patient-assistant-stream');
    if (tabStream) {
      const tabBubble = document.createElement('div');
      tabBubble.className = `flex gap-3 ${isAsst ? '' : 'justify-end'}`;
      const safeText = text.replace(/"/g, '&quot;');
      tabBubble.innerHTML = isAsst ? `
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-sm shadow shrink-0">🤖</div>
        <div class="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 max-w-[85%] text-xs text-slate-100 leading-relaxed shadow-sm whitespace-pre-wrap">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-sky-300">SmartCare Medical Assistant</span>
            <button onclick="window.SMARTCARE_APP.speakText(this.parentElement.nextElementSibling.innerText)" class="p-1 rounded hover:bg-slate-700 text-sky-400 text-[10px]" title="Listen aloud">🔊 Listen</button>
          </div>
          <div>${text}</div>
        </div>
      ` : `
        <div class="bg-indigo-600 rounded-2xl p-3.5 max-w-[85%] text-xs text-white leading-relaxed font-medium shadow-md whitespace-pre-wrap">${text}</div>
        <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 shrink-0">👤</div>
      `;
      tabStream.appendChild(tabBubble);
      tabStream.scrollTop = tabStream.scrollHeight;
    }
  }

  startPatientAssistantVoice() {
    this.startAssistantVoiceRecognition();
  }

  async handlePatientTabInput() {
    const input = document.getElementById('patient-tab-asst-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await this.submitAssistantQuery(text);
  }

  async sendPatientTabQuery(query) {
    await this.submitAssistantQuery(query);
  }

  callNurseStation() {
    const user = window.SMARTCARE_AUTH.getCurrentUser();
    window.SMARTCARE_FCM.triggerLocalAlert(
      "🔔 NURSE STATION INTERCOM ALERT",
      `Assistance requested for Room ${user?.roomNumber || '204'}, Bed ${user?.bedNumber || 'B-02'}. Ward nurse alerted.`,
      'info'
    );
    this.submitAssistantQuery("Nurse station intercom alerted. What is my next scheduled medicine?");
  }

  speakText(text, lang = 'en-US') {
    if (!('speechSynthesis' in window) || this.assistantTTS === false) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_~`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  async submitAssistantQuery(query) {
    if (!query || !query.trim()) return;
    this.appendAssistantMessage('user', query.trim());
    const response = await this.generateAssistantAnswer(query.trim());
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn' || /[\u0C80-\u0CFF]/.test(query);
    this.appendAssistantMessage('assistant', response);
    this.speakText(response, isKn ? 'kn-IN' : 'en-US');
  }

  async handleAssistantTextInput() {
    const input = document.getElementById('asst-text-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await this.submitAssistantQuery(text);
  }

  async generateAssistantAnswer(query) {
    const q = query.toLowerCase();
    const user = window.SMARTCARE_AUTH.getCurrentUser();
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn' || /[\u0C80-\u0CFF]/.test(query);

    // 1. Medicine Queries
    if (q.includes('medicine') || q.includes('next') || q.includes('timing') || q.includes('dose') || q.includes('ಔಷಧಿ') || q.includes('ಮಾತ್ರೆ') || q.includes('ಯಾವಾಗ')) {
      const logs = await window.SMARTCARE_DB.getMedicationLogs();
      const patLogs = logs.filter(l => l.patientId === user.id);
      const pending = patLogs.filter(l => l.status === 'pending');
      if (pending.length > 0) {
        const next = pending[0];
        return isKn 
          ? `ನಿಮ್ಮ ಮುಂದಿನ ಔಷಧಿ: ${next.medicineName} (${next.dosage}).\nನಿಗದಿಪಡಿಸಿದ ಸಮಯ: ${next.slot}.\nವೈದ್ಯರ ಸೂಚನೆ: ${next.notes || 'ಆಹಾರದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಿ.'}`
          : `Your next scheduled medicine is: ${next.medicineName} (${next.dosage}).\nScheduled Time: ${next.slot}.\nDoctor's instructions: ${next.notes || 'Take as advised with water.'}`;
      } else {
        return isKn 
          ? `ಇಂದಿನ ಎಲ್ಲಾ ನಿಗದಿತ ಔಷಧಿಗಳನ್ನು ಈಗಾಗಲೇ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ ಅಥವಾ ನರ್ಸ್ ನೀಡಿದ್ದಾರೆ! ನೀವು ಉತ್ತಮವಾಗಿ ಚೇತರಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೀರಿ.`
          : `All scheduled medications for today have already been completed or administered by your nurse! Keep up the great adherence.`;
      }
    }

    // 2. Doctor Queries
    if (q.includes('doctor') || q.includes('physician') || q.includes('dr') || q.includes('ವೈದ್ಯ') || q.includes('ಡಾಕ್ಟರ್')) {
      const doctors = await window.SMARTCARE_DB.getDoctors();
      if (doctors && doctors.length > 0) {
        const doc = doctors[0];
        return isKn 
          ? `ನಿಮ್ಮ ಮುಖ್ಯ ತಪಾಸಣಾ ವೈದ್ಯರು: ${doc.name} (${doc.specialization || 'ವೈದ್ಯರು'}).\nಕೊಠಡಿ: ${doc.roomNumber || 'ಸಮಾಲೋಚನಾ ಕೊಠಡಿ'}.\nಲಭ್ಯವಿರುವ ದಿನಗಳು: ${Array.isArray(doc.availableDays) ? doc.availableDays.join(', ') : doc.availableDays} (${doc.timings || 'ಸಮಾಲೋಚನಾ ಸಮಯ'}).`
          : `Your attending physician is: ${doc.name} (${doc.specialization || 'Physician'}).\nConsultation Room: ${doc.roomNumber || 'Consultation Suite'}.\nConsultation Hours: ${Array.isArray(doc.availableDays) ? doc.availableDays.join(', ') : doc.availableDays} (${doc.timings || 'Consultation Hours'}).`;
      } else {
        return isKn 
          ? `ಆಸ್ಪತ್ರೆ ಆಡಳಿತದಿಂದ ಇನ್ನೂ ಯಾವುದೇ ವೈದ್ಯರನ್ನು ನೋಂದಾಯಿಸಲಾಗಿಲ್ಲ. ಆಸ್ಪತ್ರೆಯ ಆಡಳಿತಾಧಿಕಾರಿಗಳು 'ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಣೆ' (Staff Management) ವಿಭಾಗದಲ್ಲಿ ವೈದ್ಯರ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿದಾಗ ಇಲ್ಲಿ ಮಾಹಿತಿ ಕಾಣಿಸುತ್ತದೆ.`
          : `No doctors have been registered yet in the hospital registry. Once the Hospital Administrator enters doctor details in Admin Dashboard > Staff Management, their consultation schedule will display here.`;
      }
    }

    // 3. Room & Bed Queries
    if (q.includes('room') || q.includes('bed') || q.includes('ward') || q.includes('ಕೊಠಡಿ') || q.includes('ಹಾಸಿಗೆ') || q.includes('ವಾರ್ಡ್')) {
      return isKn 
        ? `ನಿಮ್ಮ ನಿಯೋಜಿತ ಸ್ಥಳ:\nಕೊಠಡಿ ಸಂಖ್ಯೆ: ${user.roomNumber || 'Room 204'}\nಹಾಸಿಗೆ ಸಂಖ್ಯೆ: ${user.bedNumber || 'Bed B-02'}\nವಾರ್ಡ್: ${user.ward || 'ಕಾರ್ಡಿಯಾಲಜಿ ವಾರ್ಡ್ ಎ, ೨ನೇ ಮಹಡಿ'}.`
        : `Your allocated location in the hospital is:\nRoom: ${user.roomNumber || 'Room 204'}\nBed: ${user.bedNumber || 'Bed B-02'}\nWard: ${user.ward || 'Cardiology Inpatient Ward A (2nd Floor)'}.`;
    }

    // 4. Vitals Queries
    if (q.includes('vitals') || q.includes('bp') || q.includes('blood pressure') || q.includes('temp') || q.includes('pulse') || q.includes('ಆರೋಗ್ಯ') || q.includes('ಬಿಪಿ')) {
      const vitals = await window.SMARTCARE_DB.getVitals(user.id);
      if (vitals && vitals.length > 0) {
        const latest = vitals[0];
        return isKn 
          ? `ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಆರೋಗ್ಯ ವಿವರ (ವೈಟಲ್ಸ್):\nಸ್ಥಿತಿ: ${latest.condition}\nರಕ್ತದೊತ್ತಡ (BP): ${latest.bloodPressure}\nದೇಹದ ತಾಪಮಾನ: ${latest.temperature}°F\nನಾಡಿಮಿಡಿತ: ${latest.pulse} bpm\nಆಮ್ಲಜನಕ SpO2: ${latest.spO2}%\nದಾಖಲಿಸಿದವರು: ${latest.nurseName || 'ಕರ್ತವ್ಯನಿರತ ನರ್ಸ್'}.`
          : `Your latest vital signs:\nCondition: ${latest.condition}\nBlood Pressure: ${latest.bloodPressure} mmHg\nTemperature: ${latest.temperature}°F\nPulse: ${latest.pulse} bpm\nOxygen SpO2: ${latest.spO2}%\nRecorded by: ${latest.nurseName || 'Duty Staff Nurse'}.`;
      } else {
        return isKn 
          ? `ಇಂದು ಇನ್ನೂ ವೈಟಲ್ಸ್ ದಾಖಲಾಗಿಲ್ಲ. ನಿಮ್ಮ ಕರ್ತವ್ಯನಿರತ ನರ್ಸ್ ಶೀಘ್ರದಲ್ಲೇ ಪರಿಶೀಲಿಸುತ್ತಾರೆ.`
          : `No vitals recorded yet today. Ward nurse will check shortly during clinical rounds.`;
      }
    }

    // 5. Ambulance Queries
    if (q.includes('ambulance') || q.includes('emergency') || q.includes('108') || q.includes('ಆಂಬ್ಯುಲೆನ್ಸ್') || q.includes('ತುರ್ತು')) {
      return isKn 
        ? `ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಹಾಯವಾಣಿ: ೧೦೮ ಅಥವಾ ೦೮೦-೨೬೯೯ ೫೦೦೦.\nನಮ್ಮ ಆಸ್ಪತ್ರೆಯ ಮುಖ್ಯ ತುರ್ತು ವಾಹನ KA-05-HA-1081 (ACLS ICU Unit) ಸಿದ್ಧವಾಗಿದೆ. ಚಾಲಕ ಮಂಜುನಾಥ್: +91 98450 11223.\nನೀವು "Request Ambulance" ಬಟನ್ ಒತ್ತಿ ತಕ್ಷಣ ವಾಹನ ಕರೆಯಬಹುದು!`
        : `24x7 Emergency Ambulance Hotline: 108 or 080-2699 5000.\nHospital ACLS Cardiac Mobile ICU unit (KA-05-HA-1081) is available at Bay 1. Driver Manjunath K: +91 98450 11223.\nYou can also click 'Request Ambulance' for instant dispatch!`;
    }

    // 6. Appointment Queries
    if (q.includes('appointment') || q.includes('book') || q.includes('ಅಪಾಯಿಂಟ್ಮೆಂಟ್') || q.includes('ಬುಕ್')) {
      setTimeout(() => this.navigateToTab('patient', 'appointments'), 1000);
      return isKn 
        ? `ಖಂಡಿತ! ನಾನು ನಿಮ್ಮನ್ನು ವೈದ್ಯರ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕಿಂಗ್ ವಿಭಾಗಕ್ಕೆ ಕರೆದೊಯ್ಯುತ್ತಿದ್ದೇನೆ. ಅಲ್ಲಿ ನೀವು ಹೃದ್ರೋಗ, ಜನರಲ್ ಮೆಡಿಸಿನ್ ಅಥವಾ ನರವಿಜ್ಞಾನ ವೈದ್ಯರ ಸ್ಲಾಟ್ ಆಯ್ಕೆಮಾಡಬಹುದು.`
        : `Certainly! I have opened the 'Book Appointment' section for you where you can choose available consultation slots across Cardiology, General Medicine, and Neurology.`;
    }

    // General conversational response
    return isKn 
      ? `ನಾನು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ನೀವು ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ, ವೈದ್ಯರ ಕೊಠಡಿ, ಬಿಪಿ/ತಾಪಮಾನ ಅಥವಾ ಆಂಬ್ಯುಲೆನ್ಸ್ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ನಾನು ನಿಮಗೆ ಸದಾ ನೆರವಾಗಲು ಇಲ್ಲಿದ್ದೇನೆ!`
      : `I understand your question. As your SMARTCARE health assistant, I can help you with your daily medications, attending doctor, room number, live vitals, or dispatching an emergency ambulance!`;
  }

  startAssistantVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.SMARTCARE_FCM.showToast('Voice Error', 'Speech recognition is not supported in this browser. Please use text input.', 'warning');
      return;
    }

    const micPulse = document.getElementById('asst-mic-pulse');
    if (micPulse) micPulse.classList.remove('hidden');

    const recognition = new SpeechRecognition();
    const isKn = window.SMARTCARE_I18N?.getLang() === 'kn';
    recognition.lang = isKn ? 'kn-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    this.assistantRecognition = recognition;

    recognition.onstart = () => {
      console.log('[VoiceAssistant] Listening started in', recognition.lang);
      window.SMARTCARE_FCM.showToast('Listening...', isKn ? 'ಮಾತನಾಡಿ...' : 'Speak now...', 'info');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('[VoiceAssistant] Transcript recognized:', transcript);
      const input = document.getElementById('asst-text-input');
      if (input) input.value = transcript;
      this.submitAssistantQuery(transcript);
    };

    recognition.onerror = (event) => {
      console.warn('[VoiceAssistant] Recognition error:', event.error);
      if (micPulse) micPulse.classList.add('hidden');
    };

    recognition.onend = () => {
      if (micPulse) micPulse.classList.add('hidden');
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
      if (micPulse) micPulse.classList.add('hidden');
    }
  }

  /**
   * Periodic interval checker for medicine alerts
   */
  startMedicationReminderTimer() {
    setInterval(async () => {
      const user = window.SMARTCARE_AUTH.getCurrentUser();
      if (user && user.role === 'patient') {
        const logs = await window.SMARTCARE_DB.getMedicationLogs();
        const pending = logs.find(l => l.patientId === user.id && l.status === 'pending');
        if (pending) {
          // Send occasional reminder check
          console.log('[Timer] Active medication scheduled for patient:', pending.medicineName);
        }
      }
    }, 60000);
  }
}

window.SMARTCARE_APP = new SmartCareApp();
