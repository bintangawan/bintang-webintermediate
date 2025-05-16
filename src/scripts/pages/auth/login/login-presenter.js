import { ACCESS_TOKEN_KEY } from '../../../config';

class LoginPresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
    
    this._view.setLoginCallback(this.login.bind(this));
  }

  async login({ email, password }) {
    try {
      const response = await this._model.login({ email, password });
      localStorage.setItem(ACCESS_TOKEN_KEY, response.loginResult.token);

      // Tampilkan pesan sukses sebelum redirect
      this._view.showAlert('Login successful! Redirecting...', 'success');

      // Redirect setelah delay singkat
      this._view.redirectToHome();
    } catch (error) {
      console.error('Error logging in:', error);
      this._view.showAlert(error.message || 'Failed to login. Please try again.', 'error');
    } finally {
      // Sembunyikan loading
      this._view.showLoading(false);
    }
  }
}

export default LoginPresenter;