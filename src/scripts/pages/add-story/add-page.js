import L from 'leaflet';
import { MAP_SERVICE_API_KEY } from '../../config';
import StoryModel from '../../models/story-model';
import AddStoryPresenter from './add-presenter';
import PushNotificationHelper from '../../utils/push-notification-helper';

class AddStoryPage {
  constructor() {
    this._model = new StoryModel();
    this._view = new AddStoryView();
    this._presenter = new AddStoryPresenter({
      view: this._view,
      model: this._model,
    });
  }

  async render() {
    await this._view.render();
  }

  destroy() {
    this._view.destroy();
  }
}

class AddStoryView {
  constructor() {
    this._mainContent = document.querySelector('#mainContent');
    this._map = null;
    this._marker = null;
    this._position = {
      lat: null,
      lng: null,
    };
    this._stream = null;
    this._isCameraActive = false;
    this._photo = null;
  }

  showLoading() {
    this._mainContent.innerHTML =
      '<div class="loading" role="alert" aria-live="polite">Loading...</div>';
  }

  showError(message) {
    alert(message);
  }

  showSuccess(message) {
    alert(message);
  }

  redirectToHome() {
    // Perbarui cache home page sebelum redirect
    if ('caches' in window) {
      caches.open('pages-cache').then((cache) => {
        cache.delete('/#/home');
        cache.add('/#/home');
      });
      
      // Perbarui cache API stories
      caches.open('api-cache').then((cache) => {
        cache.keys().then((keys) => {
          keys.forEach((request) => {
            if (request.url.includes('/stories') && !request.url.includes('/stories/')) {
              cache.delete(request);
            }
          });
        });
      });
    }
    
    // Tambahkan delay lebih lama untuk memastikan cache diperbarui
    setTimeout(() => {
      window.location.hash = '#/home';
    }, 2000);
  }
  
