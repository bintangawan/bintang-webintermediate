import LoginPresenter from './login-presenter';
import ApiService from '../../../data/api-service';

class LoginPage {
  constructor() {
    this._loginView = new LoginPageView();
    this._loginPresenter = new LoginPresenter({
      view: this._loginView,
      model: ApiService,
    });
  }

  render() {
    this._loginView.render();
  }
}

class LoginPageView {
    constructor() {
      this._mainContent = document.querySelector('#mainContent');
      this._loginCallback = null;
    }
  
    setLoginCallback(callback) {
      this._loginCallback = callback;
    }
  
    render() {
      this._mainContent.innerHTML = `
        <section class="content">
          <h2>Login</h2>
          <div id="alertContainer"></div>
          <form id="loginForm" class="form-auth">
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
              />
            </div>
            <button type="submit" id="loginButton" class="form__button-auth">
              Login
              <span id="loginLoading" class="loading-indicator" style="display: none;"></span>
            </button>
            <p class="form__text-auth">Don't have an account? <a href="#/register">Register</a></p>
          </form>
        </section>
      `;
  
      this._initEventListeners();
    }
  
    _initEventListeners() {
      const form = document.querySelector('#loginForm');
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        // Validasi form
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
  
        if (!email) {
          this.showAlert('Email is required', 'error');
          return;
        }
  
        if (!password) {
          this.showAlert('Password is required', 'error');
          return;
        }
  
        // Panggil callback login yang akan diset oleh presenter
        if (this._loginCallback) {
          this.showLoading(true);
          this._loginCallback({ email, password });
        }
      });
    }
  
    showLoading(isLoading) {
      const loginButton = document.querySelector('#loginButton');
      const loginLoading = document.querySelector('#loginLoading');
      
      if (isLoading) {
        loginButton.disabled = true;
        loginLoading.style.display = 'inline-block';
        document.querySelector('#alertContainer').innerHTML = '';
      } else {
        loginButton.disabled = false;
        loginLoading.style.display = 'none';
      }
    }

    redirectToHome() {
      setTimeout(() => {
        window.location.hash = '#/home';
      }, 1000);
    }
  
    showAlert(message, type) {
      const alertContainer = document.querySelector('#alertContainer');
      alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }
  }
  
  export default LoginPage;