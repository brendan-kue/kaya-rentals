import { PROVINCES, PROPERTY_TYPES } from "./config.js";
import { store } from "./data.js";
import { chrome, esc, rand, $, toast, waNumber, photoBlock } from "./common.js";

chrome("browse");
const form = $("#filters");
PROVINCES.forEach(p => form.province.add(new Option(p, p)));
PROPERTY_TYPES.forEach(p => form.type.add(new Option(p, p)));

// Restore filters from URL so searches are shareable
const params = new URLSearchParams(location.search);
for (const [k, v] of params) if (form[k]) form[k].value = v;
if (params.get("sort")) $("#sort").value = params.get("sort");

let current = [];

async function load() {
  const f = Object.fromEntries(new FormData(form));
  f.sort = $("#sort").value;
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  history.replaceState(null, "", qs ? "?" + qs : location.pathname);
  $("#count").textContent = "Loading listings…";
  try {
    current = await store.listPublic(f);
  } catch (e) {
    console.error(e); $("#count").textContent = "Couldn't load listings. Please refresh."; return;
  }
  $("#count").textContent = `${current.length} ${current.length === 1 ? "home" : "homes"} to rent`;
  $("#empty").hidden = current.length > 0;
  $("#grid").innerHTML = current.map(card).join("");
  if (params.get("listing")) { open(params.get("listing")); params.delete("listing"); }
}

function card(l) {
  return `<article class="card" data-id="${esc(l.id)}" tabindex="0">
    <div class="ph">${photoBlock(l)}${l.verified ? '<span class="badge ok">Owner verified</span>' : ""}</div>
    <div class="body">
      <div class="price">${rand(l.rent)} <small>/ month</small></div>
      <h3>${esc(l.title)}</h3>
      <p class="muted">${esc(l.type)} · ${esc(l.suburb)}, ${esc(l.city)}</p>
      <p class="muted small">${l.bedrooms ? esc(l.bedrooms) + " bed · " : ""}${esc(l.province)}</p>
    </div>
  </article>`;
}

async function open(id) {
  const l = current.find(x => x.id === id) || await store.getListing(id);
  if (!l || l.status !== "approved") return toast("That listing is no longer available.", true);
  const d = $("#detail");
  const photos = (l.photos || []).length ? l.photos.map(p => `<img src="${esc(p)}" alt="" loading="lazy">`).join("") : photoBlock(l, "big");
  const msg = encodeURIComponent(`Hi, I saw your listing "${l.title}" on Kaya Rentals. Is it still available?`);
  d.innerHTML = `
    <button class="close" aria-label="Close">×</button>
    <div class="gallery">${photos}</div>
    <div class="detail-body">
      <div class="price">${rand(l.rent)} <small>/ month</small></div>
      <h2>${esc(l.title)}</h2>
      <p class="muted">${esc(l.type)} · ${esc(l.suburb)}, ${esc(l.city)}, ${esc(l.province)}</p>
      <ul class="facts">
        <li><b>Deposit</b>${l.deposit ? rand(l.deposit) : "Ask owner"}</li>
        <li><b>Bedrooms</b>${esc(l.bedrooms || "—")}</li>
        <li><b>Bathrooms</b>${esc(l.bathrooms || "—")}</li>
        <li><b>Available</b>${esc(l.availableFrom || "Now")}</li>
      </ul>
      <p class="desc">${esc(l.description).replace(/\n/g, "<br>")}</p>
      ${(l.features || []).length ? `<div class="chips">${l.features.map(f => `<span>${esc(f)}</span>`).join("")}</div>` : ""}
      <div class="owner-box">
        <p><b>Listed by the owner:</b> ${esc(l.ownerName || "Owner")} ${l.verified ? '<span class="badge ok inline">Verified</span>' : ""}</p>
        <div class="actions">
          ${l.whatsapp ? `<a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/${waNumber(l.contactPhone)}?text=${msg}">WhatsApp owner</a>` : ""}
          <a class="btn" href="tel:${esc(l.contactPhone)}">Call ${esc(l.contactPhone)}</a>
          <button class="btn ghost share">Share</button>
        </div>
      </div>
      <p class="warn">Safety: view the place in person and sign a written lease before paying anything. Never pay to "reserve" a home you haven't seen.</p>
      <button class="link report">Report this listing</button>
    </div>`;
  d.showModal();
  d.querySelector(".close").onclick = () => d.close();
  d.querySelector(".share").onclick = async () => {
    const url = location.origin + location.pathname + "?listing=" + encodeURIComponent(l.id);
    try { if (navigator.share) await navigator.share({ title: l.title, url }); else { await navigator.clipboard.writeText(url); toast("Link copied"); } } catch {}
  };
  d.querySelector(".report").onclick = async () => {
    const reason = prompt("What's wrong with this listing? (e.g. scam, already rented, not the owner, wrong price)");
    if (!reason) return;
    await store.report(l.id, reason); toast("Thanks, we'll review it.");
  };
}

form.addEventListener("submit", e => { e.preventDefault(); load(); });
$("#sort").addEventListener("change", load);
$("#grid").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) open(c.dataset.id); });
$("#grid").addEventListener("keydown", e => { const c = e.target.closest(".card"); if (c && e.key === "Enter") open(c.dataset.id); });
$("#detail").addEventListener("click", e => { if (e.target.id === "detail") e.target.close(); });
load();
