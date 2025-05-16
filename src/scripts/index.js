import 'regenerator-runtime';
import '../styles/styles.css';
import '../styles/responsives.css';
import Router from './routes/router';
import { ACCESS_TOKEN_KEY } from './config';
import DrawerInitiator from './utils/drawer-initiator';
import BackToTop from './utils/back-to-top';
import PushNotificationHelper from './utils/push-notification-helper';

class App {
  constructor() {
    this._router = new Router();
    this._initUserMenu();
    this._initServiceWorker();
    
    // Tambahkan event listener untuk perubahan hash
    window.addEventListener('hashchange', () => {
      this._initUserMenu();
    });
  }

  _initUserMenu() {
    const userMenu = document.querySelector('#userMenu');
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const currentHash = window.location.hash;
    
    // Cek apakah user sedang berada di halaman login atau register
    const isAuthPage = currentHash === '#/login' || currentHash === '#/register';

    if (token) {
      // Jika sudah login, tampilkan semua menu
      userMenu.innerHTML = `
        <a href="#/home" class="nav__link"><i class="fas fa-home"></i> Home</a>
        <a href="#/add" class="nav__link"><i class="fas fa-plus"></i> Add Story</a>
        <a href="#/bookmark" class="nav__link"><i class="fas fa-bookmark"></i> Bookmark</a>
        <a href="#" id="subscribe" class="nav__link"><i class="fas fa-bell"></i> Subscribe</a>
        <a href="#" id="logout" class="nav__link"><i class="fas fa-sign-out-alt"></i> Logout</a>
      `;
      
      document.querySelector('#logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.location.hash = '#/login';
      });
      
      // Tambahkan event listener untuk tombol subscribe
      const subscribeButton = document.querySelector('#subscribe');
      subscribeButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await this._handlePushNotificationSubscription();
      });
    } else if (isAuthPage) {
      // Jika di halaman login/register tapi belum login, tampilkan menu utama tanpa fitur yang memerlukan login
      userMenu.innerHTML = `
        <a href="#/home" class="nav__link"><i class="fas fa-home"></i> Home</a>
        <a href="#/add" class="nav__link"><i class="fas fa-plus"></i> Add Story</a>
        <a href="#/bookmark" class="nav__link"><i class="fas fa-bookmark"></i> Bookmark</a>
        <a href="#" id="subscribe" class="nav__link"><i class="fas fa-bell"></i> Subscribe</a>
        <a href="#" id="logout" class="nav__link"><i class="fas fa-sign-out-alt"></i> Logout</a>
      `;
    } else {
      // Jika di halaman lain dan belum login
      userMenu.innerHTML = `
        <a href="#/home" class="nav__link"><i class="fas fa-home"></i> Home</a>
        <a href="#/add" class="nav__link"><i class="fas fa-plus"></i> Add Story</a>
        <a href="#/bookmark" class="nav__link"><i class="fas fa-bookmark"></i> Bookmark</a>
        <a href="#" id="subscribe" class="nav__link"><i class="fas fa-bell"></i> Subscribe</a>
        <a href="#" id="logout" class="nav__link"><i class="fas fa-sign-out-alt"></i> Logout</a>
      `;  
    }
    
    // Update UI tombol subscribe berdasarkan status subscription
    this._updateSubscribeButtonUI();
  }
  
  async _initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported in the browser');
      return;
    }
    
    try {
      // Cek apakah service worker sudah terdaftar
      const registrations = await navigator.serviceWorker.getRegistrations();
      let swRegistration = null;
      
      for (const registration of registrations) {
        if (registration.active && registration.active.scriptURL.includes('sw.bundle.js')) {
          swRegistration = registration;
          console.log('Service Worker already registered');
          break;
        }
      }
      
      // Jika belum terdaftar, daftarkan service worker
      if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.register('/sw.bundle.js');
        console.log('Service Worker registered: ', swRegistration);
      }
      
      // Simpan registrasi untuk digunakan nanti
      this._swRegistration = swRegistration;
      
      // Update UI tombol subscribe berdasarkan status subscription
      this._updateSubscribeButtonUI();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  async _updateSubscribeButtonUI() {
    const subscribeButton = document.querySelector('#subscribe');
    if (!subscribeButton) return;
    
    try {
      if (!this._swRegistration) return;
      
      const isSubscribed = await PushNotificationHelper._isAlreadySubscribed(this._swRegistration);
      
      if (isSubscribed) {
        subscribeButton.innerHTML = '<i class="fas fa-bell-slash"></i> Unsubscribe';
        subscribeButton.classList.add('subscribed');
      } else {
        subscribeButton.innerHTML = '<i class="fas fa-bell"></i> Subscribe';
        subscribeButton.classList.remove('subscribed');
      }
    } catch (error) {
      console.error('Error updating subscribe button UI:', error);
    }
  }
  
  async _handlePushNotificationSubscription() {
    try {
      const isPermissionGranted = await PushNotificationHelper.requestPermission();
      if (!isPermissionGranted) {
        alert('Notification permission denied');
        return;
      }
      
      // Gunakan service worker yang sudah terdaftar
      if (!this._swRegistration) {
        // Jika belum ada, coba dapatkan dari navigator.serviceWorker.ready
        try {
          this._swRegistration = await navigator.serviceWorker.ready;
        } catch (error) {
          // Jika gagal, baru daftarkan service worker baru
          this._swRegistration = await PushNotificationHelper.registerServiceWorker();
        }
      }
      
      if (!this._swRegistration) {
        alert('Service worker registration failed');
        return;
      }
      
      const isSubscribed = await PushNotificationHelper._isAlreadySubscribed(this._swRegistration);
      
      if (isSubscribed) {
        // Unsubscribe
        await PushNotificationHelper.unsubscribe(this._swRegistration);
        alert('Unsubscribed from push notification');
      } else {
        // Subscribe
        await PushNotificationHelper.subscribe(this._swRegistration);
        alert('Subscribed to push notification');
      }
      
      // Update UI
      this._updateSubscribeButtonUI();
    } catch (error) {
      console.error('Error handling push notification subscription:', error);
      alert('Failed to process subscription: ' + error.message);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();

  // Inisialisasi drawer
  DrawerInitiator.init({
    button: document.querySelector('#hamburgerButton'),
    drawer: document.querySelector('#navigationDrawer'),
    content: document.querySelector('#mainContent'),
  });

  // Inisialisasi tombol Back to Top
  BackToTop.init();
});
