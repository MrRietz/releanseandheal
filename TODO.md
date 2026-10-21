# Att göra: tidsbokning (gren `feat/tidsbokning`)

Prototypen är klar och provad i demoläge (`/bokning/?tider=demo`). Det här återstår.

## Uppsättning (se `apps-script/README.md`)

- [ ] Skapa ett privat Google-ark med fliken `Tider` (Datum, Tid, Längd, Status, Reserverad).
- [ ] Klistra in `apps-script/Code.gs` i arket och byt `PASTE_SPREADSHEET_ID_HERE` mot arkets id.
- [ ] Deploya som webbapp (Kör som: jag, åtkomst: alla) och kontrollera att adressen svarar `{"ok":true}`.
- [ ] Publicera bara fliken `Tider` som CSV, och kontrollera att `Logg` inte går att nå.
- [ ] Fyll i de två adresserna i `public/js/tider-config.js`.
- [ ] Prova skarpt: lägg en testtid, boka den, och kontrollera att raden blir `Reserverad`, att mejlet har fälten `Tid` och `Tid-kod`, och att `Logg` fylls. Sätt tillbaka `Ledig` efteråt.

## Tillsammans med mamma

- [ ] Visa hur hon lägger till och tar bort tider i arket.
- [ ] Bestäm vem som sätter tillbaka tider som avbokas, och när `Reserverad` blir `Bokad`.
- [ ] Bestäm om kalendern också ska finnas på startsidans formulär (idag bara bokningssidan).

## Kalenderuppdatering (förslag)

- [ ] Skapa en händelse i hennes Google Kalender när en tid reserveras ("Reserverad: tjänst, längd").
  - Spara händelsens id i kolumn F så att den kan tas bort om tiden släpps.
  - Uppsättningen görs i hennes Google-konto, eller så delas kalendern med redigeringsrätt.
  - Skicka inte med kundens namn eller e-post, och bjud inte in kunden som gäst (missbruksrisk).
- [ ] Senare, valfritt: läs hennes kalender och räkna fram lediga tider i stället för att hon fyller i arket.

## Innan merge

- [ ] Låt en granskare gå igenom `apps-script/Code.gs` (lås, spärrar, tidszon, honeypot).
- [ ] Skapa MR och merga `feat/tidsbokning` till `main`.
