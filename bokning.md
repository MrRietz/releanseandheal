---
layout: home
title: Boka tid
permalink: /bokning/
page_id: booking
---

<h2 data-text-key="booking.heading.001">Boka tid</h2>

<p style="text-align:center; font-size:1.1em; margin-bottom:1em; color:#7c5c3e;" data-text-key="booking.paragraph.001">Fyll i formuläret nedan för att boka tid eller kontakta mig.</p>
<form id="booking-form" data-offer-form action="https://formspree.io/f/xwpnrgzn" method="POST" style="max-width:400px;margin:0 auto 2em auto;display:flex;flex-direction:column;gap:16px;">
  <div class="offer-notice" data-offer hidden>
    <strong>Mässerbjudande aktiverat</strong><br>
    20% rabatt på hypnos, NLP-coachning och Emotionskoden – 10% på övriga tjänster. Gäller 30 oktober – 30 november.
  </div>
  <input type="hidden" name="Mässerbjudande" value="Nej" disabled>
  <input type="hidden" name="_subject" value="Bokningsförfrågan från hemsidan">
  <select name="Tjänst" id="service-field" data-offer hidden style="padding:12px;border-radius:6px;border:1px solid #f6d2a5;background:#fff;color:#7c5c3e;">
    <option value="">Välj tjänst (valfritt)</option>
    <option value="Hypnos" data-discount="20">Hypnos (20% mässrabatt)</option>
    <option value="NLP-coachning" data-discount="20">NLP-coachning (20% mässrabatt)</option>
    <option value="Emotionskoden" data-discount="20">Emotionskoden (20% mässrabatt)</option>
    <option value="Övrig tjänst" data-discount="10">Övrig tjänst (10% mässrabatt)</option>
  </select>
  <input type="text" name="Namn" placeholder="Namn" data-text-key="booking.label.003" data-text-attr="placeholder" required style="padding:12px;border-radius:6px;border:1px solid #f6d2a5;">
  <input type="email" name="E-post" placeholder="E-post" data-text-key="booking.label.004" data-text-attr="placeholder" required style="padding:12px;border-radius:6px;border:1px solid #f6d2a5;">
  <textarea name="Meddelande" placeholder="Meddelande" data-text-key="booking.label.005" data-text-attr="placeholder" required style="padding:12px;border-radius:6px;border:1px solid #f6d2a5;min-height:100px;"></textarea>
  <button type="submit" class="cta" style="width:100%;font-size:1.1em;" data-text-key="booking.label.002">Skicka bokningsförfrågan</button>
</form>