  // Perbarui method untuk mengirim notifikasi
  sendNotification({ title, body }) {
    PushNotificationHelper.sendNotification({
      title: title,
      options: {
        body: body,
        icon: '/images/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
          url: '/#/home',
        },
      },
    });
  }

  async render() {
    this._mainContent.innerHTML = `
      <section class="content">
        <h2>Add Your Story</h2>
        <form id="addStoryForm" class="form">
          <div class="form__group">
            <label for="photo" class="form__label">Photo</label>
            <div class="camera-container">
              <video id="camera" class="camera" autoplay playsinline style="display: none;"></video>
              <canvas id="photoCanvas" style="display: none;"></canvas>
              <div class="camera-controls">
                <button type="button" id="toggleCamera" class="form__button">Open Camera</button>
                <button type="button" id="captureBtn" class="form__button" disabled>Capture Photo</button>
              </div>
              <div id="photoPreview" class="photo-preview"></div>
            </div>
          </div>
          <div class="form__group">
            <label for="description" class="form__label">Description</label>
            <textarea
              id="description"
              name="description"
              class="form__input"
              required
            ></textarea>
          </div>
          <div class="form__group">
            <label class="form__label">Location</label>
            <div class="location-info">
              <button type="button" id="getCurrentLocation" class="form__button">Get Current Location</button>
              <div class="coordinates">
                <p>Latitude: <span id="lat">-</span></p>
                <p>Longitude: <span id="lng">-</span></p>
              </div>
            </div>
            <div id="map" style="height: 300px; margin-top: 1rem;"></div>
          </div>
          <button type="submit" class="form__button">Post Story</button>
        </form>
      </section>
    `;

    await this._initMap();
    this._initEventListeners();
  }

  async _initMap() {
    try {
      // Default ke Indonesia
      const defaultPosition = [-2.548926, 118.014863];

      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('Map container not found');
        return;
      }

      // Pastikan container memiliki dimensi
      mapContainer.style.height = '300px';
      mapContainer.style.width = '100%';

      // Tunggu DOM update dengan waktu lebih lama
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Periksa apakah container masih ada di DOM setelah timeout
      if (!document.getElementById('map')) {
        console.error('Map container hilang setelah timeout');
        return;
      }

      // Inisialisasi peta dengan opsi yang lebih lengkap
      this._map = L.map('map', {
        center: defaultPosition,
        zoom: 4,
        zoomControl: true,
        attributionControl: true
      });
      
      // Perbaikan untuk masalah CORS dengan menambahkan mode: 'cors' dan crossOrigin
      const tileLayerUrl = `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAP_SERVICE_API_KEY}`;
      
      L.tileLayer(
        tileLayerUrl,
        {
          attribution: '© MapTiler © OpenStreetMap contributors',
          maxZoom: 18,
          crossOrigin: 'anonymous',
          tileSize: 512,
          zoomOffset: -1
        },
      ).addTo(this._map);

      // Invalidate size setelah peta dibuat untuk memastikan rendering yang benar
      setTimeout(() => {
        if (this._map) {
          this._map.invalidateSize();
        }
      }, 100);

      // Coba dapatkan lokasi user setelah map terinisialisasi
      try {
        const position = await this._getCurrentPosition();
        const { latitude, longitude } = position.coords;
        this._map.setView([latitude, longitude], 13);
        this._updatePosition(latitude, longitude);
      } catch (error) {
        console.error('Error getting location:', error);
        // Tampilkan pesan yang lebih baik untuk offline mode
        if (!navigator.onLine) {
          this.showError('Anda sedang offline. Lokasi tidak dapat dideteksi.');
        }
      }

      // Tambahkan event listener setelah map terinisialisasi
      if (this._map) {
        this._map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          this._updatePosition(lat, lng);
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  _getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }

  _updatePosition(lat, lng) {
    this._position = { lat, lng };

    // Update marker
    if (this._marker) {
      this._map.removeLayer(this._marker);
    }
    this._marker = L.marker([lat, lng]).addTo(this._map);

    // Set zoom level yang konsisten (13 untuk tampilan detail)
    this._map.setView([lat, lng], 13);

    // Update koordinat di UI
    document.querySelector('#lat').textContent = lat.toFixed(6);
    document.querySelector('#lng').textContent = lng.toFixed(6);
  }

  async _initCamera() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.querySelector('#camera');
      videoElement.srcObject = this._stream;
      videoElement.style.display = 'block';
      document.querySelector('#captureBtn').disabled = false;
      document.querySelector('#toggleCamera').textContent = 'Close Camera';
      this._isCameraActive = true;
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((track) => track.stop());
      this._stream = null;
    }
    const videoElement = document.querySelector('#camera');
    videoElement.srcObject = null;
    videoElement.style.display = 'none';
    document.querySelector('#captureBtn').disabled = true;
    document.querySelector('#toggleCamera').textContent = 'Open Camera';
    this._isCameraActive = false;
  }

  _initEventListeners() {
    const form = document.querySelector('#addStoryForm');
    const toggleCameraBtn = document.querySelector('#toggleCamera');
    const captureBtn = document.querySelector('#captureBtn');
    const video = document.querySelector('#camera');
    const canvas = document.querySelector('#photoCanvas');
    const getCurrentLocationBtn = document.querySelector('#getCurrentLocation');

    if (!form || !toggleCameraBtn || !captureBtn || !video || !canvas || !getCurrentLocationBtn) {
      console.error('Some elements not found in DOM');
      return; // Keluar dari fungsi jika ada elemen yang tidak ditemukan
    }

    toggleCameraBtn.addEventListener('click', () => {
      if (this._isCameraActive) {
        this._stopCamera();
      } else {
        this._initCamera();
      }
    });

    captureBtn.addEventListener('click', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        this._photo = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        const photoPreview = document.querySelector('#photoPreview');
        photoPreview.innerHTML = `<img src="${imageUrl}" alt="Captured photo" style="max-width: 100%;">`;
      }, 'image/jpeg');

      this._stopCamera();
    });

    getCurrentLocationBtn.addEventListener('click', async () => {
      try {
        const position = await this._getCurrentPosition();
        const { latitude, longitude } = position.coords;
        this._map.setView([latitude, longitude], 13);
        this._updatePosition(latitude, longitude);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    });

    // Form submit akan ditangani oleh presenter
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!this._photo) {
        this.showError('Please capture a photo first');
        return;
      }

      const description = document.querySelector('#description').value;

      // Panggil callback yang akan diset oleh presenter
      if (this._onSubmit) {
        this._onSubmit({
          description,
          photo: this._photo,
          lat: this._position.lat,
          lon: this._position.lng,
        });
      }
    });
  }

  setSubmitCallback(callback) {
    this._onSubmit = callback;
  }

  destroy() {
    // Pastikan kamera dimatikan
    if (this._isCameraActive) {
      this._stopCamera();
    }

    // Bersihkan map
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }
}

export default AddStoryPage;
