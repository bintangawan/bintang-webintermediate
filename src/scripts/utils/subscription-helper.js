import { BASE_URL, VAPID_PUBLIC_KEY } from '../config';
import ApiService from '../data/api-service';

const SubscriptionHelper = {
  async subscribePushNotification() {
    try {
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      const pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY
        ),
      });

      const response = await ApiService.subscribeNotification({
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(
            null, new Uint8Array(pushSubscription.getKey('p256dh'))
          )),
          auth: btoa(String.fromCharCode.apply(
            null, new Uint8Array(pushSubscription.getKey('auth'))
          )),
        },
      });

      console.log('Push notification subscription success:', response);
      return response;
    } catch (error) {
      console.error('Failed to subscribe push notification:', error);
      throw error;
    }
  },

  async unsubscribePushNotification() {
    try {
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        const response = await ApiService.unsubscribeNotification(subscription.endpoint);
        await subscription.unsubscribe();
        console.log('Push notification unsubscription success:', response);
        return response;
      }
      
      return { error: false, message: 'No subscription found' };
    } catch (error) {
      console.error('Failed to unsubscribe push notification:', error);
      throw error;
    }
  },

  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  },
};

export default SubscriptionHelper;