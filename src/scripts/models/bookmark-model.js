import { openDB } from 'idb';

class BookmarkModel {
  constructor() {
    this._dbPromise = this._initDB();
  }

  async _initDB() {
    return openDB('story-app-db', 1, {
      upgrade(db) {
        // Buat object store jika belum ada
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarkStore.createIndex('id', 'id', { unique: true });
        }
      },
    });
  }

  async getAllBookmarks() {
    const db = await this._dbPromise;
    return db.getAll('bookmarks');
  }

  async getBookmarkById(id) {
    const db = await this._dbPromise;
    return db.get('bookmarks', id);
  }

  async saveBookmark(story) {
    const db = await this._dbPromise;
    return db.put('bookmarks', story);
  }

  async deleteBookmark(id) {
    const db = await this._dbPromise;
    return db.delete('bookmarks', id);
  }

  async isBookmarked(id) {
    const bookmark = await this.getBookmarkById(id);
    return !!bookmark;
  }
}

export default BookmarkModel;