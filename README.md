# Marek Lačňák – link in bio

Statická stránka (index.html, style.css, main.js, složka img). Žádný build, žádné závislosti.

## Co upravit
1. **Kontakty** – `main.js`, blok CONFIG (telefon + e-mail se přepíše všude).
2. **Fotky** – nahraď v `img/`: `marek.jpg` (portrét 4:5), `nemovitost-1.jpg`, `nemovitost-2.jpg`, `og.jpg` (náhled při sdílení, 1200×630).
3. **Nabídky** – v `index.html` kopíruj blok `<article class="card">`, uprav název/cenu a odkaz na detail (href="#").
4. **Hodnocení** – texty v `<blockquote class="review">` nahraď skutečnými z Googlu; odkaz „Všechna hodnocení“ změň na odkaz na Markův Google profil.
5. **Facebook** odkaz v patičce (href="#").

## Nasazení (zdarma)
Netlify: app.netlify.com/drop → přetáhni celou složku. Hotovo, dostaneš URL. Vlastní doménu přidáš v Domain settings.
Alternativně Cloudflare Pages / Vercel (nahrát složku).
Do Instagram bio vlož výslednou URL.

## Automatické nabídky (2 nejnovější z Markovy stránky)
`scripts/fetch-listings.mjs` při každém buildu stáhne 2 první nabídky z
https://www.schmidt-reality.cz/makler/marek-lacnak (název, typ, lokalita, cena, hlavní fotka z detailu)
a uloží je do `listings.json` a `img/listings/`. Karty na webu se z něj vykreslí.
Netlify spustí skript sám (netlify.toml). Aby se nabídky aktualizovaly i bez ruční změny:
1. Netlify → Site configuration → Build hooks → vytvoř hook, zkopíruj URL.
2. Na cron-job.org (zdarma) nastav POST na tuto URL např. každých 6 hodin.
Pokud stahování selže, zůstane poslední stav (nebo statická ukázka v index.html) – web se nerozbije.
Lokální test: `node scripts/fetch-listings.mjs` (Node 18+).
