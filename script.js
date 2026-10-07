// Animations au défilement : les éléments apparaissent quand ils entrent dans l'écran.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('anim');

  // [sélecteur, décalage en ms entre éléments d'un même groupe, effet]
  var groups = [
    ['.hero__content > *', 120, 'up'],
    ['.hero__photo', 0, 'zoom'],
    ['.services h2', 0, 'left'],
    ['.services__intro', 0, 'up'],
    ['.card', 130, 'up'],
    ['.services .pill', 0, 'up'],
    ['.contact h2', 0, 'left'],
    ['.contact__item', 130, 'up'],
    ['.contact__inner > .pill', 0, 'up']
  ];

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

  groups.forEach(function (group) {
    document.querySelectorAll(group[0]).forEach(function (el, i) {
      el.classList.add('reveal', 'reveal--' + group[2]);
      el.style.transitionDelay = i * group[1] + 'ms';
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
