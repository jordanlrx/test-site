// Petit plan d'accès (Leaflet + fonds OpenStreetMap).
// La licence OpenStreetMap impose la mention « © OpenStreetMap » : on garde
// uniquement celle-ci, sans le préfixe Leaflet ni les autres liens.
(function () {
  var box = document.getElementById('contact-map');
  if (!box || !window.L) return;

  var LAMBALLE = [48.469, -2.517];

  function init() {
    var map = L.map(box, { scrollWheelZoom: false }).setView(LAMBALLE, 14);
    map.attributionControl.setPrefix(false);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(map);

    // Épingle aux couleurs du site
    var pin = L.divIcon({
      className: 'map-pin',
      html: '<svg viewBox="0 0 30 42" aria-hidden="true">' +
        '<path d="M15 41C11 34 2 25 2 15a13 13 0 0 1 26 0c0 10-9 19-13 26Z" fill="#c2410c" stroke="#fff" stroke-width="2.5"/>' +
        '<circle cx="15" cy="15" r="5" fill="#fff"/></svg>',
      iconSize: [30, 42],
      iconAnchor: [15, 41]
    });
    L.marker(LAMBALLE, { icon: pin, title: 'Plomberie Kermarrec', alt: 'Plomberie Kermarrec' }).addTo(map);
  }

  // On ne charge les fonds de carte qu'à l'approche du bas de page.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      init();
    }, { rootMargin: '300px 0px' });
    io.observe(box);
  } else {
    init();
  }
})();
