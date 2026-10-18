(function () {
  // Mässerbjudandet gäller 30 oktober – 30 november 2026. Ändra datumen här vid behov.
  // Efter slutdatumet döljs allt automatiskt och sidan blir som vanligt.
  var START = new Date(2026, 9, 30, 0, 0, 0); // 30 oktober 2026 (månad är 0-indexerad)
  var END = new Date(2026, 11, 1, 0, 0, 0); // exklusivt: 1 december 2026

  var now = new Date();
  if (now < START || now >= END) return;

  document.querySelectorAll("[data-offer]").forEach(function (el) {
    el.hidden = false;
  });

  document.querySelectorAll("form[data-offer-form]").forEach(function (form) {
    var service = form.querySelector('select[name="Tjänst"]');
    var offer = form.querySelector('input[name="Mässerbjudande"]');
    var subject = form.querySelector('input[name="_subject"]');
    var message = form.querySelector('textarea[name="Meddelande"]');
    if (!offer) return;

    // Förifyll tjänst från ?tjanst=hypnos|nlp|emotionskoden|ovrigt
    if (service) {
      var map = { hypnos: "Hypnos", nlp: "NLP-coachning", emotionskoden: "Emotionskoden", ovrigt: "Övrig tjänst" };
      var params = new URLSearchParams(window.location.search);
      var wanted = map[(params.get("tjanst") || "").toLowerCase()];
      if (wanted) service.value = wanted;
    }

    function update() {
      var chosen = service && service.value ? service.value : "";
      var opt = service ? service.options[service.selectedIndex] : null;
      var pct = opt && opt.dataset.discount ? opt.dataset.discount + "%" : "10–20%";
      offer.value = "JA – mässerbjudande (" + pct + " rabatt)" + (chosen ? " på " + chosen : "");
      if (subject) {
        subject.value = "MÄSSERBJUDANDE – bokningsförfrågan" + (chosen ? " (" + chosen + ")" : "");
      }
    }

    offer.disabled = false;
    update();
    if (service) service.addEventListener("change", update);

    if (message && !message.value) {
      message.value = "Hej! Jag vill gärna boka med mässerbjudandet.";
    }
  });
})();
