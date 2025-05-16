const DrawerInitiator = {
  init({ button, drawer, content }) {
    button.addEventListener('click', (event) => {
      this._toggleDrawer(event, drawer, button);
    });

    content.addEventListener('click', (event) => {
      this._closeDrawer(event, drawer, button);
    });

    // Tambahkan event listener untuk semua link di dalam drawer
    const drawerLinks = drawer.querySelectorAll('a');
    drawerLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        this._closeDrawer(event, drawer, button);
      });
    });
  },

  _toggleDrawer(event, drawer, button) {
    event.stopPropagation();
    drawer.classList.toggle('open');
    button.classList.toggle('active');

    // Create or remove overlay
    if (drawer.classList.contains('open')) {
      this._createOverlay(drawer, button);
    } else {
      this._removeOverlay();
    }
  },

  _closeDrawer(event, drawer, button) {
    event.stopPropagation();
    drawer.classList.remove('open');
    button.classList.remove('active');
    this._removeOverlay();
  },

  _createOverlay(drawer, button) {
    const overlay = document.createElement('div');
    overlay.classList.add('nav-overlay');
    overlay.classList.add('active');

    // Styling untuk memastikan overlay menutupi seluruh layar
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '999';

    overlay.addEventListener('click', () => {
      drawer.classList.remove('open');
      button.classList.remove('active');
      this._removeOverlay();
    });

    document.body.appendChild(overlay);
  },

  _removeOverlay() {
    const overlay = document.querySelector('.nav-overlay');
    if (overlay) {
      overlay.remove();
    }
  },
};

export default DrawerInitiator;
