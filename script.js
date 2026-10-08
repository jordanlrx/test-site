// Animations au défilement : les éléments apparaissent quand ils entrent dans l'écran.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Pas de vidéo qui tourne en boucle pour qui demande moins de mouvement.
    var video = document.querySelector('.hero__photo');
    if (video && video.pause) video.pause();
    return;
  }
  if (!('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('anim');

  // [sélecteur, décalage en ms entre éléments d'un même groupe, effet]
  var groups = [
    ['.hero__content > *', 120, 'up'],
    ['.hero__photo', 0, 'zoom'],
    ['.services h2', 0, 'left'],
    ['.services__intro', 0, 'up'],
    ['.card', 180, 'card'],
    ['.services .pill', 0, 'up'],
    ['.zone__text > *', 120, 'up'],
    ['.contact h2', 0, 'left'],
    ['.contact__item', 130, 'up'],
    ['.contact__inner > .pill', 0, 'up']
  ];

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (entry.target.classList.contains('card')) entry.target.classList.add('is-framed');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

  groups.forEach(function (group) {
    document.querySelectorAll(group[0]).forEach(function (el, i) {
      el.classList.add('reveal', 'reveal--' + group[2]);
      el.style.transitionDelay = i * group[1] + 'ms';
      el.style.setProperty('--d', i * group[1] + 'ms');
      // Une fois apparu, on rend la main aux effets de survol normaux.
      el.addEventListener('transitionend', function done(e) {
        if (e.target !== el || e.propertyName !== 'transform') return;
        el.classList.remove('reveal', 'reveal--' + group[2], 'is-visible');
        el.style.transitionDelay = '';
        el.removeEventListener('transitionend', done);
      });
      observer.observe(el);
    });
  });

  // Une case se trace autour de chaque service, comme un trait de crayon.
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var frames = [];
  document.querySelectorAll('.card').forEach(function (card) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    var rect = document.createElementNS(SVG_NS, 'rect');
    svg.setAttribute('class', 'card__frame');
    svg.setAttribute('aria-hidden', 'true');
    rect.setAttribute('x', '1');
    rect.setAttribute('y', '1');
    rect.setAttribute('rx', '16');
    rect.setAttribute('pathLength', '1');
    svg.appendChild(rect);
    card.insertBefore(svg, card.firstChild);
    frames.push({ card: card, rect: rect });
  });

  // Le cadre suit la taille de la carte (texte qui passe à la ligne, mobile…).
  var sizeFrames = function () {
    frames.forEach(function (f) {
      f.rect.setAttribute('width', Math.max(0, f.card.offsetWidth - 2));
      f.rect.setAttribute('height', Math.max(0, f.card.offsetHeight - 2));
    });
  };
  sizeFrames();
  window.addEventListener('resize', sizeFrames);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeFrames);

  // La carte de la zone d'intervention s'anime quand elle arrive à l'écran.
  document.querySelectorAll('.zone__map').forEach(function (map) {
    observer.observe(map);
  });

  // La goutte du contact se « dessine » au trait.
  document.querySelectorAll('.contact__deco').forEach(function (svg) {
    svg.querySelectorAll('path').forEach(function (path) {
      path.setAttribute('pathLength', '1');
    });
    observer.observe(svg);
  });

  // Le tuyau se dessine au rythme du défilement : il avance quand on descend,
  // recule quand on remonte.
  var pipe = document.querySelector('.pipe');
  if (pipe) {
    var pipePath = pipe.querySelector('path');
    pipePath.setAttribute('pathLength', '1');
    var ticking = false;

    var drawPipe = function () {
      ticking = false;
      var rect = pipe.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 quand le haut du tuyau entre en bas de l'écran, 1 quand son bas atteint le milieu.
      var progress = (vh * 0.9 - rect.top) / (rect.height + vh * 0.4);
      progress = Math.min(1, Math.max(0, progress));
      pipePath.style.strokeDashoffset = (1.01 * (1 - progress)).toString();
    };

    var requestDraw = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(drawPipe);
      }
    };

    window.addEventListener('scroll', requestDraw, { passive: true });
    window.addEventListener('resize', requestDraw);
    drawPipe();
  }
})();
