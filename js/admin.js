import { store } from "./data.js";
import { chrome, esc, rand, $, $$, toast, photoBlock } from "./common.js";

chrome("admin");
let tab = "pending";

store.onAuth(u => {
  $("#denied").hidden = !!(u && u.admin);
  $("#adminView").hidden = !(u && u.admin);
  if (u && u.admin) render();
});

$$("#statusTabs button").forEach(b => b.onclick = () => {
  $$("#statusTabs button").forEach(x => x.classList.toggle("on", x === b)); tab = b.dataset.s; render();
});

async function render() {
  const box = $("#list");
  box.innerHTML = "<p class='muted'>Loading…</p>";
  try {
    if (tab === "reports") {
      const r = await store.reports();
      box.innerHTML = r.length ? r.map(x => `<article class="mine-item"><div class="info"><h3>Listing ${esc(x.listingId)}</h3><p>${esc(x.reason)}</p><p class="small muted">${new Date(x.createdAt).toLocaleString("en-ZA")}</p></div>
        <div class="actions"><button class="btn ghost danger" data-act="rejected" data-id="${esc(x.listingId)}">Take listing down</button></div></article>`).join("") : "<div class='empty'><p>No reports.</p></div>";
    } else {
      const items = await store.adminList(tab);
      box.innerHTML = items.length ? items.map(l => `<article class="mine-item admin">
        <div class="thumb">${photoBlock(l)}</div>
        <div class="info"><h3>${esc(l.title)} ${l.verified ? '<span class="badge ok inline">Verified</span>' : ""} ${Number(l.featuredUntil||0) > Date.now() ? `<span class="badge feat inline">★ Featured until ${new Date(l.featuredUntil).toLocaleDateString("en-ZA")}</span>` : ""}</h3>
          <p><b>${rand(l.rent)}</b> / month · deposit ${rand(l.deposit)} · ${esc(l.type)} · ${esc(l.bedrooms)} bed</p>
          <p class="muted">${esc(l.suburb)}, ${esc(l.city)}, ${esc(l.province)}</p>
          <p class="small">${esc(l.description)}</p>
          <p class="small">Owner: <b>${esc(l.ownerName)}</b> · <a href="tel:${esc(l.contactPhone)}">${esc(l.contactPhone)}</a> · ${l.photoCount ?? (l.photos || []).length} photos · declaration ${l.ownerDeclaration ? "✔" : "✘"}</p>
          ${l.rent > 6000 ? '<p class="bad-text">Rent is over R6,000. Reject.</p>' : ""}
        </div>
        <div class="actions col">
          ${tab !== "approved" ? `<button class="btn primary" data-act="approved" data-id="${esc(l.id)}">Approve</button>` : ""}
          <button class="btn ghost" data-act="verify" data-id="${esc(l.id)}" data-v="${l.verified ? 1 : 0}">${l.verified ? "Remove verified" : "Mark owner verified"}</button>
          ${tab === "approved" ? `<button class="btn ghost" data-act="feat7" data-id="${esc(l.id)}">★ Feature 7 days</button>
          <button class="btn ghost" data-act="feat30" data-id="${esc(l.id)}">★ Feature 30 days</button>
          ${Number(l.featuredUntil||0) > Date.now() ? `<button class="btn ghost" data-act="unfeat" data-id="${esc(l.id)}">Remove featured</button>` : ""}
          <button class="btn ghost" data-act="bump" data-id="${esc(l.id)}">↑ Bump to top</button>` : ""}
          ${tab !== "rejected" ? `<button class="btn ghost danger" data-act="rejected" data-id="${esc(l.id)}">Reject</button>` : ""}
          <button class="btn ghost danger" data-act="delete" data-id="${esc(l.id)}">Delete</button>
        </div></article>`).join("") : "<div class='empty'><p>Nothing here.</p></div>";
    }
  } catch (e) { box.innerHTML = `<p class="bad-text">${esc(e.message)}</p>`; }
}

$("#list").addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const { act, id } = b.dataset;
  try {
    if (act === "approved") await store.setStatus(id, "approved", { rejectReason: "" });
    if (act === "rejected") { const r = prompt("Reason for the owner (shown on their dashboard):", "Couldn't confirm you're the owner."); if (r === null) return; await store.setStatus(id, "rejected", { rejectReason: r }); }
    if (act === "verify") { const l = (await store.adminList()).find(x => x.id === id); await store.setStatus(id, l.status, { verified: b.dataset.v !== "1" }); }
    if (act === "feat7" || act === "feat30") {
      const l = (await store.adminList("approved")).find(x => x.id === id);
      const base = Math.max(Date.now(), Number(l.featuredUntil || 0)); // extends an active feature
      await store.setStatus(id, "approved", { featuredUntil: base + (act === "feat7" ? 7 : 30) * 864e5 });
    }
    if (act === "unfeat") await store.setStatus(id, "approved", { featuredUntil: 0 });
    if (act === "bump") await store.setStatus(id, "approved", { bumpedAt: Date.now() });
    if (act === "delete") { if (!confirm("Delete permanently?")) return; await store.deleteListing({ admin: true }, id); }
    toast("Done"); render();
  } catch (err) { toast(err.message, true); }
});
