import { BASE_URL, VAPID_PUBLIC_KEY } from '../config';
import ApiService from '../data/api-service';

const PushNotificationHelper = {
  // Konfigurasi
  vapidPublicKey: VAPID_PUBLIC_KEY || 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk',

  // ===== Service Worker Management =====
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker tidak didukung di browser ini');
      return null;
    }

    try {
      // Cek apakah service worker sudah terdaftar
      const registrations = await navigator.serviceWorker.getRegistrations();
      let swRegistration = null;
      
      for (const registration of registrations) {
        if (registration.active && registration.active.scriptURL.includes('sw.bundle.js')) {
          swRegistration = registration;
          console.log('Service Worker sudah terdaftar');
          return swRegistration;
        }
      }
      
      // Jika belum terdaftar, daftarkan service worker
      if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.register('/sw.bundle.js');
        console.log('Service Worker berhasil didaftarkan:', swRegistration);
      }
      
      return swRegistration;
    } catch (error) {
      console.error('Gagal mendaftarkan service worker:', error);
      return null;
    }
  },

  // ===== Notification Permission =====
  async requestPermission() {
    if (!this._checkAvailability()) {
      console.log('Notifikasi tidak didukung di browser ini');
      return false;
    }

    const result = await Notification.requestPermission();
    if (result === 'denied') {
      console.log('Izin notifikasi ditolak');
      return false;
    }

    if (result === 'default') {
      console.log('Permintaan izin notifikasi dibatalkan');
      return false;
    }

    return true;
  },

  _checkAvailability() {
    return 'Notification' in window;
  },

  _checkPermission() {
    return Notification.permission === 'granted';
  },

  // ===== Push Subscription Management =====
  async subscribe(registration) {
    try {
      const subscribed = await this._isAlreadySubscribed(registration);
      if (subscribed) {
        console.log('Sudah berlangganan notifikasi');
        return subscribed;
      }

      const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('Berhasil berlangganan push service:', subscription);

      // Kirim subscription ke server
      await this._sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Gagal berlangganan push notification:', error);
      throw error;
    }
  },

  async unsubscribe(registration) {
    try {
      const subscription = await this._getSubscription(registration);
      if (!subscription) {
        console.log('Tidak ada langganan yang ditemukan');
        return { error: false, message: 'Tidak ada langganan yang ditemukan' };
      }

      // Hapus subscription dari server
      await ApiService.unsubscribeNotification(subscription.endpoint);
      
      // Hapus subscription dari browser
      await subscription.unsubscribe();
      console.log('Berhasil berhenti berlangganan push notification');
      
      return { error: false, message: 'Berhasil berhenti berlangganan' };
    } catch (error) {
      console.error('Gagal berhenti berlangganan push notification:', error);
      throw error;
    }
  },

  async _getSubscription(registration) {
    return await registration.pushManager.getSubscription();
  },

  async _isAlreadySubscribed(registration) {
    const subscription = await this._getSubscription(registration);
    return subscription;
  },

  // ===== Notification Display =====
  async sendNotification({ title, options }) {
    if (!this._checkAvailability()) {
      console.log('Notifikasi tidak didukung di browser ini');
      return;
    }

    if (!this._checkPermission()) {
      console.log('Pengguna belum memberikan izin notifikasi');
      await this.requestPermission();
      return;
    }

    await this._showNotification({ title, options });
  },

  async _showNotification({ title, options }) {
    try {
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      await serviceWorkerRegistration.showNotification(title, options);
    } catch (error) {
      console.error('Gagal menampilkan notifikasi:', error);
    }
  },

  // ===== Utility Functions =====
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  // ===== Server Communication =====
  async _sendSubscriptionToServer(subscription) {
    try {
      const response = await ApiService.subscribeNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(
            null, new Uint8Array(subscription.getKey('p256dh'))
          )),
          auth: btoa(String.fromCharCode.apply(
            null, new Uint8Array(subscription.getKey('auth'))
          )),
        },
      });
      console.log('Subscription berhasil dikirim ke server:', response);
      return response;
    } catch (error) {
      console.error('Gagal mengirim subscription ke server:', error);
      throw error;
    }
  },
};

export default PushNotificationHelper;