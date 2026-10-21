(function () {
  // Mässerbjudandet gäller 30 oktober – 30 november 2026. Ändra datumen här vid behov.
  // Efter slutdatumet döljs allt som rör erbjudandet automatiskt och sidan blir som vanligt.
  var START = new Date(2026, 9, 30, 0, 0, 0); // 30 oktober 2026 (månad är 0-indexerad)
  var END = new Date(2026, 11, 1, 0, 0, 0); // exklusivt: 1 december 2026

  var now = new Date();
  var offerActive = now >= START && now < END;

  if (offerActive) {
    document.querySelectorAll("[data-offer]").forEach(function (el) {
      el.hidden = false;
    });
  }

  document.querySelectorAll("form[data-offer-form]").forEach(function (form) {
    var service = form.querySelector('select[name="Tjänst"]');
    var offer = form.querySelector('input[name="Mässerbjudande"]');
    var subject = form.querySelector('input[name="_subject"]');
    var message = form.querySelector('textarea[name="Meddelande"]');

    // Förifyll tjänst från ?tjanst=<slug> (länkarna "Boka" på Tjänster-sidan). Gäller året runt.
    if (service) {
      var slug = (new URLSearchParams(window.location.search).get("tjanst") || "").toLowerCase();
      if (slug) {
        var options = service.querySelectorAll("option[data-slug]");
        for (var i = 0; i < options.length; i++) {
          if (options[i].getAttribute("data-slug") === slug) {
            service.value = options[i].value;
            break;
          }
        }
      }
    }

    if (!offerActive || !offer) return;

    // Visa rabatten på varje tjänst i listan under mässan.
    if (service) {
      service.querySelectorAll("option[data-discount]").forEach(function (opt) {
        var pct = opt.dataset.discount;
        if (pct && pct !== "0") opt.textContent += " (" + pct + " %)";
      });
    }

    function update() {
      var chosen = service && service.value ? service.value : "";
      var opt = service ? service.options[service.selectedIndex] : null;
      var pct = opt && opt.dataset.discount ? opt.dataset.discount : "";
      if (pct === "0") {
        offer.value = "JA – mässerbjudande (gäller inte det gratis samtalet)";
      } else {
        offer.value = "JA – mässerbjudande (" + (pct ? pct + "%" : "10–20%") + " rabatt)" + (chosen ? " på " + chosen : "");
      }
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
