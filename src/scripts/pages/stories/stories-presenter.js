import BookmarkModel from '../../models/bookmark-model';

class StoriesPagePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;

    this._bookmarkModel = new BookmarkModel();
    
    // Set callback untuk bookmark
    this._view.setOnBookmarkClick(this._handleBookmarkClick.bind(this));
  }

  async showStoryDetail(id) {
    try {
      if (!id) {
        throw new Error('ID cerita tidak valid');
      }
  
  
      // Tampilkan loading
      this._view.showLoading();
  
      // Ambil data dari model
      const story = await this._model.getDetail(id);
      const isBookmarked = await this._bookmarkModel.isBookmarked(story.id);
  
      // Tampilkan ke view
      await this._view.displayStoryDetail(story, isBookmarked);
  
    } catch (error) {
      console.error('Error in presenter:', error);
  
      // Pesan default
      let errorMessage = 'Gagal memuat detail cerita. Tidak ada cache dan Anda sedang Offline.';
  
      if (
        error.message === 'Silakan login terlebih dahulu' ||
        error.message === 'Sesi telah berakhir, silakan login kembali'
      ) {
        errorMessage = error.message;
        this._view.redirectToLogin();
      } else if (
        error.message === 'HTTP error! status: 404' ||
        error.message === 'Cerita tidak ditemukan'
      ) {
        errorMessage = 'Cerita tidak ditemukan';
      } else if (error.message.includes('offline')) {
        errorMessage = error.message; // Pesan offline ditampilkan langsung
      }
  
      this._view.showError(errorMessage);
    }
  }
  

  async _handleBookmarkClick(story, isCurrentlyBookmarked) {
    try {
      if (isCurrentlyBookmarked) {
        await this._bookmarkModel.deleteBookmark(story.id);
        this._view.updateBookmarkButton(false);
      } else {
        await this._bookmarkModel.saveBookmark(story);
        this._view.updateBookmarkButton(true);
      }
    } catch (error) {
      this._view.showError(`Gagal ${isCurrentlyBookmarked ? 'menghapus' : 'menyimpan'} bookmark: ${error.message}`);
    }
  }
}

export default StoriesPagePresenter;
