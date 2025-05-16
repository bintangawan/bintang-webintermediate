import BookmarkModel from '../../models/bookmark-model';
import BookmarkPagePresenter from './bookmark-presenter';
import { createBookmarkItemTemplate } from '../../template';

class BookmarkPage {
  constructor() {
    this._model = new BookmarkModel();
    this._view = new BookmarkPageView();
    this._presenter = new BookmarkPagePresenter({
      view: this._view,
      model: this._model,
    });
  }

  async render() {
    await this._view.render();
    await this._presenter.showBookmarks();
  }

  destroy() {
    this._view.destroy();
  }
}

class BookmarkPageView {
  constructor() {
    this._mainContent = document.querySelector('#mainContent');
    this._bookmarks = [];
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

  async render() {
    this._mainContent.innerHTML = `
      <section class="content">
        <h2>Bookmarked Stories</h2>
        <div class="bookmarks" id="bookmarks"></div>
      </section>
    `;

    // Tunggu hingga DOM benar-benar dirender
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  renderBookmarks(bookmarks) {
    this._bookmarks = bookmarks;
    this._renderBookmarkItems();
  }

  _renderBookmarkItems() {
    const bookmarksContainer = document.querySelector('#bookmarks');
    if (!bookmarksContainer) {
      console.error('Bookmarks container not found');
      return;
    }
    
    if (this._bookmarks.length === 0) {
      bookmarksContainer.innerHTML = `
        <div class="empty-state">
          <p>Anda belum memiliki cerita yang di-bookmark</p>
          <a href="#/home" class="form__button">Jelajahi Cerita</a>
        </div>
      `;
      return;
    }

    bookmarksContainer.innerHTML = '';
    this._bookmarks.forEach((story) => {
      bookmarksContainer.innerHTML += createBookmarkItemTemplate(story);
    });

    this._initEventListeners();
  }

  _initEventListeners() {
    const removeButtons = document.querySelectorAll('.remove-bookmark-btn');
    removeButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const id = e.target.closest('.remove-bookmark-btn').dataset.id;
        if (this._onRemoveBookmark) {
          this._onRemoveBookmark(id);
        }
      });
    });
  }

  setOnRemoveBookmark(callback) {
    this._onRemoveBookmark = callback;
  }

  destroy() {
    // Bersihkan event listener atau resource lain jika diperlukan
  }
}

export default BookmarkPage;