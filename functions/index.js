/**
 * SMARTCARE – Firebase Cloud Functions
 * Automated Cron Medication Reminders, Appointment Updates, and Emergency SOS Alerts
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled Cron Function: Runs every 15 minutes
 * Checks for upcoming medications and sends automated push notifications to patients & nurses.
 */
exports.checkScheduledMedicationReminders = functions.pubsub
  .schedule('every 15 minutes')
  .timeZone('Asia/Kolkata') // Modify to your local timezone
  .onRun(async (context) => {
    console.log('[Cloud Function] Checking scheduled medication reminders...');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
      // Query today's pending medication logs
      const snapshot = await db.collection('medicationLogs')
        .where('scheduledDate', '==', todayStr)
        .where('status', '==', 'pending')
        .get();

      if (snapshot.empty) {
        console.log('No pending medication reminders found for this window.');
        return null;
      }

      const reminders = [];
      snapshot.forEach(doc => {
        reminders.push({ id: doc.id, ...doc.data() });
      });

      console.log(`Found ${reminders.length} pending medication reminders.`);

      // Dispatch FCM Push Notifications for each pending reminder
      for (const item of reminders) {
        // Fetch patient profile to get device FCM token
        const patientDoc = await db.collection('users').doc(item.patientId).get();
        if (patientDoc.exists) {
          const patientData = patientDoc.data();
          const fcmToken = patientData.fcmToken;

          if (fcmToken) {
            const message = {
              token: fcmToken,
              notification: {
                title: `Medicine Reminder: ${item.medicineName}`,
                body: `Scheduled Time: ${item.slot}. Instructions: ${item.notes || 'Take as advised by your doctor.'}`
              },
              data: {
                type: 'medication',
                logId: item.id,
                medicineName: item.medicineName,
                patientId: item.patientId,
                click_action: '/'
              }
            };

            await admin.messaging().send(message);
            console.log(`FCM reminder sent to patient ${patientData.name} for ${item.medicineName}`);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error executing scheduled medication reminders:', error);
      return null;
    }
  });

/**
 * Firestore Trigger: Appointment Status Change
 * Dispatches an automated push notification to the patient when doctor confirms or rejects appointment.
 */
exports.onAppointmentStatusChange = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if status changed
    if (beforeData.status !== afterData.status) {
      const patientId = afterData.patientId;
      const doctorName = afterData.doctorName;
      const status = afterData.status;

      console.log(`Appointment ${context.params.appointmentId} status changed from ${beforeData.status} to ${status}`);

      try {
        const patientDoc = await db.collection('users').doc(patientId).get();
        if (patientDoc.exists) {
          const patient = patientDoc.data();
          if (patient.fcmToken) {
            const message = {
              token: patient.fcmToken,
              notification: {
                title: `Appointment ${status.toUpperCase()}!`,
                body: `Your appointment with ${doctorName} on ${afterData.appointmentDate} at ${afterData.timeSlot} is now ${status}.`
              },
              data: {
                appointmentId: context.params.appointmentId,
                status: status,
                type: 'appointment'
              }
            };
            await admin.messaging().send(message);
            console.log(`Status notification sent to patient ${patient.name}`);
          }
        }
      } catch (err) {
        console.error('Error dispatching appointment status notification:', err);
      }
    }
    return null;
  });

/**
 * Firestore Trigger: Emergency SOS Alert
 * Whenever an emergency notification is created, broadcast immediate high-priority push notifications to hospital staff.
 */
exports.onEmergencyAlert = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();

    if (notification.type === 'emergency') {
      console.log('EMERGENCY ALERT TRIGGERED:', notification.title);

      try {
        // Broadcast to "emergency_broadcast" FCM topic
        const payload = {
          topic: 'emergency_broadcast',
          notification: {
            title: `🚨 ${notification.title}`,
            body: notification.body
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'emergency_alerts'
            }
          },
          data: {
            type: 'emergency',
            notifId: context.params.notificationId,
            timestamp: new Date().toISOString()
          }
        };

        await admin.messaging().send(payload);
        console.log('Emergency alert successfully broadcast to hospital staff topic.');
      } catch (err) {
        console.error('Error sending emergency FCM broadcast:', err);
      }
    }
    return null;
  });
