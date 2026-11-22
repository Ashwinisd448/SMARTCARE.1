/**
 * SMARTCARE – Firebase Cloud Messaging (FCM) & Notification Manager
 * Handles Web Push, Service Worker, Web Audio Chimes, and In-App Toast Alerts
 */

class FCMNotificationManager {
  constructor() {
    this.audioCtx = null;
    this.fcmToken = null;
    this.isServiceWorkerRegistered = false;
    this.initServiceWorker();
  }

  // Initialize Web Audio Context on first user interaction
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Synthesize gentle audio chime for reminders and distinct siren for emergency
   */
  playNotificationSound(type = 'medication') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'emergency') {
        // High urgency pulsating siren
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(587, now + 0.2);
        osc.frequency.linearRampToValueAtTime(880, now + 0.4);
        osc.frequency.linearRampToValueAtTime(587, now + 0.6);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      } else {
        // Pleasant hospital reminder chime (C5 -> E5 -> G5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.3); // G5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Audio playback could not be started without user interaction', e);
    }
  }

  /**
   * Register Firebase Messaging Service Worker
   */
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
        this.isServiceWorkerRegistered = true;
        console.log('[SMARTCARE FCM] Service Worker registered with scope:', registration.scope);

        // If live Firebase configured, request token
        if (window.SMARTCARE_CONFIG?.isFirebaseConfigured()) {
          this.initFirebaseMessaging(registration);
        }
      } catch (err) {
        console.log('[SMARTCARE FCM] Service Worker registration note:', err.message);
      }
    }
  }

  /**
   * Initialize FCM live token retrieval
   */
  async initFirebaseMessaging(registration) {
    const messaging = window.SMARTCARE_CONFIG?.getMessaging();
    const vapidKey = window.SMARTCARE_CONFIG?.firebaseConfig?.vapidKey;

    if (messaging && vapidKey && vapidKey !== "YOUR_PUBLIC_VAPID_KEY") {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await messaging.getToken({
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration
          });
          this.fcmToken = token;
          console.log('[FCM] Device Token:', token);

          // Listen for foreground notifications
          messaging.onMessage((payload) => {
            console.log('[FCM] Foreground notification received:', payload);
            const title = payload.notification?.title || 'SMARTCARE Alert';
            const body = payload.notification?.body || '';
            this.triggerLocalAlert(title, body, payload.data?.type || 'medication');
          });
        }
      } catch (error) {
        console.warn('[FCM] Token acquisition notice:', error);
      }
    }
  }

  /**
   * Request native browser notification permission
   */
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showToast('Push Notifications Enabled!', 'You will receive timely medicine and appointment reminders.', 'success');
        return true;
      } else {
        this.showToast('Notifications Blocked', 'Please enable notifications in your browser settings to receive alerts.', 'warning');
        return false;
      }
    }
    return false;
  }

  /**
   * Trigger local notification alert with sound + native notification + in-app toast
   */
  triggerLocalAlert(title, body, type = 'medication') {
    this.playNotificationSound(type);

    // Show native system push notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966486.png',
          tag: 'smartcare-alert'
        });
      } catch (e) {
        // Fallback handled by toast
      }
    }

    // Always show clean in-app toast
    this.showToast(title, body, type === 'emergency' ? 'danger' : 'info');
  }

  /**
   * Modern UI Toast dispatcher
   */
  showToast(title, message, type = 'info') {
    let container = document.getElementById('smartcare-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'smartcare-toast-container';
      container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto transform transition-all duration-300 ease-out translate-y-[-10px] opacity-0 rounded-xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
      type === 'danger' || type === 'emergency'
        ? 'bg-red-950/90 border-red-500/50 text-red-100'
        : type === 'success'
        ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
        : type === 'warning'
        ? 'bg-amber-950/90 border-amber-500/50 text-amber-100'
        : 'bg-slate-900/95 border-sky-500/40 text-slate-100'
    }`;

    const iconSvg = type === 'danger' || type === 'emergency'
      ? `<svg class="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
      : type === 'success'
      ? `<svg class="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
      : `<svg class="w-6 h-6 text-sky-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`;

    toast.innerHTML = `
      ${iconSvg}
      <div class="flex-1">
        <h4 class="text-sm font-semibold tracking-wide">${title}</h4>
        <p class="text-xs text-slate-300 mt-1 leading-relaxed">${message}</p>
      </div>
      <button class="text-slate-400 hover:text-white transition-colors" onclick="this.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-[-10px]', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => toast.remove(), 400);
    }, 6000);
  }
}

window.SMARTCARE_FCM = new FCMNotificationManager();
