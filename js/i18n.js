/**
 * SMARTCARE – Multilingual Internationalization (i18n) Engine
 * Full bilingual support for English and Kannada (ಕನ್ನಡ)
 */

const SMARTCARE_TRANSLATIONS = {
  en: {
    // Header & Brand
    app_title: "SMARTCARE",
    app_subtitle: "Smart Healthcare Management System",
    portal_patient: "Patient Portal",
    portal_doctor: "Doctor Portal",
    portal_nurse: "Nurse Portal",
    portal_caregiver: "Caregiver Portal",
    portal_admin: "Hospital Administrator",
    btn_sos: "EMERGENCY SOS",
    btn_notifications: "Notifications",
    btn_login: "Mobile OTP Login",
    btn_change_user: "Switch Account",
    lang_toggle: "ಕನ್ನಡ",
    current_lang_label: "English",

    // Roles & Switcher
    role_patient: "Patient",
    role_doctor: "Doctor",
    role_nurse: "Nurse",
    role_caregiver: "Caregiver",
    role_admin: "Admin",
    demo_mode: "Demo Mode (Zero-Setup Active)",
    cloud_connected: "Firebase Cloud Connected",

    // Top Navigation Tabs & Shortcuts
    nav_hospital_map: "Hospital Location & Map",
    nav_ambulance: "24x7 Ambulance",
    nav_assistant: "Google Health Assistant",

    // Patient Dashboard
    pat_inpatient: "Inpatient",
    pat_age: "Age",
    pat_blood: "Blood",
    pat_phone: "Phone",
    pat_location_bed: "Location / Bed",
    pat_primary_doctor: "Primary Doctor",
    pat_tab_medications: "Medicine Schedule & Reminders",
    pat_tab_book_apt: "Book Appointment",
    pat_tab_my_apts: "My Appointments History",
    pat_tab_vitals_stay: "Hospital Info & Vitals",
    pat_tab_map: "Hospital Location & Maps",
    pat_tab_ambulance: "Ambulance Services",
    pat_tab_assistant: "Patient AI Assistant",
    pat_asst_title: "SmartCare Patient Health Assistant",
    pat_asst_subtitle: "Your 24x7 personal medical companion. Ask questions about your medications, doctor, room/bed, vitals, or request emergency assistance in English or ಕನ್ನಡ (Kannada).",

    // Medicine Reminders
    pat_today_adherence: "Today's Medication Adherence",
    pat_push_alerts: "Push Notifications",
    pat_push_desc: "Receive sound alerts on your phone at exact dosage times.",
    pat_enable_alerts: "Enable Dosage Alerts",
    pat_dosage_schedule: "Today's Dosage Schedule",
    pat_prescribed_by: "Prescribed by",
    pat_active_rx_title: "All Active Prescriptions & Doctor's Instructions",
    pat_col_medicine: "Medicine & Dosage",
    pat_col_schedule: "Schedule",
    pat_col_food: "Food Timing",
    pat_col_instructions: "Doctor's Specific Instructions",
    pat_col_duration: "Duration",
    pat_btn_mark_taken: "Mark as Taken",
    pat_dose_taken: "Dose Confirmed Taken",
    pat_dose_administered: "Administered by Nurse",
    pat_dose_pending: "Pending",

    // Appointment Booking
    apt_title: "Book a Doctor's Appointment",
    apt_subtitle: "Directly schedule outpatient consultations from your phone or computer.",
    apt_filter_dept: "Department:",
    apt_btn_book_now: "Book Appointment Slot",
    apt_form_confirm: "Confirm Slot with",
    apt_date_label: "Appointment Date",
    apt_slot_label: "Available Time Slot",
    apt_reason_label: "Reason for Visit / Current Symptoms",
    apt_btn_confirm: "Confirm & Request Appointment",
    apt_btn_cancel: "Cancel",
    apt_history_title: "My Booked Appointments",
    apt_status_confirmed: "Confirmed",
    apt_status_pending: "Pending Approval",
    apt_status_rejected: "Cancelled / Rejected",
    apt_status_completed: "Completed",

    // Hospital Facility & Vitals
    stay_info_title: "Hospital Admission Information",
    stay_hospital: "Hospital:",
    stay_ward: "Ward & Section:",
    stay_room_bed: "Allocated Room & Bed:",
    stay_doctor: "Attending Senior Doctor:",
    stay_nurse: "Duty Staff Nurse:",
    stay_emergency_call: "Emergency Nurse Call:",
    stay_vitals_title: "Latest Clinical Health Updates (Vitals)",
    stay_temp: "Temperature",
    stay_bp: "Blood Pressure",
    stay_pulse: "Heart Rate",
    stay_spo2: "SpO2 (Oxygen)",

    // Google Maps & Location
    map_section_title: "Hospital Campus Location & Assigned Patient Ward",
    map_directions_btn: "Open Driving Directions in Google Maps",
    map_hospital_name: "Apollo Metro Super Specialty Hospital",
    map_address_title: "Campus Address & Contact",
    map_coordinates_label: "GPS Coordinates:",
    map_assigned_ward_title: "Your Assigned Ward & Room",
    map_floor_dir_title: "Hospital Building & Floor Directory",

    // Ambulance Information
    amb_title: "24x7 Emergency Ambulance & Trauma Fleet",
    amb_subtitle: "Equipped mobile ICU units, rapid trauma response, and neonatal transport across Bengaluru.",
    amb_hotline_label: "Emergency 24x7 Ambulance Hotline:",
    amb_request_btn: "Request Emergency Ambulance Dispatch",
    amb_col_vehicle: "Ambulance Vehicle",
    amb_col_type: "Type & Equipment",
    amb_col_crew: "Driver & Crew Phone",
    amb_col_status: "Live Status & Location",
    amb_call_driver: "Call Driver",
    amb_modal_title: "Request Emergency Ambulance Dispatch",
    amb_modal_desc: "Direct ambulance unit dispatch to your current GPS location or hospital bay.",
    amb_condition_label: "Patient Emergency Condition:",
    amb_pickup_label: "Pickup Location / Room:",
    amb_btn_dispatch: "Confirm & Dispatch Ambulance Now",

    // Google Assistant
    asst_header: "Google Health Assistant",
    asst_kannada_hint: "Try asking in English or ಕನ್ನಡ (Kannada)",
    asst_greeting: "Hello! I am your SMARTCARE Health Assistant. You can speak or type your question. How can I help you today?",
    asst_chip_next_med: "💊 When is my next medicine?",
    asst_chip_doctor: "👨‍⚕️ Who is my doctor and room?",
    asst_chip_vitals: "🩺 What are my latest vitals?",
    asst_chip_room: "🛏️ Where is my room & bed?",
    asst_chip_ambulance: "🚑 Emergency ambulance numbers",
    asst_chip_book: "📅 Book a doctor appointment",
    asst_input_placeholder: "Ask anything about medicine, doctor, vitals, or room...",
    asst_listening: "Listening... speak now",
    asst_voice_error: "Voice recognition could not start. Please use text input.",
    asst_speak_btn: "Voice Output",

    // Doctor Module
    doc_attending: "Attending Physician",
    doc_btn_update_hours: "Update Hours & Room",
    doc_tab_requests: "Appointment Requests & Consultations",
    doc_tab_prescribe: "Prescribe Medicine",
    doc_tab_vitals: "Clinical Vitals Monitor",
    doc_rx_title: "Issue New Medicine Prescription",
    doc_rx_subtitle: "Saved prescriptions immediately synchronize with the Nurse's administration schedule and Patient's reminder alarms.",
    doc_rx_patient: "Select Patient",
    doc_rx_med_name: "Medicine Name & Form (Tablet, Syrup, Injection)",
    doc_rx_dosage: "Dosage",
    doc_rx_frequency: "Frequency",
    doc_rx_meal: "Meal Relation",
    doc_rx_timings: "Administration Timing(s)",
    doc_rx_start: "Start Date",
    doc_rx_end: "End Date",
    doc_rx_inst: "Doctor's Specific Instructions to Patient",
    doc_rx_care: "Additional Nursing & Caregiver Instructions",
    doc_rx_save: "Save Prescription & Notify Patient / Nurse",

    // Nurse Module
    nurse_senior: "Senior Staff Nurse",
    nurse_assigned_inpatients: "Assigned Inpatients",
    nurse_tab_meds: "Medication Administration Schedule",
    nurse_tab_vitals: "Update Patient Health Vitals",
    nurse_tab_beds: "Assigned Ward Bed Status",
    nurse_checklist_title: "Today's Inpatient Medication Administration Checklist",
    nurse_checklist_sub: "Confirm administered doses based on Doctor's prescription",
    nurse_btn_administer: "Administer & Confirm",
    nurse_vitals_title: "Record Patient Clinical Vitals & Observation",
    nurse_vitals_sub: "Updating vitals logs temperature, BP, pulse, SpO2, and nursing notes visible to attending physicians and family caregivers.",
    nurse_btn_save_vitals: "Record Health Update & Notify Doctor",

    // Caregiver Module
    care_title: "Family Caregiver",
    care_monitoring: "Monitoring:",
    care_btn_staff_alert: "Direct Staff Alert",
    care_feed_title: "Medication Administration Feed",
    care_care_plan: "Doctor's Care Plan & Instructions",

    // Admin Module
    admin_title: "Hospital Administrator",
    admin_btn_add_doctor: "Add New Doctor",
    admin_btn_add_staff: "+ Register Staff Member",
    admin_tab_staff: "👥 All Staff Directory",
    admin_tab_hospitals: "🏥 Hospitals & Google Maps",
    admin_tab_doc_reg: "👨‍⚕️ Doctor Registration",
    admin_tab_nurse_reg: "👩‍⚕️ Nurse Registration",
    admin_tab_care_reg: "🤝 Caregiver Registration",
    admin_tab_patients: "👤 Registered Patients",
    admin_patient_directory_title: "Registered Patients Directory",
    admin_patient_directory_subtitle: "Centralized master directory of registered patients, verified phone numbers, and clinical care assignments.",
    otp_sent_msg: "Real 6-digit OTP dispatched via SMS. Please verify within 5 minutes.",
    otp_verified_msg: "Mobile Number Verified Successfully!",
    admin_setup_title: "Administrator Initial Setup",
    admin_setup_locked: "Administrator Setup Locked",
    admin_tab_db_reset: "🗄️ Database Backup & Reset",
    admin_tab_doctors: "Doctor Management",
    admin_tab_beds: "Hospital Bed & Room Management",
    admin_tab_apts: "Hospital-Wide Appointments",
    admin_tab_audit: "Emergency & Audit Logs",

    // Hospitals & Google Maps
    hosp_section_title: "Hospital Registration & Google Maps Location",
    hosp_section_subtitle: "Register hospital centers with Google Places search, pin picking, and real-time GPS coordinates.",
    hosp_name_label: "Hospital Name",
    hosp_address_label: "Hospital Address (Places Search)",
    hosp_phone_label: "Contact Phone Number",
    hosp_email_label: "Official Email Address",
    hosp_hours_label: "Working Hours (e.g. 24/7 or 08:00 AM - 08:00 PM)",
    hosp_lat_label: "Latitude",
    hosp_lng_label: "Longitude",
    hosp_map_picker_hint: "Search an address above or click/drag the pin on the map to set exact coordinates.",
    hosp_btn_save: "Save Hospital to Database",
    hosp_btn_reset: "Clear Form",
    hosp_list_title: "Registered Hospitals Master Directory",

    doc_section_title: "Doctor Registration (Admin Only)",
    doc_section_subtitle: "Register medical practitioners with consultation rooms, weekly schedules, and hospital affiliation.",
    doc_field_name: "Doctor Name (with Dr. prefix)",
    doc_field_mobile: "Mobile Number (OTP Login & Contact)",
    doc_field_email: "Doctor Email Address",
    doc_field_spec: "Medical Specialization",
    doc_field_hospital: "Affiliated Hospital",
    doc_field_room: "Consultation Room Number",
    doc_field_days: "Available Days (e.g. Mon, Wed, Fri)",
    doc_field_time: "Available Time (e.g. 09:00 AM - 01:00 PM)",
    doc_btn_save: "Register Doctor",

    nurse_section_title: "Nurse Registration (Admin Only)",
    nurse_section_subtitle: "Register nursing officers with assigned departments, duty shifts, and hospital affiliation.",
    nurse_field_name: "Nurse Name",
    nurse_field_mobile: "Mobile Number (OTP Login & Contact)",
    nurse_field_email: "Nurse Email Address",
    nurse_field_hospital: "Affiliated Hospital",
    nurse_field_dept: "Nursing Department (e.g. ICU, Emergency, Inpatient)",
    nurse_field_shift: "Duty Timing / Shift (e.g. 07:00 AM - 03:00 PM)",
    nurse_btn_save: "Register Nurse",

    care_section_title: "Caregiver Registration (Admin Only)",
    care_section_subtitle: "Register dedicated caretakers and personal caregivers with service capabilities.",
    care_field_name: "Caregiver Name",
    care_field_mobile: "Mobile Number (OTP Login & Contact)",
    care_field_email: "Caregiver Email Address",
    care_field_hospital: "Affiliated Hospital",
    care_field_timing: "Available Timing / Shift",
    care_field_services: "Services Provided (e.g. Elderly Care, Post-Op Support)",
    care_btn_save: "Register Caregiver",

    nav_get_directions: "GET DIRECTIONS",
    nav_select_hospital: "Select a Hospital",
    nav_no_hospitals: "No hospitals registered yet. Admin can register hospitals using the Admin Dashboard.",
    
    db_backup_title: "Database Backup & Factory Reset",
    db_backup_subtitle: "Safely download full JSON snapshots or completely wipe test records while preserving application architecture.",
    db_btn_backup: "Download Full Database Backup",
    db_btn_reset: "Reset All Test Data (Wipe Database)",
    admin_auth_title: "Hospital Administrator Authentication",
    admin_auth_subtitle: "Enter authorized Admin credentials to manage hospitals, staff, and database.",

    // Centralized Staff Management
    staff_title: "Centralized Hospital Staff Directory",
    staff_subtitle: "One-time registration of Doctors, Nurses, and Caretakers with permanent Firestore sync & duplicate prevention.",
    staff_search_placeholder: "Search staff by name, mobile, specialization, or ID...",
    staff_filter_all: "All Staff",
    staff_filter_doctors: "Doctors",
    staff_filter_nurses: "Nurses",
    staff_filter_caretakers: "Caretakers",
    staff_col_id: "Staff ID",
    staff_col_name: "Staff Name & Role",
    staff_col_mobile: "Mobile Number",
    staff_col_dept: "Department / Specialization",
    staff_col_station: "Room / Shift / Assigned Patient",
    staff_col_status: "Status",
    staff_col_actions: "Actions (Admin Only)",
    staff_btn_add: "+ Register Staff Member",
    staff_modal_add_title: "Register New Staff Member",
    staff_modal_edit_title: "Edit Staff Member Details",
    staff_modal_desc: "One-time registration of medical staff. Automatically synchronized across all hospital modules.",
    staff_field_role: "Staff Role",
    staff_field_name: "Full Name (with Title)",
    staff_field_mobile: "Mobile Number (OTP Login & Contact)",
    staff_field_spec: "Specialization (Doctor)",
    staff_field_qual: "Qualifications",
    staff_field_exp: "Experience (Years)",
    staff_field_room: "OPD Consultation Room",
    staff_field_timings: "Consultation Timings",
    staff_field_dept: "Nursing Department",
    staff_field_shift: "Shift Timing",
    staff_field_ward: "Assigned Ward",
    staff_field_rel: "Relationship to Patient (Caretaker)",
    staff_field_patient: "Assigned Patient Name & Bed",
    staff_save_btn: "Save Staff Information",
    staff_delete_confirm: "Are you sure you want to delete this staff record? This action will permanently remove their profile.",

    // Auth Modal
    auth_title: "Mobile Number OTP Login",
    auth_desc: "Patients and hospital staff log in securely using mobile number only. No password needed.",
    auth_label_role: "Select Role",
    auth_label_phone: "Mobile Number (with Country Code)",
    auth_btn_send_otp: "Send Verification Code (OTP)",
    auth_quick_test: "Or 1-Click Fast Login as Test Persona:",
    auth_otp_info: "Enter the 6-digit verification code sent to",
    auth_otp_label: "Enter 6-Digit OTP",
    auth_btn_verify: "Verify & Sign In",
    auth_btn_back: "← Back to Phone Number"
  },

  kn: {
    // Header & Brand
    app_title: "ಸ್ಮಾರ್ಟ್‌ಕೇರ್",
    app_subtitle: "ಸ್ಮಾರ್ಟ್ ಆರೋಗ್ಯ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ",
    portal_patient: "ರೋಗಿಗಳ ಪೋರ್ಟಲ್",
    portal_doctor: "ವೈದ್ಯರ ಪೋರ್ಟಲ್",
    portal_nurse: "ಶುಶ್ರೂಷಕಿ (ನರ್ಸ್) ಪೋರ್ಟಲ್",
    portal_caregiver: "ಆರೈಕೆದಾರರ ಪೋರ್ಟಲ್",
    portal_admin: "ಆಸ್ಪತ್ರೆ ಆಡಳಿತ ಮಂಡಳಿ",
    btn_sos: "ತುರ್ತು ಎಸ್‌ಒಎಸ್ (SOS)",
    btn_notifications: "ಅಧಿಸೂಚನೆಗಳು",
    btn_login: "ಮೊಬೈಲ್ ಒಟಿಪಿ ಲಾಗಿನ್",
    btn_change_user: "ಖಾತೆ ಬದಲಾಯಿಸಿ",
    lang_toggle: "English",
    current_lang_label: "ಕನ್ನಡ",

    // Roles & Switcher
    role_patient: "ರೋಗಿ",
    role_doctor: "ವೈದ್ಯರು",
    role_nurse: "ಶುಶ್ರೂಷಕಿ",
    role_caregiver: "ಆರೈಕೆದಾರ",
    role_admin: "ಆಡಳಿತಾಧಿಕಾರಿ",
    demo_mode: "ಡೆಮೊ ಮೋಡ್ (ಪರೀಕ್ಷಾರ್ಥ ಸಕ್ರಿಯ)",
    cloud_connected: "ಫೈರ್‌ಬೇಸ್ ಕ್ಲೌಡ್ ಸಂಪರ್ಕಗೊಂಡಿದೆ",

    // Top Navigation Tabs & Shortcuts
    nav_hospital_map: "ಆಸ್ಪತ್ರೆ ಸ್ಥಳ & ನಕ್ಷೆ",
    nav_ambulance: "೨೪x೭ ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್",
    nav_assistant: "ಗೂಗಲ್ ಆರೋಗ್ಯ ಸಹಾಯಕ",

    // Patient Dashboard
    pat_inpatient: "ದಾಖಲಾದ ರೋಗಿ (ಇನ್‌ಪೇಷಂಟ್)",
    pat_age: "ವಯಸ್ಸು",
    pat_blood: "ರಕ್ತದ ಗುಂಪು",
    pat_phone: "ದೂರವಾಣಿ",
    pat_location_bed: "ಕೊಠಡಿ / ಹಾಸಿಗೆ",
    pat_primary_doctor: "ಮುಖ್ಯ ವೈದ್ಯರು",
    pat_tab_medications: "ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಜ್ಞಾಪನೆಗಳು",
    pat_tab_book_apt: "ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ",
    pat_tab_my_apts: "ನನ್ನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಳು",
    pat_tab_vitals_stay: "ಆಸ್ಪತ್ರೆ ವಿವರ ಮತ್ತು ಆರೋಗ್ಯ ಸ್ಥಿತಿ",
    pat_tab_map: "ಆಸ್ಪತ್ರೆ ಸ್ಥಳ & ಗೂಗಲ್ ನಕ್ಷೆ",
    pat_tab_ambulance: "ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೇವೆಗಳು",
    pat_tab_assistant: "ರೋಗಿ AI ಆರೋಗ್ಯ ಸಹಾಯಕ",
    pat_asst_title: "ಸ್ಮಾರ್ಟ್‌ಕೇರ್ ರೋಗಿ ಆರೋಗ್ಯ ಸಹಾಯಕ",
    pat_asst_subtitle: "ನಿಮ್ಮ ೨೪x೭ ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶಿ. ಔಷಧಿಗಳು, ವೈದ್ಯರು, ಕೊಠಡಿ/ಹಾಸಿಗೆ, ವೈಟಲ್ಸ್ ಅಥವಾ ತುರ್ತು ನೆರವಿನ ಬಗ್ಗೆ ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.",

    // Medicine Reminders
    pat_today_adherence: "ಇಂದಿನ ಔಷಧಿ ಸೇವನೆಯ ಶೇಕಡಾವಾರು",
    pat_push_alerts: "ಪುಶ್ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು",
    pat_push_desc: "ನಿಖರವಾದ ಔಷಧಿ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಫೋನ್‌ಗೆ ಶಬ್ದ ಸಹಿತ ಅಲಾರಾಂ ಬರುತ್ತದೆ.",
    pat_enable_alerts: "ಔಷಧಿ ಅಲರ್ಟ್ ಸಕ್ರಿಯಗೊಳಿಸಿ",
    pat_dosage_schedule: "ಇಂದಿನ ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ",
    pat_prescribed_by: "ವೈದ್ಯರು ಸೂಚಿಸಿದವರು",
    pat_active_rx_title: "ಪ್ರಸ್ತುತ ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಎಲ್ಲಾ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು ಮತ್ತು ವೈದ್ಯರ ಸೂಚನೆಗಳು",
    pat_col_medicine: "ಔಷಧಿ ಹೆಸರು & ಪ್ರಮಾಣ",
    pat_col_schedule: "ಸಮಯ",
    pat_col_food: "ಆಹಾರದ ಸಮಯ",
    pat_col_instructions: "ವೈದ್ಯರ ನಿಖರ ಸೂಚನೆಗಳು",
    pat_col_duration: "ಅವಧಿ",
    pat_btn_mark_taken: "ಔಷಧಿ ತೆಗೆದುಕೊಂಡೆ ಎಂದು ಗುರುತಿಸಿ",
    pat_dose_taken: "ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ (ದೃಢೀಕರಿಸಲಾಗಿದೆ)",
    pat_dose_administered: "ನರ್ಸ್‌ನಿಂದ ನೀಡಲಾಗಿದೆ",
    pat_dose_pending: "ಬಾಕಿ ಉಳಿದಿದೆ",

    // Appointment Booking
    apt_title: "ವೈದ್ಯರ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ",
    apt_subtitle: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಫೋನ್‌ನಿಂದ ನೇರವಾಗಿ ವೈದ್ಯರ ಸಮಾಲೋಚನೆ ಸಮಯವನ್ನು ನಿಗದಿಪಡಿಸಿ.",
    apt_filter_dept: "ವಿಭಾಗ:",
    apt_btn_book_now: "ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ",
    apt_form_confirm: "ಇವರೊಂದಿಗೆ ಸಮಯ ದೃಢೀಕರಿಸಿ:",
    apt_date_label: "ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ದಿನಾಂಕ",
    apt_slot_label: "ಲಭ್ಯವಿರುವ ಸಮಯದ ಸ್ಲಾಟ್",
    apt_reason_label: "ಭೇಟಿಗೆ ಕಾರಣ / ಆರೋಗ್ಯ ಲಕ್ಷಣಗಳು",
    apt_btn_confirm: "ದೃಢೀಕರಿಸಿ & ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ವಿನಂತಿಸಿ",
    apt_btn_cancel: "ರದ್ದುಮಾಡಿ",
    apt_history_title: "ನನ್ನ ಬುಕ್ ಆದ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಳು",
    apt_status_confirmed: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    apt_status_pending: "ಅನುಮೋದನೆ ಬಾಕಿ ಇದೆ",
    apt_status_rejected: "ರದ್ದುಮಾಡಲಾಗಿದೆ",
    apt_status_completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",

    // Hospital Facility & Vitals
    stay_info_title: "ಆಸ್ಪತ್ರೆಯ ಪ್ರವೇಶ ಮಾಹಿತಿ",
    stay_hospital: "ಆಸ್ಪತ್ರೆ:",
    stay_ward: "ವಾರ್ಡ್ & ವಿಭಾಗ:",
    stay_room_bed: "ನಿಯೋಜಿತ ಕೊಠಡಿ & ಹಾಸಿಗೆ:",
    stay_doctor: "ತಪಾಸಣಾ ಹಿರಿಯ ವೈದ್ಯರು:",
    stay_nurse: "ಕರ್ತವ್ಯನಿರತ ನರ್ಸ್:",
    stay_emergency_call: "ತುರ್ತು ನರ್ಸ್ ಕರ ಕರೆ ಬಟನ್:",
    stay_vitals_title: "ಇತ್ತೀಚಿನ ಕ್ಲಿನಿಕಲ್ ಆರೋಗ್ಯ ನವೀಕರಣಗಳು (ವೈಟಲ್ಸ್)",
    stay_temp: "ದೇಹದ ತಾಪಮಾನ",
    stay_bp: "ರಕ್ತದೊತ್ತಡ (BP)",
    stay_pulse: "ಹೃದಯ ಬಡಿತ (ನಾಡಿಮಿಡಿತ)",
    stay_spo2: "ಆಮ್ಲಜನಕ ಮಟ್ಟ (SpO2)",

    // Google Maps & Location
    map_section_title: "ಆಸ್ಪತ್ರೆ ಕ್ಯಾಂಪಸ್ ಸ್ಥಳ ಮತ್ತು ನಿಗದಿಪಡಿಸಿದ ರೋಗಿಯ ವಾರ್ಡ್",
    map_directions_btn: "ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ದಿಕ್ಕುಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    map_hospital_name: "ಅಪೊಲೊ ಮೆಟ್ರೋ ಸೂಪರ್ ಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆ",
    map_address_title: "ಕ್ಯಾಂಪಸ್ ವಿಳಾಸ ಮತ್ತು ಸಂಪರ್ಕ",
    map_coordinates_label: "ಜಿಪಿಎಸ್ ನಿರ್ದೇಶಾಂಕಗಳು:",
    map_assigned_ward_title: "ನಿಮ್ಮ ನಿಗದಿಪಡಿಸಿದ ವಾರ್ಡ್ ಮತ್ತು ಕೊಠಡಿ",
    map_floor_dir_title: "ಆಸ್ಪತ್ರೆ ಮಹಡಿ ವಿವರ ಮತ್ತು ವಿಭಾಗಗಳು",

    // Ambulance Information
    amb_title: "೨೪x೭ ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ಟ್ರಾಮಾ ಸೇವೆ",
    amb_subtitle: "ಬೆಂಗಳೂರಿನಾದ್ಯಂತ ಸಂಪೂರ್ಣ ಸುಸಜ್ಜಿತ ಐಸಿಯು ಮೊಬೈಲ್ ಘಟಕಗಳು, ಟ್ರಾಮಾ ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ಶಿಶು ಆರೈಕೆ ವಾಹನಗಳು ಲಭ್ಯ.",
    amb_hotline_label: "೨೪x೭ ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಹಾಯವಾಣಿ:",
    amb_request_btn: "ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ವಾಹನ ಕಳುಹಿಸಲು ವಿನಂತಿಸಿ",
    amb_col_vehicle: "ಆಂಬ್ಯುಲೆನ್ಸ್ ವಾಹನ ಸಂಖ್ಯೆ",
    amb_col_type: "ಮಾದರಿ ಮತ್ತು ಸಲಕರಣೆಗಳು",
    amb_col_crew: "ಚಾಲಕ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಮೊಬೈಲ್",
    amb_col_status: "ಸ್ಥಿತಿ ಮತ್ತು ಪ್ರಸ್ತುತ ಸ್ಥಳ",
    amb_call_driver: "ಚಾಲಕರಿಗೆ ಕರೆ ಮಾಡಿ",
    amb_modal_title: "ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಕಳುಹಿಸುವ ವಿನಂತಿ",
    amb_modal_desc: "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಸ್ಥಳಕ್ಕೆ ಅಥವಾ ಆಸ್ಪತ್ರೆ ಗೇಟ್‌ಗೆ ತಕ್ಷಣವೇ ಆಂಬ್ಯುಲೆನ್ಸ್ ವಾಹನವನ್ನು ನಿಯೋಜಿಸಲಾಗುತ್ತದೆ.",
    amb_condition_label: "ರೋಗಿಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿ:",
    amb_pickup_label: "ಪಿಕಪ್ ಸ್ಥಳ / ವಿಳಾಸ / ಕೊಠಡಿ:",
    amb_btn_dispatch: "ದೃಢೀಕರಿಸಿ & ತಕ್ಷಣ ಆಂಬ್ಯುಲೆನ್ಸ್ ಕಳುಹಿಸಿ",

    // Google Assistant
    asst_header: "ಗೂಗಲ್ ಆರೋಗ್ಯ ಸಹಾಯಕ",
    asst_kannada_hint: "ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ",
    asst_greeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್‌ಕೇರ್ ಆರೋಗ್ಯ ಸಹಾಯಕ. ನೀವು ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಬಹುದು ಅಥವಾ ಟೈಪ್ ಮಾಡಬಹುದು. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    asst_chip_next_med: "💊 ನನ್ನ ಮುಂದಿನ ಔಷಧಿ ಯಾವುದು ಮತ್ತು ಯಾವಾಗ?",
    asst_chip_doctor: "👨‍⚕️ ನನ್ನ ವೈದ್ಯರು ಯಾರು ಮತ್ತು ಕೊಠಡಿ ಯಾವುದು?",
    asst_chip_vitals: "🩺 ನನ್ನ ಇತ್ತೀಚಿನ ಬಿಪಿ ಮತ್ತು ಆರೋಗ್ಯ ಸ್ಥಿತಿ ಏನು?",
    asst_chip_room: "🛏️ ನನ್ನ ಕೊಠಡಿ ಮತ್ತು ಹಾಸಿಗೆ ಸಂಖ್ಯೆ ಯಾವುದು?",
    asst_chip_ambulance: "🚑 ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಂಖ್ಯೆಗಳು",
    asst_chip_book: "📅 ವೈದ್ಯರ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ",
    asst_input_placeholder: "ಔಷಧಿ, ವೈದ್ಯರು, ಕೊಠಡಿ, ಬಿಪಿ ಅಥವಾ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಕೇಳಿ...",
    asst_listening: "ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ",
    asst_voice_error: "ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಪ್ರಾರಂಭವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.",
    asst_speak_btn: "ಧ್ವನಿ ಉತ್ತರ",

    // Doctor Module
    doc_attending: "ತಪಾಸಣಾ ಹಿರಿಯ ವೈದ್ಯರು",
    doc_btn_update_hours: "ಸಮಯ ಮತ್ತು ಕೊಠಡಿ ನವೀಕರಿಸಿ",
    doc_tab_requests: "ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ವಿನಂತಿಗಳು ಮತ್ತು ಸಮಾಲೋಚನೆ",
    doc_tab_prescribe: "ಔಷಧಿ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಬರೆಯಿರಿ",
    doc_tab_vitals: "ರೋಗಿಗಳ ಕ್ಲಿನಿಕಲ್ ವೈಟಲ್ಸ್ ಮಾನಿಟರ್",
    doc_rx_title: "ಹೊಸ ಔಷಧಿ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ನೀಡಿ",
    doc_rx_subtitle: "ಇಲ್ಲಿ ಉಳಿಸಿದ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು ತಕ್ಷಣವೇ ನರ್ಸ್‌ನ ವೇಳಾಪಟ್ಟಿಗೆ ಮತ್ತು ರೋಗಿಯ ಜ್ಞಾಪನೆಗಳಿಗೆ ಸಿಂಕ್ ಆಗುತ್ತವೆ.",
    doc_rx_patient: "ರೋಗಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    doc_rx_med_name: "ಔಷಧಿ ಹೆಸರು ಮತ್ತು ವಿಧ (ಮಾತ್ರೆ, ಸಿರಪ್, ಇಂಜೆಕ್ಷನ್)",
    doc_rx_dosage: "ಪ್ರಮಾಣ (ಡೋಸೇಜ್)",
    doc_rx_frequency: "ಆವರ್ತನ",
    doc_rx_meal: "ಆಹಾರ ಸಂಬಂಧ",
    doc_rx_timings: "ಸೇವಿಸಬೇಕಾದ ಸಮಯ(ಗಳು)",
    doc_rx_start: "ಪ್ರಾರಂಭ ದಿನಾಂಕ",
    doc_rx_end: "ಅಂತಿಮ ದಿನಾಂಕ",
    doc_rx_inst: "ರೋಗಿಗೆ ವೈದ್ಯರ ನಿಖರ ಸೂಚನೆಗಳು",
    doc_rx_care: "ನರ್ಸ್ ಮತ್ತು ಆರೈಕೆದಾರರಿಗೆ ಹೆಚ್ಚುವರಿ ಸೂಚನೆಗಳು",
    doc_rx_save: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಉಳಿಸಿ & ರೋಗಿ/ನರ್ಸ್‌ಗೆ ತಿಳಿಸಿ",

    // Nurse Module
    nurse_senior: "ಹಿರಿಯ ಸಿಬ್ಬಂದಿ ಶುಶ್ರೂಷಕಿ (ನರ್ಸ್)",
    nurse_assigned_inpatients: "ನಿಯೋಜಿತ ರೋಗಿಗಳು",
    nurse_tab_meds: "ಔಷಧಿ ನೀಡುವ ವೇಳಾಪಟ್ಟಿ",
    nurse_tab_vitals: "ರೋಗಿಯ ಆರೋಗ್ಯ ವೈಟಲ್ಸ್ ನವೀಕರಿಸಿ",
    nurse_tab_beds: "ವಾರ್ಡ್ ಹಾಸಿಗೆ ಸ್ಥಿತಿ",
    nurse_checklist_title: "ಇಂದಿನ ರೋಗಿಗಳಿಗೆ ಔಷಧಿ ನೀಡುವ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",
    nurse_checklist_sub: "ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಪ್ರಕಾರ ನೀಡಲಾದ ಡೋಸ್‌ಗಳನ್ನು ದೃಢೀಕರಿಸಿ",
    nurse_btn_administer: "ಔಷಧಿ ನೀಡಿದೆ ಎಂದು ದೃಢೀಕರಿಸಿ",
    nurse_vitals_title: "ರೋಗಿಯ ಕ್ಲಿನಿಕಲ್ ವೈಟಲ್ಸ್ ದಾಖಲಿಸಿ",
    nurse_vitals_sub: "ತಾಪಮಾನ, ಬಿಪಿ, ನಾಡಿಮಿಡಿತ, ಆಮ್ಲಜನಕ ಮತ್ತು ಶುಶ್ರೂಷಾ ಟಿಪ್ಪಣಿಗಳನ್ನು ವೈದ್ಯರಿಗೆ ಮತ್ತು ಕುಟುಂಬಕ್ಕೆ ತಕ್ಷಣ ರವಾನಿಸಲಾಗುತ್ತದೆ.",
    nurse_btn_save_vitals: "ಆರೋಗ್ಯ ವಿವರ ಉಳಿಸಿ & ವೈದ್ಯರಿಗೆ ತಿಳಿಸಿ",

    // Caregiver Module
    care_title: "ಕುಟುಂಬದ ಆರೈಕೆದಾರ",
    care_monitoring: "ಆರೈಕೆ ಪಡೆಯುತ್ತಿರುವ ರೋಗಿ:",
    care_btn_staff_alert: "ಆಸ್ಪತ್ರೆ ಸಿಬ್ಬಂದಿಗೆ ತುರ್ತು ಕರೆ",
    care_feed_title: "ಔಷಧಿ ಸೇವನೆಯ ಲೈವ್ ಅಪ್‌ಡೇಟ್",
    care_care_plan: "ವೈದ್ಯರ ಆರೈಕೆ ಯೋಜನೆ ಮತ್ತು ಸೂಚನೆಗಳು",

    // Admin Module
    admin_title: "ಆಸ್ಪತ್ರೆ ಆಡಳಿತ ಮಂಡಳಿ",
    admin_btn_add_doctor: "ಹೊಸ ವೈದ್ಯರನ್ನು ನೋಂದಾಯಿಸಿ",
    admin_btn_add_staff: "+ ಹೊಸ ಸಿಬ್ಬಂದಿ ನೋಂದಾಯಿಸಿ",
    admin_tab_staff: "👥 ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ ವಿವರ",
    admin_tab_hospitals: "🏥 ಆಸ್ಪತ್ರೆಗಳು & ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್",
    admin_tab_doc_reg: "👨‍⚕️ ವೈದ್ಯರ ನೋಂದಣಿ",
    admin_tab_nurse_reg: "👩‍⚕️ ನರ್ಸ್ ನೋಂದಣಿ",
    admin_tab_care_reg: "🤝 ಆರೈಕೆದಾರರ ನೋಂದಣಿ",
    admin_tab_patients: "👤 ನೋಂದಾಯಿತ ರೋಗಿಗಳು",
    admin_patient_directory_title: "ನೋಂದಾಯಿತ ರೋಗಿಗಳ ವಿವರ",
    admin_patient_directory_subtitle: "ನೋಂದಾಯಿತ ರೋಗಿಗಳು, ಪರಿಶೀಲಿಸಿದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗಳು ಮತ್ತು ಆಸ್ಪತ್ರೆ ಹಾಸಿಗೆ ನಿಗದಿಪಡಿಸುವಿಕೆಗಳ ಕೇಂದ್ರೀಕೃತ ಡೈರೆಕ್ಟರಿ.",
    otp_sent_msg: "ನಿಜವಾದ 6-ಅಂಕಿಯ ಒಟಿಪಿಯನ್ನು SMS ಮೂಲಕ ಕಳುಹಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು 5 ನಿಮಿಷಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.",
    otp_verified_msg: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ!",
    admin_setup_title: "ಆಡಳಿತ ಮಂಡಳಿ ಪ್ರಾರಂಭಿಕ ಸಂರಚನೆ",
    admin_setup_locked: "ಆಡಳಿತ ಮಂಡಳಿ ಖಾತೆ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ",
    admin_tab_db_reset: "🗄️ ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ & ರೀಸೆಟ್",
    admin_tab_doctors: "ವೈದ್ಯರ ನಿರ್ವಹಣೆ",
    admin_tab_beds: "ಹಾಸಿಗೆ ಮತ್ತು ಕೊಠಡಿ ನಿರ್ವಹಣೆ",
    admin_tab_apts: "ಸಮಗ್ರ ಆಸ್ಪತ್ರೆ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಳು",
    admin_tab_audit: "ತುರ್ತು ಎಸ್‌ಒಎಸ್ ಮತ್ತು ಆಡಿಟ್ ಲಾಗ್‌ಗಳು",

    // Hospitals & Google Maps
    hosp_section_title: "ಆಸ್ಪತ್ರೆ ನೋಂದಣಿ ಮತ್ತು ಗೂಗಲ್ ಮ್ಯಾಪ್ ಸ್ಥಳ ನಿರ್ಧಾರ",
    hosp_section_subtitle: "ಸ್ಥಳ ಹುಡುಕಾಟ ಮತ್ತು ನೈಜ ಜಿಪಿಎಸ್ ನಿರ್ದೇಶಾಂಕಗಳೊಂದಿಗೆ ಆಸ್ಪತ್ರೆಗಳನ್ನು ನೋಂದಾಯಿಸಿ.",
    hosp_name_label: "ಆಸ್ಪತ್ರೆಯ ಹೆಸರು",
    hosp_address_label: "ಆಸ್ಪತ್ರೆಯ ವಿಳಾಸ (ಸ್ಥಳ ಹುಡುಕಾಟ)",
    hosp_phone_label: "ಸಂಪರ್ಕ ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    hosp_email_label: "ಅಧಿಕೃತ ಇಮೇಲ್ ವಿಳಾಸ",
    hosp_hours_label: "ಕಾರ್ಯನಿರ್ವಹಣಾ ಸಮಯ (ಉದಾ. 24/7 ಅಥವಾ 08:00 AM - 08:00 PM)",
    hosp_lat_label: "ಅಕ್ಷಾಂಶ (Latitude)",
    hosp_lng_label: "ರೇಖಾಂಶ (Longitude)",
    hosp_map_picker_hint: "ವಿಳಾಸ ಹುಡುಕಿ ಅಥವಾ ನಕ್ಷೆಯಲ್ಲಿ ಪಿನ್ ಅನ್ನು ಎಳೆಯಿರಿ.",
    hosp_btn_save: "ಆಸ್ಪತ್ರೆಯನ್ನು ಡೇಟಾಬೇಸ್‌ಗೆ ಉಳಿಸಿ",
    hosp_btn_reset: "ಫಾರ್ಮ್ ತೆರವುಗೊಳಿಸಿ",
    hosp_list_title: "ನೋಂದಾಯಿತ ಆಸ್ಪತ್ರೆಗಳ ಪಟ್ಟಿ",

    doc_section_title: "ವೈದ್ಯರ ನೋಂದಣಿ (ಆಡಳಿತ ಮಾತ್ರ)",
    doc_section_subtitle: "ಸಮಾಲೋಚನಾ ಕೊಠಡಿಗಳು, ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಆಸ್ಪತ್ರೆ ಸಹಯೋಗದೊಂದಿಗೆ ವೈದ್ಯರನ್ನು ನೋಂದಾಯಿಸಿ.",
    doc_field_name: "ವೈದ್ಯರ ಹೆಸರು (Dr. ನೊಂದಿಗೆ)",
    doc_field_mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಒಟಿಪಿ ಲಾಗಿನ್ ಮತ್ತು ಸಂಪರ್ಕ)",
    doc_field_email: "ವೈದ್ಯರ ಇಮೇಲ್ ವಿಳಾಸ",
    doc_field_spec: "ವೈದ್ಯಕೀಯ ಪರಿಣತಿ",
    doc_field_hospital: "ಸಂಯೋಜಿತ ಆಸ್ಪತ್ರೆ",
    doc_field_room: "ಸಮಾಲೋಚನಾ ಕೊಠಡಿ ಸಂಖ್ಯೆ",
    doc_field_days: "ಲಭ್ಯವಿರುವ ದಿನಗಳು (ಉದಾ. ಸೋಮ, ಬುಧ, ಶುಕ್ರ)",
    doc_field_time: "ಲಭ್ಯವಿರುವ ಸಮಯ (ಉದಾ. 09:00 AM - 01:00 PM)",
    doc_btn_save: "ವೈದ್ಯರನ್ನು ನೋಂದಾಯಿಸಿ",

    nurse_section_title: "ನರ್ಸ್ ನೋಂದಣಿ (ಆಡಳಿತ ಮಾತ್ರ)",
    nurse_section_subtitle: "ನಿಯೋಜಿತ ವಿಭಾಗ, ಕರ್ತವ್ಯ ಪಾಳಿ ಮತ್ತು ಆಸ್ಪತ್ರೆಯೊಂದಿಗೆ ನರ್ಸ್‌ಗಳನ್ನು ನೋಂದಾಯಿಸಿ.",
    nurse_field_name: "ನರ್ಸ್ ಹೆಸರು",
    nurse_field_mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಒಟಿಪಿ ಲಾಗಿನ್ ಮತ್ತು ಸಂಪರ್ಕ)",
    nurse_field_email: "ನರ್ಸ್ ಇಮೇಲ್ ವಿಳಾಸ",
    nurse_field_hospital: "ಸಂಯೋಜಿತ ಆಸ್ಪತ್ರೆ",
    nurse_field_dept: "ಶುಶ್ರೂಷಾ ವಿಭಾಗ (ಉದಾ. ಐಸಿಯು, ತುರ್ತು)",
    nurse_field_shift: "ಕರ್ತವ್ಯ ಸಮಯ / ಪಾಳಿ",
    nurse_btn_save: "ನರ್ಸ್ ನೋಂದಾಯಿಸಿ",

    care_section_title: "ಆರೈಕೆದಾರರ ನೋಂದಣಿ (ಆಡಳಿತ ಮಾತ್ರ)",
    care_section_subtitle: "ಆರೈಕೆ ಸೇವೆಗಳೊಂದಿಗೆ ಸಮರ್ಪಿತ ಆರೈಕೆದಾರರನ್ನು ನೋಂದಾಯಿಸಿ.",
    care_field_name: "ಆರೈಕೆದಾರರ ಹೆಸರು",
    care_field_mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಒಟಿಪಿ ಲಾಗಿನ್)",
    care_field_email: "ಆರೈಕೆದಾರರ ಇಮೇಲ್ ವಿಳಾಸ",
    care_field_hospital: "ಸಂಯೋಜಿತ ಆಸ್ಪತ್ರೆ",
    care_field_timing: "ಲಭ್ಯವಿರುವ ಸಮಯ",
    care_field_services: "ಒದಗಿಸುವ ಸೇವೆಗಳು (ಉದಾ. ವೃದ್ಧರ ಆರೈಕೆ)",
    care_btn_save: "ಆರೈಕೆದಾರರನ್ನು ನೋಂದಾಯಿಸಿ",

    nav_get_directions: "ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ (GET DIRECTIONS)",
    nav_select_hospital: "ಆಸ್ಪತ್ರೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    nav_no_hospitals: "ಯಾವುದೇ ಆಸ್ಪತ್ರೆಗಳು ಇನ್ನೂ ನೋಂದಣಿಯಾಗಿಲ್ಲ. ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ನೋಂದಾಯಿಸಿ.",

    db_backup_title: "ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ & ರೀಸೆಟ್",
    db_backup_subtitle: "ಅಪ್ಲಿಕೇಶನ್ ಸಂರಚನೆಯನ್ನು ಉಳಿಸಿಕೊಂಡು ಸಂಪೂರ್ಣ ಜೈಸನ್ ಬ್ಯಾಕಪ್ ಪಡೆಯಿರಿ ಅಥವಾ ಪರೀಕ್ಷಾ ಡೇಟಾವನ್ನು ಅಳಿಸಿ.",
    db_btn_backup: "ಸಂಪೂರ್ಣ ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    db_btn_reset: "ಎಲ್ಲಾ ಪರೀಕ್ಷಾ ಡೇಟಾವನ್ನು ರೀಸೆಟ್ ಮಾಡಿ",
    admin_auth_title: "ಆಸ್ಪತ್ರೆ ಆಡಳಿತ ಮಂಡಳಿ ದೃಢೀಕರಣ",
    admin_auth_subtitle: "ಆಡಳಿತ ನಿಯಂತ್ರಣಗಳನ್ನು ಪ್ರವೇಶಿಸಲು ಅಧಿಕೃತ ರುಜುವಾತುಗಳನ್ನು ನಮೂದಿಸಿ.",

    // Centralized Staff Management
    staff_title: "ಕೇಂದ್ರೀಕೃತ ಆಸ್ಪತ್ರೆ ಸಿಬ್ಬಂದಿ ವಿವರ",
    staff_subtitle: "ವೈದ್ಯರು, ನರ್ಸ್‌ಗಳು ಮತ್ತು ಆರೈಕೆದಾರರ ಒಂದು ಬಾರಿಯ ಶಾಶ್ವತ ನೋಂದಣಿ ಮತ್ತು ನಕಲು ತಡೆಗಟ್ಟುವ ವ್ಯವಸ್ಥೆ.",
    staff_search_placeholder: "ಹೆಸರು, ಮೊಬೈಲ್ ಅಥವಾ ಐಡಿ ಮೂಲಕ ಹುಡುಕಿ...",
    staff_filter_all: "ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ",
    staff_filter_doctors: "ವೈದ್ಯರು",
    staff_filter_nurses: "ಶುಶ್ರೂಷಕಿಯರು",
    staff_filter_caretakers: "ಆರೈಕೆದಾರರು",
    staff_col_id: "ಸಿಬ್ಬಂದಿ ಐಡಿ",
    staff_col_name: "ಸಿಬ್ಬಂದಿ ಹೆಸರು & ಪಾತ್ರ",
    staff_col_mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    staff_col_dept: "ವಿಭಾಗ / ಪರಿಣತಿ",
    staff_col_station: "ಕೊಠಡಿ / ಶಿಫ್ಟ್ / ನಿಗದಿಪಡಿಸಿದ ರೋಗಿ",
    staff_col_status: "ಸ್ಥಿತಿ",
    staff_col_actions: "ಕ್ರಿಯೆಗಳು (ಆಡಳಿತ ಮಾತ್ರ)",
    staff_btn_add: "+ ಹೊಸ ಸಿಬ್ಬಂದಿ ನೋಂದಾಯಿಸಿ",
    staff_modal_add_title: "ಹೊಸ ಸಿಬ್ಬಂದಿ ಸದಸ್ಯರನ್ನು ನೋಂದಾಯಿಸಿ",
    staff_modal_edit_title: "ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ",
    staff_modal_desc: "ವೈದ್ಯಕೀಯ ಸಿಬ್ಬಂದಿಯ ಒಂದು ಬಾರಿಯ ನೋಂದಣಿ. ಎಲ್ಲಾ ಆಸ್ಪತ್ರೆ ಮಾಡ್ಯೂಲ್‌ಗಳಿಗೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಿಂಕ್ ಆಗುತ್ತದೆ.",
    staff_field_role: "ಸಿಬ್ಬಂದಿ ಪಾತ್ರ",
    staff_field_name: "ಪೂರ್ಣ ಹೆಸರು (ಗೌರವಾರ್ಥ ಬಿರುದಿನೊಂದಿಗೆ)",
    staff_field_mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಒಟಿಪಿ ಲಾಗಿನ್ ಮತ್ತು ಸಂಪರ್ಕ)",
    staff_field_spec: "ವೈದ್ಯಕೀಯ ಪರಿಣತಿ (ವೈದ್ಯರು)",
    staff_field_qual: "ವಿದ್ಯಾರ್ಹತೆ",
    staff_field_exp: "ಅನುಭವ (ವರ್ಷಗಳು)",
    staff_field_room: "ಒಪಿಡಿ ಕೊಠಡಿ ಸಂಖ್ಯೆ",
    staff_field_timings: "ಸಮಾಲೋಚನೆ ಸಮಯ",
    staff_field_dept: "ಶುಶ್ರೂಷಾ ವಿಭಾಗ",
    staff_field_shift: "ಕರ್ತವ್ಯ ಶಿಫ್ಟ್ ಸಮಯ",
    staff_field_ward: "ನಿಯೋಜಿತ ವಾರ್ಡ್",
    staff_field_rel: "ರೋಗಿಯೊಂದಿಗಿನ ಸಂಬಂಧ (ಆರೈಕೆದಾರ)",
    staff_field_patient: "ನಿಯೋಜಿತ ರೋಗಿಯ ಹೆಸರು & ಹಾಸಿಗೆ",
    staff_save_btn: "ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಉಳಿಸಿ",
    staff_delete_confirm: "ಈ ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.",

    // Auth Modal
    auth_title: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯ ಒಟಿಪಿ ಲಾಗಿನ್",
    auth_desc: "ರೋಗಿಗಳು ಮತ್ತು ಸಿಬ್ಬಂದಿ ಕೇವಲ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಬಳಸಿ ಸುರಕ್ಷಿತವಾಗಿ ಲಾಗಿನ್ ಆಗಬಹುದು. ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ.",
    auth_label_role: "ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    auth_label_phone: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಕಂಟ್ರಿ ಕೋಡ್ ಸಹಿತ)",
    auth_btn_send_otp: "ಪರಿಶೀಲನಾ ಕೋಡ್ (OTP) ಕಳುಹಿಸಿ",
    auth_quick_test: "ಅಥವಾ ಪರೀಕ್ಷಾರ್ಥವಾಗಿ ೧-ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಲಾಗಿನ್ ಆಗಿ:",
    auth_otp_info: "ಈ ಕೆಳಗಿನ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ ಕಳುಹಿಸಲಾದ ೬-ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ:",
    auth_otp_label: "೬-ಅಂಕಿಯ ಒಟಿಪಿ ನಮೂದಿಸಿ",
    auth_btn_verify: "ದೃಢೀಕರಿಸಿ & ಲಾಗಿನ್ ಆಗಿ",
    auth_btn_back: "← ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ ಹಿಂತಿರುಗಿ"
  }
};

