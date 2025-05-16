class BookmarkPagePresenter {
    constructor({ view, model }) {
      this._view = view;
      this._model = model;
  
      this._view.setOnRemoveBookmark(this._handleRemoveBookmark.bind(this));
    }
  
    async showBookmarks() {
      try {
        const bookmarks = await this._model.getAllBookmarks();
        this._view.renderBookmarks(bookmarks);
      } catch (error) {
        this._view.showError('Gagal memuat bookmark: ' + error.message);
      }
    }
  
    async _handleRemoveBookmark(id) {
      try {
        await this._model.deleteBookmark(id);
        // Refresh daftar bookmark setelah menghapus
        this.showBookmarks();
      } catch (error) {
        this._view.showError('Gagal menghapus bookmark: ' + error.message);
      }
    }
  }
export default BookmarkPagePresenter;