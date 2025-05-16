import L from 'leaflet';
import { createStoryDetailTemplate } from '../../template';
import { MAP_SERVICE_API_KEY } from '../../config';
import { getLocationName } from '../../utils/location-helper';
import HomeModel from '../../models/home-model';
import StoriesPagePresenter from './stories-presenter';

class StoriesPage {
  constructor() {
    this._model = new HomeModel();
    this._view = new StoriesPageView();
    this._presenter = new StoriesPagePresenter({
      view: this._view,
      model: this._model,
    });
  }

  async render(id) {
    await this._view.render();
    // Panggil presenter untuk mengambil data, bukan dari view sesuai kata reviewer
    await this._presenter.showStoryDetail(id);
  }

  destroy() {
    this._view.destroy();
  }
}

class StoriesPageView {
  constructor() {
    this._mainContent = document.querySelector('#mainContent');
    this._maps = new Map(); // Menggunakan Map collection seperti di home-page.js
    this._story = null;
    this._currentMapProvider = localStorage.getItem('selectedMapProvider') || 'maptiler'; // Mengambil dari localStorage
    
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
        <a href="#/home" class="form__button">Back to Home</a>
      </div>
    `;
  }

  setOnBookmarkClick(callback) {
    this._onBookmarkClick = callback;
  }

  async render() {
    // Render container dan tunggu sampai DOM diperbarui
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
        <div id="story-detail-container" class="story-detail-container"></div>
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
        
        // Reinisialisasi peta jika story sudah dimuat
        if (this._story && this._story.lat && this._story.lon) {
          this._initDetailMap();
        }
      });
    });

    // Pastikan DOM sudah diperbarui
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Method baru untuk redirect ke login
  redirectToLogin() {
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 2000);
  }

  // Method baru untuk menampilkan detail story yang diterima dari presenter
  async displayStoryDetail(story, isBookmarked) {
    if (!story) {
      throw new Error('Data cerita tidak ditemukan');
    }

    this._story = story;
    this._isBookmarked = isBookmarked;

    // Render story detail dan tunggu DOM diperbarui
    await this._renderStoryDetail();

    // Tunggu DOM update selesai
    if (this._story.lat && this._story.lon) {
      // Berikan waktu lebih lama untuk DOM diperbarui
      await new Promise((resolve) => setTimeout(resolve, 300));
      await this._initDetailMap();
    }
    this._initBookmarkButton();
  }

  _initBookmarkButton() {
    const bookmarkBtn = document.querySelector('#bookmark-btn');
    if (bookmarkBtn) {
      // Update tampilan tombol sesuai status bookmark
      this.updateBookmarkButton(this._isBookmarked);
      
      bookmarkBtn.addEventListener('click', () => {
        if (this._onBookmarkClick) {
          this._onBookmarkClick(this._story, this._isBookmarked);
        }
      });
    }
  }
  
  updateBookmarkButton(isBookmarked) {
    const bookmarkBtn = document.querySelector('#bookmark-btn');
    if (bookmarkBtn) {
      this._isBookmarked = isBookmarked;
      
      if (isBookmarked) {
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
        bookmarkBtn.classList.add('bookmarked');
      } else {
        bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Bookmark';
        bookmarkBtn.classList.remove('bookmarked');
      }
    }
  }

  // Hapus method fetchStoryById karena akan digantikan oleh presenter
  // async fetchStoryById(id) { ... }

  async _renderStoryDetail() {
    return new Promise((resolve) => {
      // Pastikan container sudah ada sebelum render
      const storiesContainer = document.querySelector('#story-detail-container');
      if (!storiesContainer) {
        // Coba render ulang container
        this.render().then(() => {
          this._renderStoryDetail().then(resolve);
        });
        return;
      }

      // Reset container sebelum render
      storiesContainer.innerHTML = '';
      storiesContainer.innerHTML = createStoryDetailTemplate(this._story);
      console.log('Story detail rendered successfully');

      // Berikan waktu untuk DOM diperbarui
      setTimeout(resolve, 200);
    });
  }

  async _initDetailMap() {
    // Hanya jika story memiliki lokasi
    if (this._story.lat && this._story.lon) {
      try {
        const cleanId = this._story.id.replace('story-', '');

        // Tunggu DOM diperbarui
        await new Promise((resolve) => setTimeout(resolve, 300));

        const mapContainer = document.getElementById(`map-${cleanId}`);
        if (!mapContainer) {
          console.error(`Map container for story ${cleanId} not found`);
          console.log(
            'Current HTML:',
            document.querySelector('#story-detail-container')?.innerHTML || 'Container not found',
          );
          return;
        }

        // Hapus instance map lama jika ada
        if (this._maps.has(cleanId)) {
          this._maps.get(cleanId).remove();
        }

        // Inisialisasi peta
        const map = L.map(mapContainer, {
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
        }).setView([this._story.lat, this._story.lon], 13);

        // Ambil konfigurasi provider yang dipilih
        const provider = this._mapProviders[this._currentMapProvider];

        // Tambahkan tile layer sesuai provider yang dipilih
        L.tileLayer(
          provider.url,
          {
            attribution: provider.attribution,
            maxZoom: provider.maxZoom,
          },
        ).addTo(map);

        // Tambah marker
        L.marker([this._story.lat, this._story.lon])
          .addTo(map)
          .bindPopup(this._story.name)
          .openPopup();

        this._maps.set(cleanId, map);

        // Ambil dan tampilkan nama lokasi (kota, negara)
        const locationName = await getLocationName(this._story.lat, this._story.lon);
        const locationElement = document.querySelector(`#location-${cleanId}`);
        if (locationElement) {
          locationElement.textContent = locationName || 'Location not found';
        }
      } catch (error) {
        console.error(`Error initializing map for story ${this._story.id}:`, error);
      }
    }
  }

  destroy() {
    // Bersihkan semua map
    this._maps.forEach((map) => {
      if (map) {
        map.remove();
      }
    });
    this._maps.clear();
  }
}

export default StoriesPage;
