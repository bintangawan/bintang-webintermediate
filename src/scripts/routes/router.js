import routes from './routes';
import { ACCESS_TOKEN_KEY } from '../config';

class Router {
  constructor() {
    this._routes = routes;
    this._currentPage = null;
    this._initRouter();
  }

  _initRouter() {
    window.addEventListener('hashchange', () => {
      this.loadPage();
    });

    window.addEventListener('load', () => {
      this.loadPage();
    });

    // Tambahkan event listener untuk menangani navigasi keluar halaman
    window.addEventListener('beforeunload', () => {
      if (this._currentPage && typeof this._currentPage.destroy === 'function') {
        this._currentPage.destroy();
      }
    });
  }

  _checkAuth() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const publicPages = ['/login', '/register'];
    const currentPath = window.location.hash.slice(1);

    if (!token && !publicPages.includes(currentPath)) {
      window.location.hash = '#/login';
      return false;
    }

    if (token && publicPages.includes(currentPath)) {
      window.location.hash = '#/home';
      return false;
    }

    return true;
  }

  // Pada method _matchRoute, tambahkan penanganan untuk halaman not found
  _matchRoute(path) {
    // Ekstrak segmen path
    const splitUrl = path.split('/');
    const resource = splitUrl[1] || '';
    const id = splitUrl[2] || '';
  
    // Coba exact match dulu
    const exactPath = `/${resource}`;
    if (this._routes[exactPath] && !id) {
      return {
        pageClass: this._routes[exactPath],
        id: null,
      };
    }
  
    // Cek untuk dynamic route dengan ID
    if (resource === 'stories' && id) {
      const dynamicPath = '/stories/:id';
      if (this._routes[dynamicPath]) {
        return {
          pageClass: this._routes[dynamicPath],
          id: id, // Gunakan ID apa adanya tanpa modifikasi
        };
      }
    }
  
    // Jika tidak ada route yang cocok, gunakan halaman Not Found
    return {
      pageClass: this._routes['/not-found'] || this._routes['/'],
      id: null,
    };
  }

  async loadPage() {
    if (!this._checkAuth()) return;

    // Destroy current page jika ada
    if (this._currentPage && typeof this._currentPage.destroy === 'function') {
      this._currentPage.destroy();
    }

    const hash = window.location.hash;
    const url = hash.slice(1) || '/';

    // Gunakan _matchRoute untuk mendapatkan pageClass dan id
    const { pageClass, id } = this._matchRoute(url);

    // console.log('Router - Path:', url);
    // console.log('Router - ID:', id);

    if (pageClass) {
      document.startViewTransition(() => {
        this._currentPage = new pageClass();
        this._currentPage.render(id);
      });
    } else {
      window.location.hash = '#/';
    }
    const mainContent = document.querySelector('#mainContent');
    const skipLink = document.querySelector('.skip-link');

    skipLink.addEventListener('click', function (event) {
      event.preventDefault(); // Mencegah refresh halaman
      skipLink.blur(); // Menghilangkan fokus skip to content
      mainContent.focus(); // Fokus ke konten utama
      mainContent.scrollIntoView(); // Halaman scroll ke konten utama
    });
  }
}

export default Router;
