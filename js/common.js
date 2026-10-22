import { SITE, DEMO } from "./config.js";
import { store } from "./data.js";

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const rand = n => "R" + Number(n || 0).toLocaleString("en-ZA");
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export function toast(msg, bad = false) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " bad" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3500);
}

export function waNumber(phone) {
  const p = String(phone || "").replace(/\D/g, "");
  return p.startsWith("0") ? "27" + p.slice(1) : p;
}

export function chrome(active) {
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="brand" href="index.html"><span class="logo">K</span><span>${SITE.name}</span></a>
    <nav>
      <a href="index.html" class="${active === "browse" ? "on" : ""}">Find a place</a>
      <a href="owner.html" class="${active === "owner" ? "on" : ""}">List your property</a>
      <a href="about.html" class="${active === "about" ? "on" : ""}">How it works</a>
      <a href="admin.html" id="adminLink" class="${active === "admin" ? "on" : ""}" hidden>Admin</a>
    </nav>`;
  document.body.prepend(header);
  if (DEMO) {
    const b = document.createElement("div");
    b.className = "demo-bar";
    b.textContent = "Demo mode: listings and accounts are saved in this browser only until the database is connected.";
    header.after(b);
  }
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <p><strong>${SITE.name}</strong> · Homes at ${rand(SITE.maxRent)} a month or less, listed by owners. No agents, no listing fees for tenants.</p>
    <p>Never pay a deposit before you have viewed the property and signed a lease. <a href="about.html#safety">Rental safety tips</a> · <a href="about.html#privacy">Privacy (POPIA)</a> · <a href="about.html#terms">Terms</a> · <a href="mailto:${SITE.supportEmail}">Contact</a></p>`;
  document.body.appendChild(footer);
  store.onAuth(u => { const a = $("#adminLink"); if (a) a.hidden = !(u && u.admin); });
}

export function photoBlock(l, cls = "") {
  const src = l.thumb || (l.photos && l.photos[0]);
  if (src) return `<img class="${cls}" src="${esc(src)}" alt="${esc(l.title)}" loading="lazy">`;
  return `<div class="${cls} nophoto"><svg viewBox="0 0 24 24" width="42" height="42"><path fill="currentColor" d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z"/></svg></div>`;
}
