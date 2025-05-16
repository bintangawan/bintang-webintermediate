import NotificationHelper from '../../utils/notification-helper';

class AddStoryPresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
    this._initView();
  }

  _initView() {
    this._view.setSubmitCallback((storyData) => {
      this._addStory(storyData);
    });
  }

  async _addStory(storyData) {
    try {
      this._view.showLoading();
      
      // Cek koneksi internet terlebih dahulu
      if (!navigator.onLine) {
        this._view.showError('Anda sedang offline. Tidak dapat menambahkan cerita saat ini.');
        return;
      }
      
      const response = await this._model.addStory(storyData);

      if (response.error === false) {
        this._view.showSuccess('Cerita berhasil ditambahkan');
        
        // Gunakan view untuk mengirim notifikasi
        this._view.sendNotification({
          title: 'Story Added',
          body: 'Your story has been successfully added!',
        });
        
        // Perbarui cache sebelum redirect
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'REFRESH_HOME_CACHE'
          });
        }
        
        this._view.redirectToHome();
      } else {
        throw new Error(response.message || 'Gagal menambahkan cerita');
      }
    } catch (error) {
      console.error('Error adding story:', error);
      
      // Pesan error yang lebih user-friendly
      if (!navigator.onLine) {
        this._view.showError('Anda sedang offline. Tidak dapat menambahkan cerita saat ini.');
      } else {
        this._view.showError('Gagal menambahkan cerita. Silakan coba lagi.');
      }
    }
  }
}

export default AddStoryPresenter;
