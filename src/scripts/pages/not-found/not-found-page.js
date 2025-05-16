import NotFoundPagePresenter from './not-found-presenter';

class NotFoundPage {
  constructor() {
    this._view = new NotFoundPageView();
    this._presenter = new NotFoundPagePresenter({
      view: this._view,
    });
  }

  render() {
    this._presenter.showNotFoundPage();
  }
}

class NotFoundPageView {
  constructor() {
    this._mainContent = document.querySelector('#mainContent');
  }

  render() {
    this._mainContent.innerHTML = `
      <section class="content">
        <div class="error-container" role="alert">
          <h2>404 - Page Not Found</h2>
          <p>Maaf, halaman yang Anda cari tidak ditemukan.</p>
          <a href="#/home" class="form__button">Kembali ke Home</a>
        </div>
      </section>
    `;
  }
}

export default NotFoundPage;