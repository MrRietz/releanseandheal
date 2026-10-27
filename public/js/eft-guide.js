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

  // På mobil zoomar "kameran" in på aktiv punkt så att den syns tydligt.
  var svg = root.querySelector('.eftg-svg');
  var HELA = { x: 14, y: 352, w: 270, h: 310 };
  var kompakt = window.matchMedia('(max-width: 720px)');
  var lugn = window.matchMedia('(prefers-reduced-motion: reduce)');
  var nuVB = { x: HELA.x, y: HELA.y, w: HELA.w, h: HELA.h };
  var anim = null;

  function klampa(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fonster(slug) {
    if (!kompakt.matches) return HELA;
    var d = dots[slug];
    var cx = +d.getAttribute('cx');
    var cy = +d.getAttribute('cy');
    var tag = punkter[slug].querySelector('rect');
    var hogerkant = +tag.getAttribute('x') + +tag.getAttribute('width');
    var w = 170;
    var h = w * HELA.h / HELA.w;
    return {
      x: klampa(hogerkant + 6 - w, HELA.x, HELA.x + HELA.w - w),
      y: klampa(cy - h * 0.5, HELA.y, HELA.y + HELA.h - h),
      w: w,
      h: h
    };
  }
  function sattVB(v) {
    nuVB = { x: v.x, y: v.y, w: v.w, h: v.h };
    svg.setAttribute('viewBox', v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h);
  }
  function zoomaTill(mal) {
    if (anim) cancelAnimationFrame(anim);
    if (lugn.matches) { sattVB(mal); return; }
    var fran = { x: nuVB.x, y: nuVB.y, w: nuVB.w, h: nuVB.h };
    var start = null;
    function steg(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / 550);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      sattVB({
        x: fran.x + (mal.x - fran.x) * e,
        y: fran.y + (mal.y - fran.y) * e,
        w: fran.w + (mal.w - fran.w) * e,
        h: fran.h + (mal.h - fran.h) * e
      });
      if (p < 1) anim = requestAnimationFrame(steg);
    }
    anim = requestAnimationFrame(steg);
  }

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
    zoomaTill(fonster(ORDNING[index]));
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
    sattVB(HELA);
    visaSkarm('knack');
    visaPunkt();
    if (kompakt.matches) root.scrollIntoView({ behavior: lugn.matches ? 'auto' : 'smooth', block: 'start' });
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
  kompakt.addEventListener('change', function () {
    if (skarm.knack && !skarm.knack.hidden && index < ORDNING.length) sattVB(fonster(ORDNING[index]));
  });
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
