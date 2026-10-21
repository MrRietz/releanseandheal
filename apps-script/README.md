# Tidsbokning för Release & Heal (prototyp)

Kunden ser lediga tider i en kalender på bokningssidan, väljer en tid och skickar formuläret som vanligt. Tiden följer med i mejlet och blir samtidigt reserverad i ett Google-ark, så att nästa kund inte kan välja den.

**Så länge inget är ifyllt syns ingen kalender och formuläret fungerar precis som förut.**

## Del 1: För Elisabeth (inga kunskaper om kod behövs)

### Lägga till och ta bort tider

Allt görs i Google-arket, fliken **Tider**. Varje rad är en tid.

| Datum | Tid | Längd | Status | Reserverad |
| --- | --- | --- | --- | --- |
| 2026-11-06 | 14:00 | 60 | Ledig | |

- **Lägga till en tid:** skriv en ny rad med datum (`2026-11-06`), tid (`14:00`) och status `Ledig`. Längd är frivillig. Lämna **Reserverad** tom.
- **Ta bort en tid:** ändra statusen till något annat än `Ledig` (till exempel `Bokad`) eller radera raden. Tiden försvinner från hemsidan inom några minuter.
- **När en kund har skickat en förfrågan** står tiden som `Reserverad` med klockslag. Bekräfta med kunden och ändra till `Bokad`. Vill du släppa tiden igen, skriv `Ledig` och töm kolumnen Reserverad.
- Statusar: `Ledig` (syns för kunder), `Reserverad` (någon har valt tiden, syns inte), `Bokad` (bekräftad, syns inte).
- Det kan dröja några minuter innan ändringar syns på hemsidan, eftersom Google först publicerar om arket.

Namn och e-post hamnar **aldrig** i arket. De kommer bara i mejlet från bokningsformuläret.

### Din kalender

- När en kund reserverar en tid dyker den upp i din Google Kalender som **Reserverad: ...** (tjänsten efter kolonet). Kundens namn och kontaktuppgifter finns inte där, bara i mejlet. Ingen blir inbjuden.
- När du har bekräftat tiden med kunden: ändra händelsens rubrik i kalendern så att du ser att den är bokad.
- Sätter du tillbaka **Ledig** i arket försvinner händelsen ur kalendern av sig själv.

## Del 2: Uppsättning (Robin)

### 1. Skapa arket

Skapa ett nytt Google-ark (privat) med två flikar:

**Tider** (rad 1 är rubriker, exakt så här):

| Kolumn | Rubrik | Innehåll |
| --- | --- | --- |
| A | Datum | `YYYY-MM-DD`, till exempel `2026-11-06` |
| B | Tid | `HH:MM`, till exempel `14:00` |
| C | Längd | minuter, frivillig |
| D | Status | `Ledig`, `Reserverad` eller `Bokad` |
| E | Reserverad | tidsstämpel, skrivs av skriptet |
| F | Händelse-id | kalenderhändelsens id, skrivs av skriptet, rör ej |

Markera kolumnerna A och B och välj Format > Siffror > Oformaterad text, så att datum och tid inte omvandlas av Google. Skriptet klarar även riktiga datum och tider, men oformaterad text är säkrast.

**Logg**: skapas automatiskt av skriptet vid första anropet (kolumner: Tidsstämpel, Utfall, Datum, Tid, Tjänst, Klient, Meddelande). Här syns varje försök, även avvisade. Publicera aldrig den här fliken.

### 2. Lägg in skriptet

1. I arket: **Tillägg > Apps Script**.
2. Ta bort koden som finns och klistra in hela innehållet i `apps-script/Code.gs`.
3. Byt `PASTE_SPREADSHEET_ID_HERE` överst mot arkets id (den långa texten i arkets adress mellan `/d/` och `/edit`).
4. Spara.

### 3. Publicera som webbapp

1. **Distribuera > Ny distribution > Typ: Webbapp**.
2. **Kör som: Jag**. **Vem har åtkomst: Alla**.
3. Godkänn behörigheterna när Google frågar.
4. Kopiera webbappens adress (slutar på `/exec`). Öppna den i webbläsaren: du ska se `{"ok":true}`.

Ändrar du koden senare måste du skapa en **ny version** under Distribuera > Hantera distributioner, annars gäller den gamla koden.

### Kalenderhändelser

När en tid reserveras skapar skriptet en händelse i Google Kalender hos kontot som kör webbappen.

