/**
 * SMARTCARE – Clean Application Database Schema & Template
 * 
 * All previous demo/test records have been cleared per user instruction.
 * Database starts completely clean. Hospital Administrator registers
 * Hospitals, Doctors, Nurses, and Caregivers via the Admin Dashboard.
 */

const INITIAL_MOCK_DATA = {
  // Empty user records (Patients register via Access Portal)
  users: [],

  // Hospitals Directory (Admin registers hospitals with Google Maps locations)
  hospitals: [],

  // Doctors Directory (Admin registers doctors linked to registered hospitals)
  doctors: [],

  // Centralized Staff Directory (Admin registers nurses and caregivers)
  staff: [],

  // Clinical Prescriptions (Issued by attending doctors for registered patients)
  prescriptions: [],

  // Medication Administration Logs & Schedules
  medicationLogs: [],

  // Patient Outpatient Appointments
  appointments: [],

  // Bedside Clinical Vitals
  vitals: [],

  // Hospital Bed Allocations
  beds: [],

  // Emergency Ambulances
  ambulances: [],

  // System Notifications
  notifications: []
};

window.INITIAL_MOCK_DATA = INITIAL_MOCK_DATA;
