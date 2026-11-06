// ===== CONFIG – tady změň kontakty (přepíše se všude na stránce) =====
const CONFIG = {
  phone: "+420606263264",
  phoneLabel: "+420 606 263 264",
  email: "marek.lacnak@schmidt-reality.cz", // OVĚŘIT s Markem – patří jiné firmě!
};

document.querySelectorAll("[data-tel]").forEach(a => a.href = "tel:" + CONFIG.phone);
document.querySelectorAll("[data-tel-text]").forEach(e => e.textContent = CONFIG.phoneLabel);
document.querySelectorAll("[data-mail]").forEach(a => {
  a.href = "mailto:" + CONFIG.email + (a.href.includes("?") ? a.href.slice(a.href.indexOf("?")) : "");
});
document.querySelectorAll("[data-mail-text]").forEach(e => e.textContent = CONFIG.email);

// Sticky lišta: ukáže se, až kontaktní karta v hero zmizí z obrazovky; v patičce se schová
const sticky = document.getElementById("sticky");
const state = { heroGone: false, footer: false };
const update = () => sticky.classList.toggle("is-hidden", !state.heroGone || state.footer);
new IntersectionObserver(([e]) => { state.heroGone = !e.isIntersecting && e.boundingClientRect.top < 0; update(); })
  .observe(document.getElementById("kcard"));
new IntersectionObserver(([e]) => { state.footer = e.isIntersecting; update(); }, { threshold: 0.25 })
  .observe(document.getElementById("kontakt"));

// ===== Aktuální nabídka: 2 nejnovější nemovitosti z listings.json (vytváří scripts/fetch-listings.mjs při buildu) =====
(async () => {
  try {
    const res = await fetch("listings.json", { cache: "no-cache" });
    if (!res.ok) return;                       // soubor neexistuje -> zůstane statická ukázka v HTML
    const { items } = await res.json();
    if (!items || !items.length) return;
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const arrow = '<span class="btn__arrow"><svg viewBox="0 0 24 24"><use href="#i-arrow"/></svg></span>';
    document.getElementById("cards").innerHTML = items.slice(0, 2).map(i => `
      <article class="pcard">
        ${i.image ? `<img src="${esc(i.image)}" alt="${esc(i.title)}" loading="lazy">` : ""}
        <div class="pcard__shade"></div>
        <span class="tag">${esc(i.type)}</span>
        <div class="pcard__txt"><h3>${esc(i.title)}</h3><p>${esc([i.location, i.area, i.price].filter(Boolean).join(" · "))}</p></div>
        <a class="btn btn--glass pcard__btn" href="${esc(i.url)}" target="_blank" rel="noopener">Zobrazit detail ${arrow}</a>
      </article>`).join("");
  } catch (e) { /* ponecháme statickou ukázku */ }
})();
