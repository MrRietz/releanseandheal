# Så ändrar du texterna på hemsidan

Alla texter ligger i vanliga textfiler som du kan ändra direkt i webbläsaren på GitHub. Du behöver inte installera något.

## Var finns vilken text?

| Du vill ändra… | Öppna filen |
| --- | --- |
| Första sidan (välkomsttext, tystnadsplikt, betalning) | `index.md` |
| Om mig | `om.md` |
| Texten på Tjänster-sidan (intro, betalning) | `tjanster.md` |
| Priser och tider i tjänstetabellen | `_data/tjanster.yml` |
| Vanliga frågor | `_data/vanliga-fragor.yml` |
| "Så går det till" (3 steg) | `_data/sa-gar-det-till.yml` |
| Texten överst på sidan Så arbetar jag | `sa-arbetar-jag.md` |
| **En metod** (NLP, Hypnos, Reiki, …) | filen i mappen `_metoder/`, t.ex. `_metoder/5-reiki.md` |
| EFT-infografiken | `_data/eft.yml` |
| Omdömen (bilder och alt-texter) | `_data/omdomen.yml` |

## Så gör du

1. Logga in på github.com och öppna repot **MrRietz/releanseandheal**.
2. Klicka dig fram till filen (mapparna ligger i listan), eller tryck på `t` och skriv filnamnet.
3. Klicka på **pennan** uppe till höger (Edit this file).
4. Ändra texten. Fliken **Preview** visar ungefär hur det ser ut.
5. Klicka **Commit changes…**, skriv kort vad du ändrat (t.ex. "Ny text om Reiki") och bekräfta.
6. Efter en till två minuter är ändringen publicerad på releaseandheal.se. Ladda om med Ctrl+F5 om du inte ser den.

Blir det fel kan Robin alltid ångra ändringen. Inget går förlorat.

## En metodfil, steg för steg

Överst i filen, mellan de två strecken `---`, står det som visas på kortet:

```
---
titel: Reiki
undertitel: Fyll på med ny livsenergi
ingress: 'De första meningarna som syns på kortet.'
pris: 60 min · 850 kr
boka: reiki
---
```

- `ingress` är texten som syns på kortet. Skriv den inom enkla citattecken `'...'`. Ska en apostrof ingå, skriv den dubbelt (`''`).
- `pris` är raden under texten på kortet.
- Rör inte `boka` (den kopplar knappen till rätt tjänst i bokningsformuläret).

**Allt under de två strecken** är texten som visas när man klickar på **Läs mer**. Den skrivs så här:

| Du skriver | Du får |
| --- | --- |
| `#### Så här gör jag` | en underrubrik |
| `**text**` | **fet text** |
| `*text*` | *kursiv text* |
| `- text` (en rad per punkt) | punktlista med hjärta |
| `1. text` (en rad per steg) | numrerad lista |
| `[Klicka här](https://adress.se)` | en länk |
| en tom rad | nytt stycke |

## Ändra ett pris

Öppna `_data/tjanster.yml`. Varje tjänst ser ut så här. Ändra bara texten efter `pris:` eller `tid:`:

```
- namn: Reiki
  tid: '60 min'
  pris: 850 kr
  boka: reiki
  rabatt: 10
```

Priset på metodkortet på sidan Så arbetar jag ändrar du separat, på raden `pris:` överst i metodens fil.

## Det här ska du inte röra

- Rader som börjar med `{%` eller `{:` eller `<`. De styr hur sidan byggs.
- Mapparna `_layouts` och `_includes`, filen `style.css` och filen `_config.yml`.
- Ordet efter `boka:` och siffran efter `rabatt:`.

Är du osäker: ändra en liten sak, titta på Preview och fråga Robin.
