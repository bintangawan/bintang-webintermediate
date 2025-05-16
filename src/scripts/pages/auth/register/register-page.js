import RegisterPresenter from './register-presenter';
import ApiService from '../../../data/api-service';

class RegisterPage {
  constructor() {
    this._registerView = new RegisterPageView();
    this._registerPresenter = new RegisterPresenter({
      view: this._registerView,
      model: ApiService,
    });
  }

  render() {
    this._registerView.render();
  }
}

class RegisterPageView {
  constructor() {
    this._mainContent = document.querySelector('#mainContent');
    this._registerCallback = null;
  }

  setRegisterCallback(callback) {
    this._registerCallback = callback;
  }

  render() {
    this._mainContent.innerHTML = `
      <section class="content">
        <h2>Register</h2>
        <div id="alertContainer"></div>
        <form id="registerForm" class="form-auth">
          <div class="form__group-auth">
            <label for="name" class="form__label-auth">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              class="form__input-auth"
              required
            />
          </div>
          <div class="form__group-auth">
            <label for="email" class="form__label-auth">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              class="form__input-auth"
              required
            />
          </div>
          <div class="form__group-auth">
            <label for="password" class="form__label-auth">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              class="form__input-auth"
              required
              minlength="8"
            />
          </div>
          <button type="submit" id="registerButton" class="form__button-auth">
            Register
            <span id="registerLoading" class="loading-indicator" style="display: none;"></span>
          </button>
          <p class="form__text-auth">Already have an account? <a href="#/login">Login</a></p>
        </form>
      </section>
    `;

    this._initEventListeners();
  }

  _initEventListeners() {
    const form = document.querySelector('#registerForm');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validasi form
      const name = document.querySelector('#name').value;
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;

      if (!name) {
        this.showAlert('Name is required', 'error');
        return;
      }

      if (!email) {
        this.showAlert('Email is required', 'error');
        return;
      }

      if (!password) {
        this.showAlert('Password is required', 'error');
        return;
      }

      if (password.length < 8) {
        this.showAlert('Password must be at least 8 characters', 'error');
        return;
      }

      // Panggil callback register yang akan diset oleh presenter
      if (this._registerCallback) {
        this.showLoading(true);
        this._registerCallback({ name, email, password });
      }
    });
  }

  showLoading(isLoading) {
    const registerButton = document.querySelector('#registerButton');
    const registerLoading = document.querySelector('#registerLoading');
    
    if (isLoading) {
      registerButton.disabled = true;
      registerLoading.style.display = 'inline-block';
      document.querySelector('#alertContainer').innerHTML = '';
    } else {
      registerButton.disabled = false;
      registerLoading.style.display = 'none';
    }
  }

  showAlert(message, type) {
    const alertContainer = document.querySelector('#alertContainer');
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  }

  redirectToLogin() {
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 1500);
  }
}

export default RegisterPage;