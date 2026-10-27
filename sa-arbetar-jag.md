---
layout: home
title: Så arbetar jag
permalink: /sa-arbetar-jag/
page_id: methods
---

## Så arbetar jag

Jag ser holistiskt på människan och hälsan: det mentala, fysiska, emotionella och andliga hänger samman. Därför skräddarsyr jag hjälpen efter dina behov och kombinerar metoder utifrån vad som passar dig. Här berättar jag om verktygen jag arbetar med. Klicka på "Läs mer" för en fördjupning.

![Lavendel och kristaller]({{ site.baseurl }}/public/img/pexels-los-muertos-crew-7947789-1-1024x683.jpg){: .centrerad-bild}

{% include metodkort-lista.html %}

Metoderna är ett komplement och ersätter inte läkarvård eller psykiatrisk behandling. Upplevelser och resultat är individuella, och det vetenskapliga stödet varierar mellan metoderna.
{: .liten-text}

Osäker på vad som passar dig? Boka ett gratis utforskande samtal på 30 minuter.
[Boka utforskande samtal]({{ site.baseurl }}/bokning/?tjanst=utforskande-samtal){: .cta}
{: .centrerad}

<script>
(function () {
  if (!window.HTMLDialogElement) return;
  document.querySelectorAll('.metod').forEach(function (card) {
    var det = card.querySelector('details.lasmer');
    if (!det) return;
    var summary = det.querySelector('summary');
    var title = card.querySelector('h3').textContent;
    var tagline = card.querySelector('.metod-tagline');

    var dlg = document.createElement('dialog');
    dlg.className = 'metod-dialog' + (card.classList.contains('metod-bred') ? ' metod-dialog-gron' : '');
    dlg.setAttribute('aria-label', title);
    var inner = document.createElement('div');
    inner.className = 'metod-dialog-inre';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'metod-dialog-stang';
    close.setAttribute('aria-label', 'Stäng');
    close.textContent = '×';
    var head = document.createElement('h3');
    head.textContent = title;
    var body = document.createElement('div');
    body.className = 'metod-dialog-text';
    var foot = document.createElement('div');
    foot.className = 'metod-dialog-fot';
    inner.appendChild(close);
    inner.appendChild(head);
    if (tagline) {
      var sub = document.createElement('p');
      sub.className = 'metod-tagline';
      sub.textContent = tagline.textContent;
      inner.appendChild(sub);
    }
    var lead = card.querySelector(':scope > p:not(.metod-tagline):not(.meta)');
    if (lead) {
      var ingress = document.createElement('p');
      ingress.className = 'metod-dialog-ingress';
      ingress.textContent = lead.textContent;
      inner.appendChild(ingress);
    }
    inner.appendChild(body);
    var meta = card.querySelector('.meta');
    var cta = card.querySelector('.cta');
    if (meta) foot.appendChild(meta.cloneNode(true));
    if (cta) foot.appendChild(cta.cloneNode(true));
    if (foot.childNodes.length) inner.appendChild(foot);
    dlg.appendChild(inner);
    document.body.appendChild(dlg);

    summary.addEventListener('click', function (e) {
      e.preventDefault();
      Array.prototype.slice.call(det.children).forEach(function (n) {
        if (n !== summary) body.appendChild(n);
      });
      dlg.showModal();
    });
    dlg.addEventListener('close', function () {
      Array.prototype.slice.call(body.childNodes).forEach(function (n) { det.appendChild(n); });
    });
    close.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  });
})();
</script>
