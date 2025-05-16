class RegisterPresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
    
    this._view.setRegisterCallback(this.register.bind(this));
  }

  async register({ name, email, password }) {
    try {
      await this._model.register({ name, email, password });

      // Tampilkan pesan sukses sebelum redirect
      this._view.showAlert('Registration successful! Redirecting to login...', 'success');

      // Redirect setelah delay singkat
      this._view.redirectToLogin();
    } catch (error) {
      console.error('Error registering:', error);
      this._view.showAlert(error.message || 'Failed to register. Please try again.', 'error');
    } finally {
      // Sembunyikan loading
      this._view.showLoading(false);
    }
  }
}

export default RegisterPresenter;