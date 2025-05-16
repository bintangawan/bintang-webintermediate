const BackToTop = {
  init() {
    this._backToTopBtn = document.getElementById('backToTopBtn');
    this._setupEventListeners();
  },

  _setupEventListeners() {
    // Tampilkan/sembunyikan tombol berdasarkan posisi scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        this._backToTopBtn.classList.add('visible');
      } else {
        this._backToTopBtn.classList.remove('visible');
      }
    });

    // Scroll ke atas ketika tombol diklik
    this._backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  },
};

export default BackToTop;
