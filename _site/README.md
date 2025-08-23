# Release & Heal – Jekyll & GitHub Pages

## Kom igång lokalt

1. **Installera Ruby**

   - Ladda ner och installera Ruby från [rubyinstaller.org](https://rubyinstaller.org/) (Windows).

2. **Installera Bundler**

   - Öppna terminalen och kör:
     ```
     gem install bundler
     ```

3. **Installera beroenden**

   - Kör i projektmappen:
     ```
     bundle install
     ```

4. **Starta Jekyll-servern**
   - Kör:
     ```
     bundle exec jekyll serve
     ```
   - Besök `http://localhost:4000` i webbläsaren.

## Publicera på GitHub Pages

- Pusha till GitHub.
- Aktivera GitHub Pages i repo-inställningarna och välj branch `main` och rotmapp (`/`).

## Struktur

- `_config.yml` – Jekyll-konfiguration
- `_layouts/` – HTML-layouts
- `_posts/` – Blogginlägg
- `index.md` – Startsida
- `style.css` – Stilmall
- `Gemfile` – Ruby-gems

---

Frågor? Kontakta [din@email.se](mailto:din@email.se)

