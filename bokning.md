---
layout: home
title: Boka tid
permalink: /bokning/
page_id: booking
---

<h2>Boka tid</h2>

<p style="text-align:center; font-size:1.1em; margin-bottom:1em; color:#7c5c3e;">Fyll i formuläret nedan för att boka tid eller kontakta mig.</p>
<form id="booking-form" data-offer-form action="https://formspree.io/f/xwpnrgzn" method="POST" style="max-width:400px;margin:0 auto 2em auto;display:flex;flex-direction:column;gap:16px;">
  <div class="offer-notice" data-offer hidden>
    <strong>✓ Mässerbjudande aktiverat</strong>
  </div>
  <input type="hidden" name="Mässerbjudande" value="Nej" disabled>
  <input type="hidden" name="_subject" value="Bokningsförfrågan från hemsidan">
  <select name="Tjänst" id="service-field" required style="padding:12px;border-radius:6px;border:1px solid #f6d2a5;background:#fff;color:#7c5c3e;">
    {% include service-options.html %}
  </select>
  {% include tidskalender.html %}
  <input type="text" name="Namn" placeholder="Namn" required style="padding:12px;border-radius:6px;border:1px solid #f6d2a5;">
  <input type="email" name="E-post" placeholder="E-post" required style="padding:12px;border-radius:6px;border:1px solid #f6d2a5;">
  <textarea name="Meddelande" placeholder="Meddelande" required style="padding:12px;border-radius:6px;border:1px solid #f6d2a5;min-height:100px;"></textarea>
  <button type="submit" class="cta" style="width:100%;font-size:1.1em;">Skicka bokningsförfrågan</button>
</form>


