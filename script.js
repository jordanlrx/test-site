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
    ['.hero__photo', 0, 'fade'],
    ['.hero__trust li', 120, 'up'],
    ['.services h2', 0, 'left'],
    ['.services__intro', 0, 'up'],
    ['.card', 180, 'card'],
    ['.services .pill', 0, 'up'],
    ['.zone__text > *', 120, 'up'],
    ['.reviews__head > *', 100, 'up'],
    ['.review', 150, 'up'],
    ['.svc__text > *', 90, 'up'],
    ['.svc__media', 0, 'zoom'],
    ['.svc-cta', 0, 'up'],
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
    var counts = new Map(); // le décalage repart de zéro dans chaque bloc parent
    document.querySelectorAll(group[0]).forEach(function (el) {
      var i = counts.get(el.parentNode) || 0;
      counts.set(el.parentNode, i + 1);
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
})();

// Fil conducteur : le tuyau bleu part sous la photo du bandeau et relie toutes
// les sections jusqu'au contact. Son tracé est calculé à partir de la position
// réelle des sections (il passe dans les marges, jamais sur le contenu) et il
// se dessine au rythme du défilement.
(function () {
  var main = document.querySelector('main');
  var photo = document.querySelector('.hero__photo');
  var spacer = document.querySelector('.pipe');
  var services = document.querySelector('.services');
  var inner = document.querySelector('.services__inner');
  var zone = document.querySelector('.zone');
  var reviews = document.querySelector('.reviews'); // facultatif : le fil passe à côté des avis
  var contact = document.querySelector('.contact');
  var contactTitle = document.querySelector('.contact h2');
  if (!main || !photo || !spacer || !services || !inner || !zone || !contact || !contactTitle) return;

  var NS = 'http://www.w3.org/2000/svg';
  var desktop = window.matchMedia('(min-width: 48rem)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var svg = document.createElementNS(NS, 'svg');
  var path = document.createElementNS(NS, 'path');
  var probe = document.createElementNS(NS, 'path'); // sert à mesurer les longueurs
  svg.setAttribute('class', 'thread');
  svg.setAttribute('aria-hidden', 'true');
  path.setAttribute('pathLength', '1');
  probe.setAttribute('visibility', 'hidden');
  svg.appendChild(path);
  svg.appendChild(probe);
  main.insertBefore(svg, main.firstChild);
  document.documentElement.classList.add('has-thread');

  // Tranches de défilement : chaque morceau du tuyau se dessine pendant que
  // la « pointe » (une ligne aux 3/4 de l'écran) traverse sa hauteur.
  var pieces = [];
  var total = 0;
  var complete = false; // une fois tracé en entier, le fil reste en place

  // Position dans la page sans tenir compte des transformations
  // (les animations d'apparition décalent temporairement certains éléments).
  function docPos(el) {
    var x = 0, y = 0;
    for (var n = el; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return { x: x, y: y };
  }

  function rel(el) {
    if (el instanceof SVGElement) { // pas d'offsetTop sur un SVG (et celui-ci n'est jamais animé)
      var b = el.getBoundingClientRect(), mb = main.getBoundingClientRect();
      return { top: b.top - mb.top, bottom: b.bottom - mb.top, left: b.left - mb.left, right: b.right - mb.left, width: b.width, height: b.height };
    }
    var p = docPos(el), m = docPos(main);
    var w = el.offsetWidth, h = el.offsetHeight;
    return { top: p.y - m.y, bottom: p.y - m.y + h, left: p.x - m.x, right: p.x - m.x + w, width: w, height: h };
  }

  function layout() {
    if (!desktop.matches) return;
    var W = main.clientWidth;
    var ph = rel(photo), sp = rel(spacer), sv = rel(services), inn = rel(inner);
    var zn = rel(zone), ct = rel(contact), title = rel(contactTitle);

    var gutter = inn.left;                       // marge de chaque côté du contenu
    var sw = Math.max(10, Math.min(24, gutter * 0.55));
    var r = 48;
    var px = ph.left + ph.width / 2;             // sous la photo du bandeau
    var gxL = Math.max(sw / 2 + 2, gutter / 2);  // couloir gauche
    var gxR = Math.min(W - sw / 2 - 2, inn.right + (W - inn.right) / 2); // couloir droit
    var yH = sp.top + sp.height * 0.6;           // premier virage, au-dessus de « Mes services »
    var yS = sv.bottom - 48;                     // entre les services et la zone
    var last = reviews ? rel(reviews) : zn;      // dernière section avant le contact
    var yZ = last.bottom - 48;                   // juste avant le contact
    var cx = title.left + sw / 2;                // se branche au-dessus de « Me contacter »
    var yEnd = ct.top + 4;

    // Morceaux : [d du morceau, début et fin de la tranche de défilement]
    var Wn = 110;
    var segs = [
      ['M' + px + ' 0V' + (yH - r), 0, yH - Wn],
      ['Q' + px + ' ' + yH + ' ' + (px - r) + ' ' + yH + 'H' + (gxL + r) + 'Q' + gxL + ' ' + yH + ' ' + gxL + ' ' + (yH + r), yH - Wn, yH + Wn],
      ['V' + (yS - r), yH + Wn, yS - Wn],
      ['Q' + gxL + ' ' + yS + ' ' + (gxL + r) + ' ' + yS + 'H' + (gxR - r) + 'Q' + gxR + ' ' + yS + ' ' + gxR + ' ' + (yS + r), yS - Wn, yS + Wn],
      ['V' + (yZ - r), yS + Wn, yZ - Wn],
      ['Q' + gxR + ' ' + yZ + ' ' + (gxR - r) + ' ' + yZ + 'H' + (cx + r) + 'Q' + cx + ' ' + yZ + ' ' + cx + ' ' + (yZ + r), yZ - Wn, yZ + Wn],
      ['V' + yEnd, yZ + Wn, yEnd]
    ];

    var d = '';
    var prev = 0;
    pieces = segs.map(function (sg) {
      d += sg[0];
      probe.setAttribute('d', d);
      var len = probe.getTotalLength();
      var piece = { from: prev, to: len, start: sg[1], end: sg[2] };
      prev = len;
      return piece;
    });
    total = prev;

    svg.setAttribute('width', W);
    svg.setAttribute('height', yEnd + sw);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (yEnd + sw));
    path.setAttribute('d', d);
    path.setAttribute('stroke-width', sw);
    draw();
  }

  function draw() {
    ticking = false;
    if (!desktop.matches || !total) return;
    if (reduce || complete) { path.style.strokeDashoffset = '0'; return; }
    var tip = window.innerHeight * 0.75 - main.getBoundingClientRect().top;
    var drawn = 0;
    pieces.forEach(function (pc) {
      var t = (tip - pc.start) / Math.max(1, pc.end - pc.start);
      t = Math.min(1, Math.max(0, t));
      if (t > 0) drawn = pc.from + (pc.to - pc.from) * t;
    });
    if (drawn >= total) complete = true;
    path.style.strokeDashoffset = (1.01 * (1 - drawn / total)).toString();
  }

  var ticking = false;
  function requestDraw() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(draw);
    }
  }

  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', function () { window.requestAnimationFrame(layout); });
  if (desktop.addEventListener) desktop.addEventListener('change', layout);
  // Recalcule quand les polices et images ont fini de charger (les hauteurs changent).
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
})();
