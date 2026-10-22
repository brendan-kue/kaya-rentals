import { PROVINCES, PROPERTY_TYPES, FEATURES, SITE, DEMO } from "./config.js";
import { store, validateListing } from "./data.js";
import { chrome, esc, rand, $, $$, toast, photoBlock } from "./common.js";

chrome("owner");
let user = null, editing = null, photos = [];
const L = $("#listing");
PROPERTY_TYPES.forEach(p => L.type.add(new Option(p, p)));
PROVINCES.forEach(p => L.province.add(new Option(p, p)));
$("#features").innerHTML = FEATURES.map(f => `<label class="check"><input type="checkbox" name="features" value="${esc(f)}"> ${esc(f)}</label>`).join("");

const show = v => ["authView", "dashView", "formView"].forEach(id => $("#" + id).hidden = id !== v);
const friendly = e => {
  const m = String(e?.code || e?.message || e);
  if (m.includes("email-already-in-use")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("invalid-credential") || m.includes("wrong-password") || m.includes("user-not-found")) return "Wrong email or password.";
  if (m.includes("weak-password")) return "Use a stronger password (at least 8 characters).";
  if (m.includes("permission")) return "That wasn't allowed. Check the rent is R6,000 or less and all fields are filled.";
  return e?.message || m;
};

/* auth tabs */
$$(".tabs button").forEach(b => b.onclick = () => {
  $$(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  $("#signup").hidden = b.dataset.tab !== "signup"; $("#signin").hidden = b.dataset.tab !== "signin";
});
$("#signup").onsubmit = async e => {
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
  if (!/^(\+27|0)[6-8][0-9]{8}$/.test(f.phone.replace(/\s/g, ""))) return toast("Enter a valid SA mobile number.", true);
  try { await store.signUp(f); toast(DEMO ? "Account created" : "Account created. Check your email to confirm it."); } catch (err) { toast(friendly(err), true); }
};
$("#signin").onsubmit = async e => {
  e.preventDefault(); try { await store.signIn(Object.fromEntries(new FormData(e.target))); } catch (err) { toast(friendly(err), true); }
};
$("#forgot").onclick = async () => {
  const email = $("#signin").email.value || prompt("Your email address");
  if (!email) return;
  try { await store.resetPassword(email); toast("Reset link sent to " + email); } catch (err) { toast(friendly(err), true); }
};
$("#outBtn").onclick = () => store.signOut();

store.onAuth(u => { user = u; if (!u) return show("authView"); renderDash(); });

/* dashboard */
const STATUS = { pending: ["Waiting for review", "warn"], approved: ["Live", "ok"], rejected: ["Not approved", "bad"], let: ["Rented out", "muted"] };
async function renderDash() {
  show("dashView");
  $("#hello").textContent = `Signed in as ${user.name} (${user.email})`;
  $("#verifyNote").hidden = DEMO || user.emailVerified !== false;
  const mine = await store.myListings(user.uid);
  $("#mine").innerHTML = mine.length ? mine.map(l => {
    const [label, cls] = STATUS[l.status] || [l.status, "muted"];
    return `<article class="mine-item">
      <div class="thumb">${photoBlock(l)}</div>
      <div class="info"><h3>${esc(l.title)}</h3><p class="muted">${rand(l.rent)} / month · ${esc(l.suburb)}, ${esc(l.city)}</p>
        <span class="badge ${cls} inline">${label}</span>${l.rejectReason ? `<p class="small bad-text">Reason: ${esc(l.rejectReason)}</p>` : ""}</div>
      <div class="actions"><button class="btn ghost" data-edit="${esc(l.id)}">Edit</button><button class="btn ghost danger" data-del="${esc(l.id)}">Delete</button></div>
    </article>`;
  }).join("") : `<div class="empty"><h3>No listings yet</h3><p>Add your first property. It's free.</p></div>`;
  $("#mine").onclick = async e => {
    const id = e.target.dataset.edit || e.target.dataset.del;
    if (!id) return;
    const l = mine.find(x => x.id === id);
    if (e.target.dataset.del) {
      if (!confirm("Delete this listing permanently?")) return;
      try { await store.deleteListing(user, id); toast("Listing deleted"); renderDash(); } catch (err) { toast(friendly(err), true); }
    } else openForm(l);
  };
}
$("#newBtn").onclick = () => openForm(null);
$("#backBtn").onclick = () => renderDash();

/* form */
function openForm(l) {
  editing = l; photos = l ? [...(l.photos || [])] : [];
  L.reset(); $("#errors").hidden = true;
  $("#formTitle").textContent = l ? "Edit listing" : "Add a listing";
  $("#letWrap").hidden = !l;
  L.contactPhone.value = user.phone || "";
  if (l) {
    ["title", "type", "rent", "deposit", "bedrooms", "bathrooms", "availableFrom", "province", "city", "suburb", "description", "contactPhone"].forEach(k => { if (L[k] && l[k] != null) L[k].value = l[k]; });
    L.whatsapp.checked = !!l.whatsapp; L.isLet.checked = l.status === "let";
    $$('input[name="features"]', L).forEach(c => c.checked = (l.features || []).includes(c.value));
  }
  drawPhotos(); show("formView"); scrollTo(0, 0);
}
function drawPhotos() {
  $("#photos").innerHTML = photos.map((p, i) => `<div class="pthumb"><img src="${esc(p)}" alt=""><button type="button" data-rm="${i}" aria-label="Remove">×</button></div>`).join("");
}
$("#photos").onclick = e => { if (e.target.dataset.rm != null) { photos.splice(+e.target.dataset.rm, 1); drawPhotos(); } };
$("#photoInput").onchange = async e => {
  const files = [...e.target.files].slice(0, SITE.maxPhotos - photos.length);
  if (!files.length) return toast(`Maximum ${SITE.maxPhotos} photos.`, true);
  toast("Uploading photos…");
  for (const f of files) {
    if (f.size > 15e6) { toast(`${f.name} is too large.`, true); continue; }
    try { photos.push(await store.uploadPhoto(user, f)); drawPhotos(); } catch (err) { toast("Photo upload failed: " + friendly(err), true); }
  }
  e.target.value = "";
};
L.onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(L);
  const data = {
    title: fd.get("title").trim(), type: fd.get("type"), rent: parseInt(fd.get("rent"), 10), deposit: parseInt(fd.get("deposit") || "0", 10),
    bedrooms: parseInt(fd.get("bedrooms") || "0", 10), bathrooms: parseInt(fd.get("bathrooms") || "0", 10), availableFrom: fd.get("availableFrom") || "",
    province: fd.get("province"), city: fd.get("city").trim(), suburb: fd.get("suburb").trim(), description: fd.get("description").trim(),
    features: fd.getAll("features"), photos, contactPhone: fd.get("contactPhone").replace(/\s/g, ""), whatsapp: !!fd.get("whatsapp"),
    ownerDeclaration: !!fd.get("ownerDeclaration")
  };
  if (fd.get("isLet")) data.status = "let";
  const errs = validateListing(data);
  if (errs.length) { $("#errors").innerHTML = errs.map(x => `<p>${esc(x)}</p>`).join(""); $("#errors").hidden = false; return; }
  $("#saveBtn").disabled = true;
  try {
    await store.saveListing(user, data, editing?.id);
    toast(data.status === "let" ? "Marked as rented out" : "Submitted. We'll review it within 24 hours.");
    renderDash();
  } catch (err) { toast(friendly(err), true); }
  $("#saveBtn").disabled = false;
};