1. Gör uppsättningen i Elisabeths Google-konto (då används hennes standardkalender). Alternativt: dela hennes kalender med redigeringsrätt med den som deployar och sätt `CALENDAR_ID` överst i `Code.gs` till kalenderns id. Tomt `CALENDAR_ID` betyder kontots standardkalender.
2. Vid deployen frågar Google om åtkomst till kalendern. Godkänn.
3. Skapa en utlösare så att händelsen tas bort när hon sätter tillbaka `Ledig`: **Apps Script > Utlösare > Lägg till utlösare**, funktion `onStatusEdit`, händelsekälla **Från kalkylblad**, händelsetyp **Vid redigering**. Godkänn behörigheterna. Utlösaren måste vara installerbar, den enkla `onEdit` räcker inte för kalendern.
4. Kalendern innehåller: rubriken `Reserverad: <tjänst>` (`Reserverad tid` om tjänst saknas), start och längd från arket (60 minuter om Längd är tom eller ogiltig) och en beskrivning med Tid-koden. Den innehåller **inget** namn, ingen e-post och ingen gäst eller inbjudan.
5. Händelsens id sparas i kolumn F på raden. Skriptet skapar rubriken `Händelse-id` själv om den saknas. När status sätts till `Ledig` tas händelsen bort och kolumn E och F töms.
6. Ett fel i kalendern stoppar inte reservationen. Det loggas som `calendar-error` i fliken Logg. Borttagningen loggas som `calendar-released`.
7. Stäng av genom att sätta `CALENDAR_ENABLED = false` överst i `Code.gs` och skapa en ny version av distributionen. Ta gärna bort utlösaren också.

Obs: kolumn F syns i den publicerade CSV-adressen för fliken Tider. Id:t är inte en hemlighet och ger ingen åtkomst till kalendern, och hemsidan läser inte kolumnen.

### 4. Publicera bara fliken Tider som CSV

1. **Arkiv > Dela > Publicera på webben**.
2. Välj fliken **Tider** (inte "Hela dokumentet") och formatet **CSV**.
3. Publicera och kopiera adressen.

Kontrollera att Logg inte går att nå genom den adressen.

### 5. Fyll i adresserna på hemsidan

Öppna `public/js/tider-config.js` och klistra in de två adresserna:

```js
window.TIDER_CONFIG = {
  csvUrl: "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv",
  reserveApiUrl: "https://script.google.com/macros/s/.../exec"
};
```

Tomma värden betyder ingen kalender.

### 6. Prova

- **Demo först:** gå till `/bokning/?tider=demo`. Då visas exempeltider (vardagar 10:00, 13:00 och 15:00, närmaste tre veckorna) och inget skickas eller reserveras på riktigt. Lokalt: `bundle exec jekyll serve` och öppna `http://localhost:4000/bokning/?tider=demo`.
- **Riktigt läge:** lägg en testtid i arket, öppna `/bokning/`, välj tiden och skicka. Kontrollera att raden blir `Reserverad`, att mejlet har fälten **Tid** och **Tid-kod**, och att raden syns i **Logg**. Sätt tillbaka `Ledig` efteråt.
- **Kalender:** kontrollera att en händelse `Reserverad: ...` skapades i kalendern vid reservationen (med rätt start och längd, utan namn eller gäst), att kolumn F fick ett id, och att händelsen försvinner och kolumn E och F töms när du sätter tillbaka `Ledig`. Fel syns som `calendar-error` i Logg.

## Så fungerar det för kunden

- Kunden väljer en tid eller kryssar i "Ingen av tiderna passar, kontakta mig". Ett av dem krävs för att kunna skicka.
- Vid skicka frågar sidan arket om tiden fortfarande är ledig. Är den det reserveras den och formuläret skickas till Formspree som vanligt. Är den upptagen får kunden välja en annan.
- Går något fel (till exempel att Google inte svarar) får kunden ett vänligt meddelande och kan skicka ändå med kryssrutan.
- Går det inte att läsa tiderna alls fungerar formuläret som utan kalender.

## Risker och begränsningar

- **Öppen webbapp:** adressen måste vara öppen ("Alla") och kan därför missbrukas. Skriptet har en spärr (några försök per besökare, och ett tak för alla tillsammans), ett honungsfält och en logg, men det är inget fullständigt skydd. Någon kan ändå reservera tider i onödan. Då är det bara att sätta tillbaka `Ledig` i arket.
- **Ingen koll mot Elisabeths egen kalender:** skriptet vet inget om andra bokningar. Lägger hon en tid som `Ledig` som krockar med något annat blir det dubbelbokat. Håll arket uppdaterat.
- **Reserverade tider släpps inte automatiskt.** Har en kund reserverat och sedan inte skickat, står tiden kvar som `Reserverad` tills Elisabeth ändrar den.
- **Personuppgifter ska inte in i arket.** Skriptet sparar bara datum, tid, vald tjänst och ett slumpmässigt besökar-id i loggen. Lägg aldrig namn, e-post eller telefonnummer i arket, för fliken Tider är publik.
- Tider som redan passerat visas inte och går inte att reservera.
