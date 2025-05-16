class NotFoundPagePresenter {
    constructor({ view }) {
      this._view = view;
    }
  
    showNotFoundPage() {
      this._view.render();
    }
  }

export default NotFoundPagePresenter;