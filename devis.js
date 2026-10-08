// Formulaire de devis : vérification des champs et message de confirmation.
// Remarque : le site n'a pas de serveur, la demande n'est donc envoyée nulle part.
// Pour la recevoir par e-mail, brancher le formulaire sur un service comme
// Formspree ou Netlify Forms (voir sendRequest plus bas).
(function () {
  var form = document.getElementById('quote-form');
  if (!form) return;

  var summary = document.getElementById('form-errors');
  var success = document.getElementById('quote-success');
  var submit = form.querySelector('.quote__submit');

  var messages = {
    name: 'Indiquez votre nom et prénom.',
    phone: 'Indiquez un numéro de téléphone valide, par exemple 06 12 34 56 78.',
    email: 'Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.',
    address: "Indiquez l'adresse du chantier.",
    postal: 'Indiquez un code postal à 5 chiffres.',
    city: 'Indiquez la ville.',
    service: 'Choisissez le type de prestation.',
    message: 'Décrivez votre besoin en quelques mots (20 caractères minimum).',
    consent: 'Cochez cette case pour que je puisse traiter votre demande.'
  };

  // Renvoie true si le champ est valide, sinon affiche son message d'erreur.
  function check(name) {
    var error = document.getElementById(name + '-error');
    var target;
    var valid;

    if (name === 'service') {
      target = form.querySelector('.choice[aria-describedby="service-error"]');
      valid = !!form.querySelector('input[name="service"]:checked');
    } else {
      target = form.elements[name];
      valid = target.checkValidity();
    }

    target.setAttribute('aria-invalid', valid ? 'false' : 'true');
    error.textContent = valid ? '' : messages[name];
    return valid;
  }

  // Vérification quand on quitte un champ (et correction en direct une fois l'erreur affichée).
  Object.keys(messages).forEach(function (name) {
    if (name === 'service') {
      form.querySelectorAll('input[name="service"]').forEach(function (radio) {
        radio.addEventListener('change', function () { check('service'); });
      });
      return;
    }
    var field = form.elements[name];
    var event = field.type === 'checkbox' ? 'change' : 'blur';
    field.addEventListener(event, function () { check(name); });
    field.addEventListener('input', function () {
      if (field.getAttribute('aria-invalid') === 'true') check(name);
    });
  });

  function sendRequest() {
    // Simule un envoi. À remplacer par un vrai envoi, par exemple :
    // return fetch('https://formspree.io/f/VOTRE_ID', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    return new Promise(function (resolve) { setTimeout(resolve, 800); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var invalid = Object.keys(messages).filter(function (name) { return !check(name); });

    if (invalid.length) {
      summary.hidden = false;
      summary.textContent = invalid.length === 1
        ? 'Un champ est à corriger avant l\'envoi.'
        : invalid.length + ' champs sont à corriger avant l\'envoi.';
      var first = invalid[0] === 'service'
        ? form.querySelector('input[name="service"]')
        : form.elements[invalid[0]];
      first.focus();
      return;
    }

    summary.hidden = true;
    submit.disabled = true;
    submit.textContent = 'Envoi en cours…';

    sendRequest().then(function () {
      form.hidden = true;
      success.hidden = false;
      success.focus();
      window.scrollTo({ top: success.getBoundingClientRect().top + window.scrollY - 120 });
    });
  });
})();
