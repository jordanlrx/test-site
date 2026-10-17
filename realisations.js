// Page « Nos réalisations » : filtres par service, visionneuse photo et apparitions.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var works = Array.prototype.slice.call(document.querySelectorAll('.work'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
  var status = document.getElementById('works-status');
  if (!works.length) return;

  /* ---------- Apparition des cartes ---------- */
  var animate = !reduce && 'IntersectionObserver' in window;
  if (animate) document.documentElement.classList.add('js-anim');

  var observer = animate ? new IntersectionObserver(function (entries) {
    // Les cartes d'une même rangée arrivent l'une après l'autre.
    entries.filter(function (e) { return e.isIntersecting; }).forEach(function (e, i) {
      var card = e.target;
      card.style.transitionDelay = (i * 90) + 'ms';
      card.classList.remove('is-pending');
      observer.unobserve(card);
      setTimeout(function () { card.style.transitionDelay = ''; }, 600 + i * 90);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }) : null;

  function reveal(list) {
    if (!observer) return;
    list.forEach(function (card) {
      card.classList.add('is-pending');
      observer.observe(card);
    });
  }

  /* ---------- Filtres ---------- */
  function applyFilter(key, fromUser) {
    var shown = [];
    works.forEach(function (card) {
      var match = key === 'all' || card.dataset.service === key;
      card.hidden = !match;
      if (match) shown.push(card);
    });
    filters.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.filter === key ? 'true' : 'false');
    });
    var active = filters.filter(function (b) { return b.dataset.filter === key; })[0];
    var label = active && key !== 'all' ? active.childNodes[0].textContent.trim() : '';
    status.textContent = shown.length + (shown.length > 1 ? ' réalisations' : ' réalisation') +
      (label ? ' en « ' + label + ' »' : '');
    if (fromUser) {
      reveal(shown);
      // Garde le filtre dans l'adresse (lien partageable, retour arrière).
      try {
        history.replaceState(null, '', key === 'all' ? location.pathname : '#' + key);
      } catch (e) { /* adresse non modifiable (ouverture locale) : le filtre marche quand même */ }
    }
  }

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.dataset.filter, true); });
  });

  var initial = location.hash.slice(1);
  var known = filters.some(function (b) { return b.dataset.filter === initial; });
  applyFilter(known ? initial : 'all', false);
  reveal(works.filter(function (c) { return !c.hidden; }));

  /* ---------- Visionneuse ---------- */
  var dialog = document.querySelector('.lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return; // sans visionneuse, la grille reste utilisable

  var img = dialog.querySelector('.lightbox__img');
  var tag = dialog.querySelector('.lightbox__tag');
  var title = dialog.querySelector('.lightbox__title');
  var place = dialog.querySelector('.lightbox__place');
  var count = dialog.querySelector('.lightbox__count');
  var current = 0;
  var list = [];
  var opener = null;

  function show(index) {
    current = (index + list.length) % list.length;
    var card = list[current];
    var thumb = card.querySelector('img');
    img.src = card.querySelector('.work__open').dataset.full;
    img.alt = thumb.alt;
    tag.textContent = card.querySelector('.work__tag').textContent;
    title.textContent = card.querySelector('.work__title').textContent;
    place.textContent = card.querySelector('.work__place').textContent.trim();
    count.textContent = (current + 1) + ' / ' + list.length;
  }

  works.forEach(function (card) {
    card.querySelector('.work__open').addEventListener('click', function () {
      list = works.filter(function (c) { return !c.hidden; }); // on navigue dans le filtre en cours
      opener = this;
      show(list.indexOf(card));
      dialog.showModal();
    });
  });

  dialog.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
  dialog.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
  dialog.querySelector('.lightbox__close').addEventListener('click', function () { dialog.close(); });

  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });

  // Un clic sur le fond sombre ferme la visionneuse.
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();
  });

  // Rend la main au bouton qui avait ouvert la photo.
  dialog.addEventListener('close', function () {
    if (opener) opener.focus();
  });

  // Glisser du doigt pour passer d'une photo à l'autre sur mobile.
  var startX = null;
  dialog.addEventListener('pointerdown', function (e) { startX = e.clientX; });
  dialog.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });
})();
