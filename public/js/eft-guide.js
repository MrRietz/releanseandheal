// EFT-guiden: en kort, guidad övning som går av sig själv i lugn takt.
// Inget sparas och inget skickas någonstans.
(function () {
  var root = document.getElementById('eft-guide');
  var dataEl = document.getElementById('eftg-data');
  if (!root || !dataEl) return;
  var T = JSON.parse(dataEl.textContent);

  // Ordningen punkterna knackas i (vanlig EFT-följd, uppifrån och ned i ansiktet).
  var ORDNING = ['ogonbryn', 'sida', 'under-ogat', 'nasa', 'mun', 'nyckelben', 'arm', 'topp'];
  var ANTAL = 10;     // pulser per punkt
  var TAKT = 1000;    // millisekunder mellan pulserna
  var LEDTID = 1800;  // andrum innan varje punkt börjar
  var PAUS_MELLAN = 900;

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
  var takt = root.querySelector('#eftg-takt');
  var prickar = takt.querySelectorAll('span');
  var steg = root.querySelectorAll('.eftg-steg span');
  var diffFore = root.querySelector('#eftg-diff-fore');
  var diffEfter = root.querySelector('#eftg-diff-efter');
  var paus = root.querySelector('#eftg-paus');
  var nasta = root.querySelector('#eftg-nasta');
  var visa = root.querySelector('#eftg-visa');
  var resultat = root.querySelector('#eftg-resultat');
  var resultatText = root.querySelector('#eftg-resultat-text');
  var igen = root.querySelector('#eftg-igen');
  var punkter = {};
  root.querySelectorAll('.eft-punkt').forEach(function (g) { punkter[g.getAttribute('data-punkt')] = g; });
  var dots = {};
  root.querySelectorAll('.eftg-dot').forEach(function (d) { dots[d.getAttribute('data-punkt')] = d; });
  var ringar = {};
  root.querySelectorAll('.eftg-ring').forEach(function (r) { ringar[r.getAttribute('data-punkt')] = r; });

  var kansla = '';
  var fore = 5;
  var index = 0;
  var taps = 0;
  var timer = null;
  var pausad = false;

  function fyll(text, vars) {
    return text.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
  }
  function visaSkarm(namn) {
    Object.keys(skarm).forEach(function (k) { skarm[k].hidden = k !== namn; });
  }
  function stoppa() {
    clearTimeout(timer);
    timer = null;
  }
  function markera() {
    var aktiv = ORDNING[index];
    steg.forEach(function (s, i) {
      s.classList.toggle('klar', i < index);
      s.classList.toggle('aktiv', i === index);
    });
    Object.keys(punkter).forEach(function (slug) {
      var klar = ORDNING.indexOf(slug) < index;
      punkter[slug].classList.toggle('aktiv', slug === aktiv);
      punkter[slug].classList.toggle('klar', klar);
      dots[slug].classList.toggle('aktiv', slug === aktiv);
      dots[slug].classList.toggle('klar', klar);
    });
  }
  function nollstallTakt() {
    prickar.forEach(function (p) { p.classList.remove('fylld'); });
  }
  function pulsera() {
    [dots[ORDNING[index]], ringar[ORDNING[index]]].forEach(function (el) {
      el.classList.remove('puls');
      void el.getBoundingClientRect();
      el.classList.add('puls');
    });
    prickar.forEach(function (p, i) { p.classList.toggle('fylld', i < taps); });
  }
  function tick() {
    if (pausad) return;
    taps += 1;
    pulsera();
    timer = setTimeout(taps >= ANTAL ? klarMedPunkt : tick, taps >= ANTAL ? PAUS_MELLAN : TAKT);
  }
  function visaPunkt() {
    taps = 0;
    markera();
    nollstallTakt();
    status.textContent = fyll(T.knack_status, {
      nr: index + 1,
      totalt: ORDNING.length,
      namn: punkter[ORDNING[index]].querySelector('text').textContent
    });
    instr.textContent = fyll(T.knack_instruktion, { kansla: kansla.toLowerCase(), antal: ANTAL });
    stoppa();
    if (!pausad) timer = setTimeout(tick, LEDTID);
  }
  function klarMedPunkt() {
    stoppa();
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
  function sattPaus(p) {
    pausad = p;
    paus.textContent = p ? T.knack_forts : T.knack_paus;
    paus.setAttribute('aria-pressed', p ? 'true' : 'false');
    if (p) {
      stoppa();
    } else {
      timer = setTimeout(taps >= ANTAL ? klarMedPunkt : tick, taps === 0 ? LEDTID : (taps >= ANTAL ? PAUS_MELLAN : TAKT));
    }
  }
  function starta() {
    index = 0;
    pausad = false;
    paus.textContent = T.knack_paus;
    paus.setAttribute('aria-pressed', 'false');
    visaSkarm('knack');
    visaPunkt();
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
  paus.addEventListener('click', function () { sattPaus(!pausad); });
  nasta.addEventListener('click', function () { klarMedPunkt(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && !pausad && skarm.knack && !skarm.knack.hidden) sattPaus(true);
  });
  visa.addEventListener('click', function () {
    var efter = +efterIn.value;
    var text = efter < fore ? T.resultat_lagre : (efter === fore ? T.resultat_samma : T.resultat_hogre);
    resultatText.textContent = fyll(text, { fore: fore, efter: efter });
    diffFore.textContent = fore;
    diffEfter.textContent = efter;
    diffEfter.className = efter < fore ? 'battre' : (efter === fore ? 'samma' : 'hogre');
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
