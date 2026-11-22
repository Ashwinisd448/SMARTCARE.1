# SMARTCARE – Smart Healthcare Management System
### Modern, Responsive, Multi-Role Healthcare Management Platform
#### 🌐 Supports English & Kannada (ಕನ್ನಡ) • 🤖 Google Health Voice Assistant • 📍 Google Maps Campus Locator • 🚑 24x7 Ambulance Hub

Built with **HTML5, CSS3, JavaScript, Firebase Phone Authentication (OTP), Cloud Firestore, Firebase Cloud Messaging (FCM), Cloud Functions, and Firebase Hosting**.

---

## 🌟 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features & User Roles](#-key-features--user-roles)
3. [Multilingual & AI Highlights](#-multilingual--ai-highlights)
   - [Bilingual Kannada & English Support](#bilingual-kannada--english-support)
   - [Google Health Assistant (Voice & Chat AI)](#google-health-assistant-voice--chat-ai)
   - [Hospital Campus Location & Google Maps](#hospital-campus-location--google-maps)
   - [24x7 Emergency Ambulance Fleet & Dispatch](#24x7-emergency-ambulance-fleet--dispatch)
4. [Technology Stack](#-technology-stack)
5. [Project Structure](#-project-structure)
6. [Quick Start (Run Locally in 5 Seconds)](#-quick-start-run-locally-in-5-seconds)
7. [Step-by-Step Firebase Setup Guide](#-step-by-step-firebase-setup-guide)
   - [Step 1: Create a Firebase Project](#step-1-create-a-firebase-project)
   - [Step 2: Enable Phone Authentication](#step-2-enable-phone-authentication)
   - [Step 3: Enable Cloud Firestore](#step-3-enable-cloud-firestore)
   - [Step 4: Enable Firebase Cloud Messaging (FCM)](#step-4-enable-firebase-cloud-messaging-fcm)
   - [Step 5: Configure `js/config.js`](#step-5-configure-jsconfigjs)
   - [Step 6: Deploy Firebase Cloud Functions](#step-6-deploy-firebase-cloud-functions)
   - [Step 7: Deploy to Firebase Hosting](#step-7-deploy-to-firebase-hosting)
8. [Hackathon Live Demo Script (For Judges)](#-hackathon-live-demo-script-for-judges)
9. [Beginner Customization Guide](#-beginner-customization-guide)

---

## 🏥 Project Overview
**SMARTCARE** is an enterprise-grade, mobile-responsive smart healthcare management application designed to bridge the communication gap between patients, doctors, nurses, family caregivers, and hospital administration.

### Why SMARTCARE?
- **Zero-Password Phone Authentication**: Patients and staff log in with OTP sent to their mobile phones—no email or complex passwords required.
- **Multilingual Kannada & English**: 1-click instant language toggle between English and ಕನ್ನಡ across all dashboards, medicine schedules, and voice interactions.
- **Interactive Google Health Assistant**: Patients can speak or type in Kannada or English to ask about upcoming medications, doctors, room allocation, vitals, or dispatching an ambulance.
- **Google Maps Integration**: View hospital location, assigned patient room & bed on campus, and open turn-by-turn driving directions in Google Maps.
- **24x7 Emergency Ambulance Hub**: Real-time fleet tracking of mobile ICU units, trauma ambulances, driver direct call buttons, and simulated emergency dispatch with ETA countdown.
- **Medication Adherence Engine**: Doctors prescribe medicines with custom dosages and meal timings. Patients and nurses receive automated alarms and push notifications at the exact scheduled dosage times.
- **Real-Time Clinical Vitals Tracking**: Nurses log bedside vitals (Temperature, Blood Pressure, Pulse, SpO2). High fever or critical vitals immediately trigger automated alerts to attending physicians.
- **Caregiver Peace of Mind**: Family caregivers can remotely track their loved one's vital trends and verify whether medicines were taken.
- **Instant Emergency SOS**: A single tap on the SOS button sounds a hospital-wide siren and dispatches an emergency notification to the nurse station and attending doctor.

---

## 🗣️ Multilingual & AI Highlights

### Bilingual Kannada & English Support
- Built-in `js/i18n.js` engine powers dynamic language switching.
- Toggle between **English** and **ಕನ್ನಡ** with the header button (`🌐 ಕನ್ನಡ`).
- Automatically translates navigation tabs, medicine timings, doctor instructions, vital signs, appointment booking forms, and system alerts.

### Google Health Assistant (Voice & Chat AI)
- Floating Google Assistant launcher on mobile and desktop with Google's iconic 4-color pulse indicator.
- **Speech-to-Text Recognition**: Supports speaking in Kannada (`kn-IN`) and English (`en-IN` / `en-US`).
- **Text-to-Speech Output (TTS)**: Reads out answers naturally with voice mute/unmute control.
- **Interactive Intelligent Solver**: Answers patient questions about:
  - *When is my next medicine?* / *ನನ್ನ ಮುಂದಿನ ಔಷಧಿ ಯಾವಾಗ?*
  - *Who is my doctor and room?* / *ನನ್ನ ವೈದ್ಯರು ಯಾರು ಮತ್ತು ಕೊಠಡಿ ಯಾವುದು?*
  - *What are my latest vitals?* / *ನನ್ನ ಬಿಪಿ ಮತ್ತು ತಾಪಮಾನ ಎಷ್ಟು?*
  - *Where is my room & bed?* / *ನನ್ನ ಕೊಠಡಿ ಮತ್ತು ಹಾಸಿಗೆ ಸಂಖ್ಯೆ ಯಾವುದು?*
  - *Emergency ambulance numbers* / *ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಂಖ್ಯೆಗಳು*

### Hospital Campus Location & Google Maps
- Dedicated **"Hospital Location & Map"** tab in the patient dashboard.
- Interactive embedded Google Map displaying Apollo Metro Super Specialty Hospital (Bannerghatta Road, Bengaluru).
- **Assigned Patient Bed Locator**: Highlights Room 204, Bed B-02 in Cardiology Ward A (2nd Floor).
- One-click **"Open Driving Directions in Google Maps"** navigation button.
- Comprehensive 4-floor directory (Emergency Trauma, OPD Suites, Inpatient Wards, ICU).

### 24x7 Emergency Ambulance Fleet & Dispatch
- Dedicated Ambulance Directory tracking 4 specialized units:
  1. **KA-05-HA-1081**: Advanced Cardiac Life Support (ACLS) Mobile ICU. Driver: Manjunath K. (`+91 98450 11223`).
  2. **KA-05-HA-1082**: Basic Life Support (BLS) Trauma Ambulance. Driver: Suresh Gowda (`+91 98450 44556`).
  3. **KA-05-HA-1083**: Neonatal & Pediatric Intensive Care (NICU) Unit. Driver: Chethan Kumar (`+91 98450 77889`).
  4. **KA-05-HA-1084**: Mobile Critical ICU & Ventilator Unit. Driver: Raghavendra Hegde (`+91 98450 99001`).
- Direct click-to-call buttons (`tel:...`).
- Interactive **"Request Emergency Ambulance Dispatch"** form with simulated GPS dispatch, audible emergency siren, and live ETA tracking!

---

## 🔐 Multi-Role Registration, Username Indexing & Zero-Photo Architecture

### 1. 5-Role Registration Workflow
SMARTCARE implements a clear, centralized role onboarding architecture:
- **Patient Self-Registration**: Patients can register themselves directly from the Access Portal by choosing a unique `@username`, full name, mobile number, age, gender, blood group, and emergency contact.
- **Admin Self-Registration**: Hospital Administrators can register directly with their admin handle `@username`, administrator name, mobile number, and hospital facility name.
- **Doctor, Nurse & Caregiver Registration (Admin-Only)**:
  - *Per requirement ("once registration of doctor nurses andcaregivers by admine")*, staff members **cannot self-register publicly**.
  - All Doctors, Nurses, and Caregivers/Caretakers are entered **one time only by the Hospital Administrator** through the **Admin Dashboard > Staff Management** portal (`+ Register Staff Member`).
  - The Admin assigns each staff member a unique staff username (e.g. `dr_ramesh`, `nurse_anita`), mobile number, qualifications, and ward/clinic station.
  - For Caregivers, the Admin links the specific patient's `@username` (e.g. `johndoe`) to allow dedicated family monitoring.
  - Staff can then sign in using their assigned username or mobile number + OTP.

### 2. Patient Data Indexed by Username (`patientUsername`)
- All clinical and healthcare records are permanently tied to and queryable by the patient's unique username handle:
  - **Prescriptions**: Issued to `patientUsername` by attending doctors.
  - **Medication Logs**: Dose reminders and adherence logs are created and filtered by `patientUsername`.
  - **Appointments**: Consultation bookings and schedules are linked directly to `patientUsername`.
  - **Clinical Vitals**: Bedside temperature, BP, pulse, and SpO2 records are tied to `patientUsername`.
  - **Caregiver Monitoring**: Caregivers automatically receive real-time feeds based on their assigned `patientUsername`.

### 3. Zero Profile Photos Architecture
- *Per requirement ("dont add any photos to profile")*:
  - **No external photos or image URLs** are used anywhere in the application.
  - Profiles, identity cards, hero headers, staff tables, and appointment cards use **sleek, stylized SVG initials badges** (e.g., `JD`, `AM`, `👨‍⚕️`, `👩‍⚕️`, `🤝`, `🛡️`).
  - Every user's identity is clearly denoted by their stylized initials badge and their `@username` handle.
  - This guarantees **instant zero-latency loading**, avoids broken image URLs/CORS issues, and respects patient and medical staff privacy.

---

## 👥 Key Features & User Roles

### 1. 👤 Patient Module
- **Mobile Number OTP Login**: Fast registration and login using Firebase Phone Auth.
- **Personal Profile**: Hospital admission status, Ward, Allocated Room & Bed Number, Attending Physician.
- **Medicine Reminders**:
  - Daily dosage schedule (Morning, Afternoon, Night) with doctor's meal instructions.
  - Interactive **"Mark as Taken"** button and live adherence compliance score (e.g., 85%).
  - Upcoming and past reminder history.
- **Doctor Appointment Booking**:
  - Filter doctors by department (Cardiology, Neurology, General Medicine, Orthopedics).
  - View doctor qualification, experience, OPD consultation room, and available slots.
  - Request slot, view confirmation status (`Pending`, `Confirmed`, `Completed`, `Cancelled`).
  - Option to cancel appointments.
- **Push Notifications**: Receive audible reminder chimes and web push notifications at dosage times.

### 2. 👨‍⚕️ Doctor Module
- **Profile & Availability Management**: Set OPD consultation room, available working days, and consultation hours.
- **Appointment Management**: View incoming patient requests, review symptoms, accept or reject slots, mark consultations completed.
- **Digital Prescription Pad**:
  - Issue prescriptions with medicine name, dosage, frequency, meal instructions (Before/After food), start and end dates.
  - Doctor's specific instructions for the patient.
  - Additional care instructions for nurses.
  - Saving a prescription instantly updates the Patient reminder timeline and Nurse administration task list!
- **Clinical Vitals Monitor**: Real-time view of bedside vitals logged by ward nurses.

### 3. 👩‍⚕️ Nurse Module
- **Inpatient Medication Administration Schedule**:
  - Real-time time-slotted checklist for admitted patients.
  - Displays Bed Number, Patient Name, Medicine, Dosage, and Doctor's special notes.
  - **"Confirm Administered"** button records nurse signature, notes, and exact timestamp.
- **Bedside Vitals Logger**:
  - Select patient and record Condition (`Stable`, `Observation`, `Critical`), Temperature (°F), Blood Pressure (mmHg), Pulse (bpm), SpO2 (%), and clinical nursing notes.
  - Critical vitals automatically sound an alarm and dispatch an alert to the doctor!
- **Ward Bed Status Overview**: Visual directory of ward beds and patient allocations.

### 4. 🤝 Caregiver Module
- **Remote Patient Health Monitoring**: Track elderly or admitted family members remotely.
- **Live Vitals Dashboard**: Temperature, Blood Pressure, Heart Rate, and Oxygen levels with normal/warning indicators.
- **Medication Adherence Feed**: Real-time confirmation log showing when doses were taken by the patient or administered by the nurse.
- **Emergency SOS Call**: Immediate alert link to hospital duty staff.

### 5. 🏥 Hospital Administrator Module
- **Executive Analytics Dashboard**: Total Doctors, Registered Patients, Inpatient Bed Occupancy Rate %, Today's Adherence %.
- **Doctor Registry**: Add new doctors, edit profiles, assign consultation suites.
- **Bed & Room Management**: Visual ward grid (General Ward, ICU, Semi-Private). Allocate beds to incoming patients or discharge/vacate beds with one click.
- **Hospital-Wide Appointments Master List**: Comprehensive oversight of all department schedules.
- **Real-Time Audit & Emergency Logs**: Complete activity stream of SOS triggers and clinical events.

---

## 🛠 Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Structure** | HTML5 | Clean semantic markup, accessible forms, PWA-ready |
| **Styling** | CSS3 & Tailwind CSS | Responsive, mobile-first, clinical dark/glassmorphic UI |
| **Interactivity** | Vanilla JavaScript (ES6+) | Modular, event-driven, zero external framework overhead |
| **Authentication** | Firebase Phone Auth | Mobile OTP verification with Google reCAPTCHA |
| **Database** | Firebase Cloud Firestore | NoSQL real-time document store with offline persistence |
| **Push Notifications**| Firebase Cloud Messaging (FCM) | Background push alerts + Web Audio API synthesizer chimes |
| **Backend Automation**| Firebase Cloud Functions | Scheduled cron reminder job + Firestore document triggers |
| **Hosting** | Firebase Hosting | Fast global CDN deployment |

---

## 📁 Project Structure

```
brain wave/
│
├── index.html                   # Main application interface with all 5 role dashboards & modals
├── manifest.json                # PWA manifest for adding SMARTCARE to mobile home screens
├── firebase.json                # Firebase Hosting and Functions configuration
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Database indexes configuration
├── firebase-messaging-sw.js     # FCM Service Worker for background push notifications
│
├── css/
│   └── style.css                # Healthcare theme, glassmorphism cards, badges, SOS pulse animation
│
├── js/
│   ├── config.js                # Firebase configuration & auto demo-mode detector
│   ├── i18n.js                  # Multilingual translation engine (English & Kannada)
│   ├── mockData.js              # Seed data for doctors, patients, prescriptions, vitals, beds, ambulances
│   ├── db.js                    # Dual-engine Firestore database service with local reactive store
│   ├── auth.js                  # Firebase Phone Auth service & role switcher
│   ├── fcm.js                   # Web Push Notifications & Web Audio chime engine
│   └── app.js                   # Main application controller, tab switching, and event handlers
│
└── functions/
    ├── index.js                 # Cloud Functions (Cron reminder check, Appointment alerts, SOS broadcast)
    └── package.json             # Cloud functions dependencies
```

---

## ⚡ Quick Start (Run Locally in 5 Seconds)

Because SMARTCARE features an intelligent **Zero-Setup Demo Engine**, you can run and present the entire system **immediately** even before configuring Firebase keys!

### Option 1: Simple Web Server (Recommended)
Open your terminal in the project directory and run:
```bash
npx serve -l 3000 .
```
Then open [http://localhost:3000](http://localhost:3000) in your web browser.

### Option 2: Direct Browser Open
Simply double-click `index.html` or open it with VS Code Live Server!

> **Demo Test Profiles Ready Out of the Box:**
> - **Patient**: John Doe (`+91 98765 43210`)
> - **Doctor**: Dr. Sarah Jenkins (`+91 98765 43211`)
> - **Nurse**: Sister Anita Sharma (`+91 98765 43212`)
> - **Caregiver**: Robert Doe (`+91 98765 43213`)
> - **Admin**: Dr. Arvind Mehta (`+91 98765 43214`)
> 
> *In Demo Mode, OTP code for any phone number is `123456`.*

---

## 🚀 Step-by-Step Firebase Setup Guide

Follow these steps to connect your live Firebase backend:

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and name it `smartcare` (or any name you prefer).
3. Disable Google Analytics (optional for hackathons) and click **"Create Project"**.

### Step 2: Enable Phone Authentication
1. In the Firebase Console left sidebar, click **Build > Authentication**.
2. Click **"Get Started"** and select the **"Sign-in method"** tab.
3. Select **"Phone"** from the list of providers and toggle **"Enable"**.
4. *(Crucial Tip for Hackathon / Testing)*: Scroll down to **"Phone numbers for testing"**.
   - Add a test phone: `+91 9876543210` with test OTP: `123456`.
   - This lets you log in instantly without consuming your SMS quota or incurring any costs!
5. Click **"Save"**.

### Step 3: Enable Cloud Firestore
1. In the left sidebar, click **Build > Firestore Database**.
2. Click **"Create Database"**.
3. Choose a location closest to you and select **"Start in test mode"**.
4. Click **"Enable"**.

### Step 4: Enable Firebase Cloud Messaging (FCM)
1. In the left sidebar, click the **Gear Icon (Project Settings) > Cloud Messaging**.
2. Under **"Web configuration"**, scroll down to **"Web Push certificates"**.
3. Click **"Generate key pair"**.
4. Copy the public key (VAPID Key).

### Step 5: Configure `js/config.js`
1. In Project Settings > **General**, scroll to **"Your apps"** and click the Web icon (`</>`).
2. Register your app (e.g. `smartcare-web`) and copy your `firebaseConfig` snippet.
3. Open `js/config.js` and replace the placeholder keys:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-YourRealApiKeyHere...",
  authDomain: "smartcare-12345.firebaseapp.com",
  projectId: "smartcare-12345",
  storageBucket: "smartcare-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef...",
  vapidKey: "BElq...YourVapidKeyHere..."
};
```
4. Also update the `firebaseConfig` object at the top of `firebase-messaging-sw.js`.

### Step 6: Deploy Firebase Cloud Functions
1. Install Firebase CLI globally if you haven't already:
```bash
npm install -g firebase-tools
```
2. Log in to Firebase:
```bash
firebase login
```
3. Initialize functions and install dependencies:
```bash
cd functions
npm install
cd ..
```
4. Deploy the functions:
```bash
firebase deploy --only functions
```

### Step 7: Deploy to Firebase Hosting
Deploy your application to a free, global HTTPS URL:
```bash
firebase deploy --only hosting
```
Your app will be live at `https://<YOUR_PROJECT_ID>.web.app`!

---

## 🎤 Hackathon Live Demo Script (For Judges)

When presenting SMARTCARE to hackathon evaluators or jury members, use this 2-minute flow:

1. **The Hook (Problem Statement)**:
   > *"In modern healthcare, medication non-adherence and communication breakdown between doctors, nurses, and family members lead to critical readmissions. SMARTCARE solves this with a real-time, zero-password mobile ecosystem."*

2. **Step 1: Patient Appointment Booking**:
   - Start in **Patient** mode (John Doe).
   - Click **"Book Appointment"**, select **Dr. Sarah Jenkins (Cardiology)**, choose a slot, and click **Confirm**.
   - Show how the appointment status appears as `Pending`.

3. **Step 2: Doctor Reviews & Prescribes**:
   - Tap **"👨‍⚕️ Doctor"** in the top Quick Switch bar.
   - Point out the incoming appointment request. Click **"Accept Slot"**.
   - Switch to the **"Prescribe Medicine"** tab. Prescribe **"Atorvastatin 20mg"** with **Night (08:00 PM)** timing and click **"Save Prescription"**.

4. **Step 3: Nurse Administers Medication & Records Vitals**:
   - Tap **"👩‍⚕️ Nurse"** in the top bar.
   - Show how the newly prescribed medicine is already queued in the **Administration Schedule**! Click **"Confirm Administered"**.
   - Switch to **"Update Patient Health Vitals"**, enter Temp: 98.6°F, BP: 120/80, SpO2: 98%, and click **Record Update**.

5. **Step 4: Caregiver Remote Peace of Mind**:
   - Tap **"🤝 Caregiver"** in the top bar.
   - Show how the live vitals and medication confirmation are visible in real time to the family member at home!

6. **Step 5: Emergency SOS Siren & Hospital Admin**:
   - Tap the pulsating red **"EMERGENCY SOS"** button.
   - Hear the synthesized emergency tone and see the emergency alert broadcast!
   - Tap **"🏥 Admin"** to show the hospital overview with doctor registry, bed allocations, and system audit logs.

---

## 🎨 Beginner Customization Guide

### How to add a new Doctor:
1. Log in as **Admin**.
2. Click **"Add New Doctor"**.
3. Fill in the name, specialization, qualification, mobile, and OPD room number.
4. The doctor will immediately appear across all appointment booking menus!

### How to add a new Hospital Ward or Bed:
Open `js/mockData.js` and add an entry to the `beds` array:
```javascript
{ 
  id: "bed_108", 
  ward: "Pediatric Ward", 
  roomNumber: "Room 301", 
  bedNumber: "Bed P-01", 
  status: "available", 
  patientId: null, 
  patientName: null 
}
```

---

## 📄 License
This project is open-source and released under the **MIT License**.
Developed for high-impact healthcare innovation.
