# Analys: tidsbokning för Release & Heal

Datum: 2026-10-21. Gren: `feat/tidsbokning`. Status: prototyp, provad i demoläge, ej uppsatt mot ett riktigt ark.

## Mål

Kunden ska kunna välja en ledig tid direkt på bokningssidan. Tiden ska följa med i det befintliga Formspree-mejlet, bli upptagen för nästa kund, och dyka upp i Elisabeths egen Google Kalender. Elisabeth ska kunna sköta lediga tider själv, utan kodkunskaper.

Krav som styrde valen:
- Sidan är statisk (Jekyll på GitHub Pages) och ska förbli det.
- Formspree behålls för själva bokningsförfrågan.
- Det tidigare försöket med Excel och Google-ark för texter blev bökigt, så lösningen ska vara enklare att sköta.
- Ingen onödig personuppgiftshantering.

## Alternativ som vägdes

| Alternativ | Fördelar | Nackdelar | Bedömning |
| --- | --- | --- | --- |
| Färdigt bokningsverktyg (Google Kalender bokningssida, Cal.com, Bokadirekt) | Minst underhåll, tiden blir upptagen, bekräftelsemejl, synkar med hennes kalender | Ligger bredvid Formspree i stället för i formuläret, mindre kontroll över utseendet, ev. kostnad | Bra reservplan, valdes inte eftersom önskemålet var tid i Formspree-formuläret |
| Ark med lediga tider och rullgardin i formuläret | Enkelt | Tiden blir inte upptagen, hon måste stryka den själv | Räcker inte |
| Önskemål utan kalender (kunden skriver 2–3 tider) | Enklast | Mycket mejlande fram och tillbaka | Inte det som efterfrågades |
| Kalendervy + Google-ark + Apps Script (valt) | Tiden reserveras direkt, ligger i Formspree-mejlet, samma mönster som Noahs schema, gratis | Mer egen kod att underhålla, hon måste hålla arket uppdaterat | Valt som prototyp |

## Valt upplägg

1. Elisabeth lägger lediga tider i fliken `Tider` i ett privat Google-ark (Datum, Tid, Längd, Status).
2. Sidan läser fliken som publicerad CSV och visar en veckovy. Bara framtida tider med status `Ledig` visas.
3. Kunden väljer en tid. Vid "Skicka" anropar sidan först Apps Script-webbappen, som med lås kontrollerar att tiden fortfarande är ledig och sätter den till `Reserverad`.
4. Går reservationen igenom skickas formuläret vidare till Formspree med fälten `Tid` (läsbart) och `Tid-kod` (ISO). Var tiden redan tagen får kunden välja en annan.
5. Webbappen skapar en händelse i Elisabeths Google Kalender ("Reserverad: tjänst"). Sätter hon tillbaka `Ledig` tas händelsen bort av en utlösare.

Ordningen är medvetet "reservera först, skicka sedan". Då kan två kunder inte få samma tid, och en misslyckad Formspree-sändning är det mindre problemet av de två.

Kunden kan alltid välja "Ingen av tiderna passar, kontakta mig", så att formuläret fungerar även när inga tider finns eller något går fel.

## Säkerhet och personuppgifter

- **Ingen persondata i arket.** Namn och e-post följer bara med Formspree-mejlet. Arket innehåller datum, tid, status och en teknisk klientkod i loggen.
- **Publicera bara fliken `Tider`.** `Logg` får aldrig publiceras.
- **Öppen webbapp.** Webbappen måste vara nåbar för alla, så vem som helst kan försöka reservera tider. Skydd: honeypotfält, spärr per klient, globalt tak, logg av varje försök. Hon kan släppa tider genom att sätta tillbaka `Ledig`. Restrisken är att någon blockerar tider på skämt.
- **Kalendern.** Ingen kunddata läggs i händelsen och kunden bjuds inte in som gäst. En inbjudan skulle låta vem som helst få skriptet att skicka kalenderinbjudningar till valfri adress.
- **Hemligheter.** Inga nycklar eller riktiga ark-id ligger i repot. Ark-id och webbappens adress fylls i vid uppsättningen.

