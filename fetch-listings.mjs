// Stáhne 2 nejnovější nabídky Marka Lačňáka ze schmidt-reality.cz a uloží je do listings.json + img/listings/.
// Spouští se při každém buildu (viz netlify.toml). Node 18+, žádné závislosti.
// Když cokoli selže, ponechá se předchozí listings.json (stránka se tak nikdy nerozbije).
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIST_URL = process.env.LISTINGS_URL || "https://www.schmidt-reality.cz/makler/marek-lacnak";
const COUNT = 2;
const UA = { "user-agent": "Mozilla/5.0 (compatible; MarekLinkBuilder/1.0)" };

const decode = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&nbsp;/g, " ").replace(/&#8211;|&ndash;/g, "–").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
const get = async url => { const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r; };
const meta = (html, prop) => {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i"));
  return m ? decode(m[1]).trim() : "";
};

// "Prodej bytu 3+1 71 m² – Veselí nad Moravou, ul. Chaloupky - Schmidt Reality - ..." -> pěkný nadpis + lokalita
const NOUN = [
  ["zasíťovaného stavebního pozemku", "Zasíťovaný stavební pozemek"], ["stavebního pozemku", "Stavební pozemek"],
  ["exkluzivního loftového bytu", "Exkluzivní loftový byt"], ["obchodních prostor", "Obchodní prostory"],
  ["rodinného domu", "Rodinný dům"], ["bytu", "Byt"], ["domu", "Dům"], ["pozemku", "Pozemek"],
  ["chaty", "Chata"], ["chalupy", "Chalupa"], ["garáže", "Garáž"], ["kanceláře", "Kancelář"],
];
function parseTitle(ogTitle) {
  const t = ogTitle.split(/\s[-|]\s*Schmidt/i)[0].trim();           // bez názvu firmy
  const type = /^pronáj/i.test(t) ? "Pronájem" : "Prodej";
  let rest = t.replace(/^(prodej|pronájem)\s+/i, "");
  const [what, ...loc] = rest.split(/\s[–-]\s/);
  let title = what.replace(/\s+\d[\d\s,.]*\s?m[²2]\s*$/i, "").trim();    // odstraní koncovou výměru
  for (const [from, to] of NOUN) if (title.toLowerCase().startsWith(from)) { title = to + title.slice(from.length); break; }
  if (title === what.trim()) title = title.charAt(0).toUpperCase() + title.slice(1);
  const dispo = what.match(/\b\d\s?\+\s?(?:kk|\d)\b/i);             // 3+1, 4+kk
  if (dispo && !title.includes(dispo[0])) title += " " + dispo[0];
  return { type, title, location: loc.join(" – ").replace(/,?\s*ul\..*$/i, "").trim() };
}

async function main() {
  const listHtml = await (await get(LIST_URL)).text();
  const seen = new Set(), urls = [];
  for (const m of listHtml.matchAll(/href=["']((?:https?:\/\/www\.schmidt-reality\.cz)?\/nemovitost\/[^"'#?\s]+)["']/gi)) {
    const u = new URL(m[1], LIST_URL).href;
    if (!seen.has(u)) { seen.add(u); urls.push(u); }
    if (urls.length === COUNT) break;
  }
  if (urls.length < COUNT) throw new Error(`Na stránce jsem našel jen ${urls.length} nabídek – změnila se struktura?`);

  await mkdir(join(ROOT, "img/listings"), { recursive: true });
  const items = [];
  for (const [i, url] of urls.entries()) {
    const html = await (await get(url)).text();
    const { type, title, location } = parseTitle(meta(html, "og:title"));
    const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ")).replace(/\s+/g, " ");
    const price = (text.match(/(\d{1,3}(?:[  ]\d{3})+)\s*Kč(?:\s*\/\s*měs\.?)?/) || [])[0]?.replace(/ /g, " ") || "Cena u makléře";
    const area = (text.match(/\b(\d[\d ,.]*)\s?m[²2]\b/) || [])[0]?.replace(/2$/, "²") || "";
    const imgUrl = meta(html, "og:image");
    let image = "";
    if (imgUrl) {
      const buf = Buffer.from(await (await get(imgUrl)).arrayBuffer());
      const ext = (imgUrl.match(/\.(jpe?g|png|webp)(?:\?|$)/i) || [, "jpg"])[1].toLowerCase();
      image = `img/listings/nabidka-${i + 1}.${ext}`;
      await writeFile(join(ROOT, image), buf);
    }
    items.push({ type, title, location, area, price, image, url });
  }
  await writeFile(join(ROOT, "listings.json"), JSON.stringify({ updated: new Date().toISOString(), items }, null, 2));
  console.log("OK – uloženo:", items.map(i => `${i.type}: ${i.title} (${i.location}) ${i.price}`).join(" | "));
}

main().catch(async e => {
  console.warn("fetch-listings: nepodařilo se (ponechávám předchozí data):", e.message);
  try { await readFile(join(ROOT, "listings.json")); } catch { console.warn("listings.json zatím neexistuje – zůstane statická ukázka."); }
  process.exit(0);   // build nikdy neshodíme
});
