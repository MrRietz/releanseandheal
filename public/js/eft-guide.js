// EFT-guiden: en kort, guidad övning. Inget sparas och inget skickas någonstans.
(function () {
  var root = document.getElementById('eft-guide');
  var dataEl = document.getElementById('eftg-data');
  if (!root || !dataEl) return;
  var T = JSON.parse(dataEl.textContent);

  // Ordningen punkterna knackas i (vanlig EFT-följd, uppifrån och ned i ansiktet).
  var ORDNING = ['ogonbryn', 'sida', 'under-ogat', 'nasa', 'mun', 'nyckelben', 'arm', 'topp'];
  var ANTAL = 10;

  var skarm = {};
  root.querySelectorAll('[data-skarm]').forEach(function (s) { skarm[s.getAttribute('data-skarm')] = s; });
  var chips = root.querySelectorAll('.eftg-chip');
  var foreIn = root.querySelector('#eftg-fore');
  var foreUt = root.querySelector('#eftg-fore-ut');
  var efterIn = root.querySelector('#eftg-efter');
  var efterUt = root.querySelector('#eftg-efter-ut');
  var startKnapp = root.querySelector('#eftg-start');
  var status = root.querySelector('#eftg-status');
  var instr = root.querySelector('#eftg-instruktion');
  var knacka = root.querySelector('#eftg-knacka');
  var rakna = root.querySelector('#eftg-rakna');
  var nasta = root.querySelector('#eftg-nasta');
  var visa = root.querySelector('#eftg-visa');
  var resultat = root.querySelector('#eftg-resultat');
  var resultatText = root.querySelector('#eftg-resultat-text');
  var igen = root.querySelector('#eftg-igen');
  var punkter = {};
  root.querySelectorAll('.eft-punkt').forEach(function (g) { punkter[g.getAttribute('data-punkt')] = g; });
  var dots = {};
  root.querySelectorAll('.eftg-dot').forEach(function (d) { dots[d.getAttribute('data-punkt')] = d; });

  var kansla = '';
  var fore = 5;
  var index = 0;
  var taps = 0;
  var gar = false;

  function fyll(text, vars) {
    return text.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
  }
  function visaSkarm(namn) {
    Object.keys(skarm).forEach(function (k) { skarm[k].hidden = k !== namn; });
  }
  function markera() {
    var aktiv = ORDNING[index];
    Object.keys(punkter).forEach(function (slug) {
      var klar = ORDNING.indexOf(slug) < index;
      punkter[slug].classList.toggle('aktiv', slug === aktiv);
      punkter[slug].classList.toggle('klar', klar);
      dots[slug].classList.toggle('aktiv', slug === aktiv);
      dots[slug].classList.toggle('klar', klar);
    });
  }
  function visaPunkt() {
    taps = 0;
    markera();
    status.textContent = fyll(T.knack_status, {
      nr: index + 1,
      totalt: ORDNING.length,
      namn: punkter[ORDNING[index]].querySelector('text').textContent
    });
    instr.textContent = fyll(T.knack_instruktion, { kansla: kansla.toLowerCase(), antal: ANTAL });
    rakna.textContent = '0 / ' + ANTAL;
  }
  function klarMedPunkt() {
    index += 1;
    if (index >= ORDNING.length) {
      markera();
      visaSkarm('klar');
      efterIn.value = Math.max(0, fore - 1);
      efterUt.textContent = efterIn.value;
      resultat.hidden = true;
      visa.hidden = false;
      return;
    }
    visaPunkt();
  }
  function knack() {
    if (!gar) return;
    taps += 1;
    rakna.textContent = taps + ' / ' + ANTAL;
    var d = dots[ORDNING[index]];
    d.classList.remove('puls');
    void d.getBoundingClientRect();
    d.classList.add('puls');
    if (taps >= ANTAL) {
      gar = false;
      setTimeout(function () { gar = true; klarMedPunkt(); }, 450);
    }
  }
  function starta() {
    index = 0;
    gar = true;
    visaSkarm('knack');
    visaPunkt();
    knacka.focus({ preventScroll: true });
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', 'true');
      kansla = c.textContent.trim();
      startKnapp.disabled = false;
    });
  });
  foreIn.addEventListener('input', function () { fore = +foreIn.value; foreUt.textContent = foreIn.value; });
  efterIn.addEventListener('input', function () { efterUt.textContent = efterIn.value; });
  startKnapp.addEventListener('click', function () { fore = +foreIn.value; starta(); });
  knacka.addEventListener('click', knack);
  Object.keys(dots).forEach(function (slug) {
    dots[slug].addEventListener('click', function () { if (ORDNING[index] === slug) knack(); });
  });
  nasta.addEventListener('click', function () { if (gar) klarMedPunkt(); });
  visa.addEventListener('click', function () {
    var efter = +efterIn.value;
    var text = efter < fore ? T.resultat_lagre : (efter === fore ? T.resultat_samma : T.resultat_hogre);
    resultatText.textContent = fyll(text, { fore: fore, efter: efter });
    resultat.hidden = false;
    visa.hidden = true;
  });
  igen.addEventListener('click', function () {
    fore = +efterIn.value;
    foreIn.value = fore;
    foreUt.textContent = fore;
    starta();
  });

  visaSkarm('start');
})();
