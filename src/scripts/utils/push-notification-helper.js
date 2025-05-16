const PushNotificationHelper = {
  // Ganti dengan public key dari server Anda
  vapidPublicKey: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk',

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported in the browser');
      return null;
    }

    try {
      // Cek apakah service worker sudah terdaftar
      const registrations = await navigator.serviceWorker.getRegistrations();
      let swRegistration = null;
      
      for (const registration of registrations) {
        if (registration.active && registration.active.scriptURL.includes('sw.bundle.js')) {
          swRegistration = registration;
          console.log('Service Worker already registered');
          return swRegistration; // Return langsung jika sudah terdaftar
        }
      }
      
      // Jika belum terdaftar, daftarkan service worker
      if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.register('/sw.bundle.js');
        console.log('Service worker registered: ', swRegistration);
      }
      
      return swRegistration;
    } catch (error) {
      console.error('Failed to register service worker', error);
      return null;
    }
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    if (result === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    if (result === 'default') {
      console.log('Notification permission canceled');
      return false;
    }

    return true;
  },

  // Mengubah base64 string menjadi Uint8Array
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

  async subscribe(registration) {
    try {
      const subscribed = await this._isAlreadySubscribed(registration);
      if (subscribed) {
        console.log('Already subscribed');
        return;
      }

      const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('Subscribed to push service:', subscription);

      // Di sini Anda bisa mengirim subscription ke server
      // await this._sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe push notification', error);
    }
  },

  async unsubscribe(registration) {
    const subscription = await this._getSubscription(registration);
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notification');
    } catch (error) {
      console.error('Failed to unsubscribe push notification', error);
    }
  },

  async _getSubscription(registration) {
    return await registration.pushManager.getSubscription();
  },

  async _isAlreadySubscribed(registration) {
    const subscription = await this._getSubscription(registration);
    return !!subscription;
  },

  // Metode untuk mengirim subscription ke server
  async _sendSubscriptionToServer(subscription) {
    // Implementasi pengiriman subscription ke server
    console.log('Sending subscription to server:', subscription);
  },
};

export default PushNotificationHelper;