## Kalenderuppdatering

Vald variant (liten): händelse skapas vid reservation och tas bort när tiden släpps. Uppsättningen görs i Elisabeths Google-konto, eller så delas hennes kalender med redigeringsrätt och `CALENDAR_ID` fylls i. Ett fel i kalendern stoppar inte reservationen, utan loggas.

Möjlig fortsättning (stor variant): skriptet läser hennes kalender och räknar fram lediga tider i stället för att hon fyller i arket. Det tar bort risken för dubbelbokning mot hennes egen kalender, men är mer jobb och ersätter arket som källa. Bedömning: värt att göra först när den lilla varianten har använts en tid.

## Kända begränsningar

- **Dubbelbokning mot hennes egen kalender.** Arket och kalendern synkas inte åt det hållet. Hon måste ta bort tider i arket som hon själv blockerat.
- **Fördröjning i publicerad CSV.** Google kan cacha den publicerade fliken i några minuter. En kund kan därför se en tid som just reserverats. Reservationen kontrollerar mot arket vid skick, så kunden får då "Tiden hann bli bokad".
- **Reserverad är inte bokad.** Statusen `Reserverad` sätts automatiskt. Hon bekräftar och ändrar rubriken eller statusen själv.
- **Avbokning är manuell.** En tid släpps genom att hon sätter tillbaka `Ledig`.
- **Underhåll.** Apps Script-koden är egen kod. Ändras den måste en ny version av distributionen skapas.
- **Händelse-id i den publicerade CSV:n.** Kolumn F (Händelse-id) följer med när fliken `Tider` publiceras. Id:t går inte att använda utan åtkomst till hennes kalender, men det är onödig information. Alternativ senare: flytta id:t till en egen privat flik.
- **Kalenderloggen räknas i spärren.** Loggrader som börjar på `calendar-` räknas i det globala taket mot missbruk. Taket är högt i förhållande till normal användning, men kan justeras.
- **Inget lås vid borttagning.** `onStatusEdit` tar inget lås. Två redigeringar i samma sekund på samma rad är osannolikt, men inte uteslutet.
- **Kalenderrubriken.** Rubriken innehåller tjänstens namn från formuläret, avkortad. Den skickas från webbläsaren och kan därför innehålla fri text från den som anropar webbappen. Den visas bara i hennes egen kalender.

## Vad som är provat

Provat:
- Kalendervyn i demoläge (`?tider=demo`) i webbläsare: veckovyn, stegning mellan veckor, val av tid, fälten `Tid` och `Tid-kod`, kryssrutan "Ingen av tiderna passar".
- Utan konfiguration är bokningssidan oförändrad (kalendern dold, fälten avstängda).
- Syntaxkontroll av skripten med `node --check`.

Inte provat:
- Riktigt Google-ark, publicerad CSV och webbapp.
- Reservation mot arket, lås, spärrar och loggning.
- Kalenderhändelser och utlösaren som tar bort dem.
- Hela flödet till ett riktigt Formspree-mejl med fälten `Tid` och `Tid-kod`.
- Granskning av `Code.gs` av någon annan.

## Beslut som återstår

1. Ska kalendern också finnas på startsidans formulär? Idag finns den bara på bokningssidan.
2. Vem sätter tillbaka tider som avbokas, och när blir `Reserverad` `Bokad`?
3. Ska den stora varianten (läsa hennes kalender) göras senare?
4. Ska färdigt bokningsverktyg vara reservplan om arbetet med arket blir för tungt?

## Nästa steg

Se `TODO.md` i repots rot. Kortfattat: skapa arket, lägg in skriptet, deploya webbappen, publicera fliken `Tider`, fyll i adresserna, skapa utlösaren, prova skarpt, gå igenom med Elisabeth, låt en granskare läsa `Code.gs`, och skapa MR.
