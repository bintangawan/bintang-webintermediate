class HomePagePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  async showStories() {
    try {
      // PERUBAHAN: Jangan tampilkan loading di mainContent
      // karena akan menghapus elemen #stories yang sudah dibuat
      // Gunakan loading indicator di dalam stories container saja
      const storiesContainer = document.querySelector('#stories');
      if (storiesContainer) {
        storiesContainer.innerHTML = '<div class="loading" role="alert" aria-live="polite">Loading stories...</div>';
      } else {
        console.error('Stories container not found in presenter');
        // Fallback ke loading di main content jika stories container tidak ditemukan
        this._view.showLoading();
      }
      
      const stories = await this._model.getStories();
      
      // Cek kembali setelah fetch data selesai
      const storiesContainerAfterFetch = document.querySelector('#stories');
      if (!storiesContainerAfterFetch) {
        console.error('Stories container not found after fetching data');
        this._view.showError('Terjadi kesalahan saat memuat cerita. Silakan refresh halaman.');
        return;
      }
      
      this._view.renderStories(stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      
      let errorMessage = 'Gagal memuat daftar cerita. Silakan coba lagi.';
      
      if (
        error.message === 'Silakan login terlebih dahulu' ||
        error.message === 'Sesi telah berakhir, silakan login kembali'
      ) {
        errorMessage = error.message;
        this._view.redirectToLogin();
      }
      
      this._view.showError(errorMessage);
    }
  }
}

export default HomePagePresenter;
