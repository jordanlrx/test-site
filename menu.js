// Menu mobile (burger) : ouvre et ferme les liens de la barre du haut sur petit écran.
(function () {
  var button = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu-principal');
  if (!button || !nav) return;

  function setOpen(open, focusButton) {
    nav.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    } else if (focusButton) {
      button.focus();
    }
  }

  button.addEventListener('click', function () {
    setOpen(!nav.classList.contains('is-open'));
  });

  // Un lien choisi (y compris « Contact » sur l'accueil) referme le menu.
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  // Échap referme le menu et rend la main au bouton.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false, true);
  });

  // Un toucher en dehors de la barre referme le menu.
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !e.target.closest('.topbar')) setOpen(false);
  });

  // Repassage en grand écran : le menu redevient la barre normale.
  var desktop = window.matchMedia('(min-width: 48rem)');
  var reset = function () { if (desktop.matches) setOpen(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', reset);
})();