class I18nManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('smartcare_lang') || 'en';
    this.translations = SMARTCARE_TRANSLATIONS;
  }

  getLang() {
    return this.currentLanguage;
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('smartcare_lang', lang);
      document.documentElement.lang = lang;
      this.applyTranslations();
      console.log(`[i18n] Language changed to: ${lang}`);
      
      // Dispatch custom event so reactive UI pieces can update
      window.dispatchEvent(new CustomEvent('smartcare_lang_changed', { detail: { lang } }));
    }
  }

  toggleLanguage() {
    const nextLang = this.currentLanguage === 'en' ? 'kn' : 'en';
    this.setLanguage(nextLang);
    return nextLang;
  }

  t(key, fallback = '') {
    const dict = this.translations[this.currentLanguage] || this.translations['en'];
    return dict[key] !== undefined ? dict[key] : (fallback || key);
  }

  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && this.translations[this.currentLanguage]?.[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) {
            el.placeholder = this.t(key);
          }
        } else {
          el.innerText = this.t(key);
        }
      }
    });

    // Update language toggle button label in header
    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = `🌐 ${this.t('lang_toggle')}`;
    }

    const langBadge = document.getElementById('current-lang-indicator');
    if (langBadge) {
      langBadge.innerText = this.t('current_lang_label');
    }
  }
}

window.SMARTCARE_I18N = new I18nManager();
