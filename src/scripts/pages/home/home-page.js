import L from 'leaflet';
import { createStoryItemTemplate } from '../../template';
import { MAP_SERVICE_API_KEY } from '../../config';
import { getLocationName } from '../../utils/location-helper';
import HomeModel from '../../models/home-model';
import HomePagePresenter from './home-presenter';

class HomePage {
  constructor() {
    this._model = new HomeModel();
    this._view = new HomePageView();
    this._presenter = new HomePagePresenter({
      view: this._view,
      model: this._model,
    });
  }

  async render() {
    await this._view.render();
    
    // Verifikasi elemen yang diperlukan sudah ada
    const storiesContainer = document.querySelector('#stories');
    const mapContainer = document.getElementById('map-container');
    
    if (!storiesContainer || !mapContainer) {
      console.error('Required DOM elements not found after render');
      // Coba render ulang jika elemen tidak ditemukan
      await this._view.render();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verifikasi sekali lagi
      const retryStoriesContainer = document.querySelector('#stories');
      const retryMapContainer = document.getElementById('map-container');
      
      if (!retryStoriesContainer || !retryMapContainer) {
        console.error('Required DOM elements still not found after retry');
        return; // Keluar dari fungsi jika masih tidak ditemukan
      }
    }
    
    // Panggil presenter untuk mengambil data
    await this._presenter.showStories();
  }

  destroy() {
    this._view.destroy();
  }
}

class HomePageView {
  constructor() {
    this._mainContent = document.querySelector('#mainContent');
    this._maps = new Map(); // Tetap simpan untuk kompatibilitas
    this._stories = [];
    this._map = null; // Untuk menyimpan instance peta tunggal
    this._currentMapProvider = localStorage.getItem('selectedMapProvider') || 'maptiler'; // Ambil dari localStorage
    
    // Definisi provider peta yang tersedia
    this._mapProviders = {
      maptiler: {
        url: `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAP_SERVICE_API_KEY}`,
        attribution: '© MapTiler © OpenStreetMap contributors',
        maxZoom: 18
      },
      openstreetmap: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }
    };
  }

  showLoading() {
    this._mainContent.innerHTML =
      '<div class="loading" role="alert" aria-live="polite">Loading...</div>';
  }

  showError(message) {
    this._mainContent.innerHTML = `
      <div class="error-container" role="alert">
        <h2>Error</h2>
        <p>${message}</p>
      </div>
    `;
  }

  redirectToLogin() {
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 2000);
  }

  async render() {
    this._mainContent.innerHTML = `
      <section class="content">
        <div class="map-controls">
          <div class="map-provider-buttons">
            <button 
              type="button" 
              class="map-provider-btn ${this._currentMapProvider === 'maptiler' ? 'active' : ''}" 
              data-provider="maptiler"
            >
              MapTiler
            </button>
            <button 
              type="button" 
              class="map-provider-btn ${this._currentMapProvider === 'openstreetmap' ? 'active' : ''}" 
              data-provider="openstreetmap"
            >
              OpenStreetMap
            </button>
          </div>
        </div>
        <div id="map-container" class="map-container"></div>
        <h2>Bagikan Cerita Anda</h2>
        <div class="stories" id="stories"></div>
      </section>
    `;
  
    // Tambahkan event listener untuk tombol provider
    const mapProviderButtons = document.querySelectorAll('.map-provider-btn');
    mapProviderButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        // Hapus class active dari semua tombol
        mapProviderButtons.forEach(btn => btn.classList.remove('active'));
        // Tambahkan class active ke tombol yang diklik
        e.target.classList.add('active');
        
        this._currentMapProvider = e.target.dataset.provider;
        localStorage.setItem('selectedMapProvider', this._currentMapProvider);
        this._initializeMap();
      });
    });
  
    // Tunggu hingga DOM benar-benar dirender
    return new Promise(resolve => {
      // Gunakan MutationObserver untuk memastikan elemen sudah ada di DOM
      const observer = new MutationObserver(() => {
        const storiesContainer = document.querySelector('#stories');
        const mapContainer = document.getElementById('map-container');
        
        if (storiesContainer && mapContainer) {
          observer.disconnect();
          resolve();
        }
      });
      
      observer.observe(this._mainContent, { childList: true, subtree: true });
      
      // Fallback timeout jika MutationObserver tidak mendeteksi perubahan
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 500);
    });
  }

  _renderStories() {
    const storiesContainer = document.querySelector('#stories');
    if (!storiesContainer) {
      console.error('Stories container not found');
      return; // Keluar dari fungsi jika elemen tidak ditemukan
    }
    
    storiesContainer.innerHTML = '';

    this._stories.forEach((story) => {
      storiesContainer.innerHTML += createStoryItemTemplate(story);
    });
  }

  renderStories(stories) {
    this._stories = stories;
    this._renderStories();
    // Inisialisasi peta setelah render stories
    requestAnimationFrame(() => {
      setTimeout(() => this._initializeMap(), 100);
    });
  }

  async _initializeMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    // Hapus instance map lama jika ada
    if (this._map) {
      this._map.remove();
    }

    // Inisialisasi peta dengan opsi yang lebih lengkap
    this._map = L.map(mapContainer).setView([-2.5489, 118.0149], 5); // Posisi default di Indonesia

    // Ambil konfigurasi provider yang dipilih
    const provider = this._mapProviders[this._currentMapProvider];

    // Tambahkan tile layer sesuai provider yang dipilih
    L.tileLayer(
      provider.url,
      {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      },
    ).addTo(this._map);

    // Tambahkan marker untuk setiap story yang memiliki lokasi
    const markers = [];
    for (const story of this._stories) {
      if (story.lat && story.lon) {
        try {
          const marker = L.marker([story.lat, story.lon])
            .addTo(this._map)
            .bindPopup(`
              <div>
                <h3>${story.name}</h3>
                <img src="${story.photoUrl}" alt="${story.name}" class="photo-click-provider">
                <p>${story.description.substring(0, 50)}...</p>
                <a href="#/stories/${story.id}">Read More</a>
              </div>
            `);
          
          markers.push({
            marker,
            lat: story.lat,
            lon: story.lon
          });

          // Tambahkan event listener untuk marker
          marker.on('click', () => {
            this._map.setView([story.lat, story.lon], 13);
          });
        } catch (error) {
          console.error(`Error adding marker for story ${story.id}:`, error);
        }
      }
    }

    // Jika ada marker, sesuaikan tampilan peta untuk menampilkan semua marker
    if (markers.length > 0) {
      const group = L.featureGroup(markers.map(m => m.marker));
      this._map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  destroy() {
    // Bersihkan peta utama
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
    
    // Bersihkan maps lama jika ada
    this._maps.forEach((map) => {
      if (map) {
        map.remove();
      }
    });
    this._maps.clear();
  }
}

export default HomePage;
