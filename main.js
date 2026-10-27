document.addEventListener('DOMContentLoaded', () => {
  const headers = document.querySelectorAll('.site-header');

  headers.forEach((header) => {
    const btn = header.querySelector('.menu-toggle');
    const nav = header.querySelector('.nav-links');
    if (!btn || !nav) return;

    const closeMenu = () => {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', '開啟選單');
      document.body.classList.remove('mobile-menu-open');
    };

    const openMenu = () => {
      nav.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', '關閉選單');
      document.body.classList.add('mobile-menu-open');
    };

    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      nav.classList.contains('open') ? closeMenu() : openMenu();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1040) closeMenu();
    });
  });
});
