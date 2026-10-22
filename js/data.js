// Data layer: Firebase when configured, browser-only demo store otherwise.
import { firebaseConfig, SITE, DEMO } from "./config.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
let fb = null; // lazily loaded firebase modules + instances

async function firebase() {
  if (fb) return fb;
  const [appM, authM, fsM, stM] = await Promise.all([
    import(FB + "firebase-app.js"),
    import(FB + "firebase-auth.js"),
    import(FB + "firebase-firestore.js"),
    import(FB + "firebase-storage.js")
  ]);
  const app = appM.initializeApp(firebaseConfig);
  fb = { ...authM, ...fsM, ...stM, auth: authM.getAuth(app), db: fsM.getFirestore(app), st: stM.getStorage(app) };
  return fb;
}

/* ---------- helpers ---------- */
export function validateListing(l) {
  const errs = [];
  const rent = Number(l.rent);
  if (!l.title || l.title.trim().length < 8) errs.push("Give the listing a clear title (at least 8 characters).");
  if (!Number.isInteger(rent) || rent < 300) errs.push("Enter the monthly rent in whole rand.");
  if (rent > SITE.maxRent) errs.push(`Kaya Rentals only lists homes at R${SITE.maxRent.toLocaleString("en-ZA")} a month or less.`);
  if (l.deposit && Number(l.deposit) > rent * 2) errs.push("Deposit can't be more than two months' rent.");
  if (!l.province) errs.push("Choose a province.");
  if (!l.city || !l.city.trim()) errs.push("Enter the town or city.");
  if (!l.suburb || !l.suburb.trim()) errs.push("Enter the suburb or area.");
  if (!l.type) errs.push("Choose the property type.");
  if (!l.description || l.description.trim().length < 30) errs.push("Describe the place in at least 30 characters.");
  if (!/^(\+27|0)[6-8][0-9]{8}$/.test((l.contactPhone || "").replace(/\s/g, ""))) errs.push("Enter a valid South African mobile number.");
  if (!l.ownerDeclaration) errs.push("You must confirm you are the owner or legally allowed to rent out this property.");
  return errs;
}

export async function resizeImage(file, max = 1280, quality = 0.75) {
  const img = await new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file);
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(b => res(b), "image/jpeg", quality));
}

function applyFilters(list, f = {}) {
  let out = list.filter(l => l.status === "approved");
  if (f.province) out = out.filter(l => l.province === f.province);
  if (f.type) out = out.filter(l => l.type === f.type);
  if (f.maxRent) out = out.filter(l => l.rent <= Number(f.maxRent));
  if (f.bedrooms) out = out.filter(l => (l.bedrooms || 0) >= Number(f.bedrooms));
  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter(l => [l.city, l.suburb, l.title, l.description].join(" ").toLowerCase().includes(q));
  }
  if (f.sort === "cheap") out.sort((a, b) => a.rent - b.rent);
  else if (f.sort === "dear") out.sort((a, b) => b.rent - a.rent);
  else out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return out;
}

/* ---------- DEMO store ---------- */
const LS = { listings: "kaya_listings", users: "kaya_users", session: "kaya_session", reports: "kaya_reports" };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const listeners = new Set();

function seed() {
  if (read(LS.listings, null)) return;
  const now = Date.now();
  const s = (o, i) => ({ id: "demo" + i, ownerId: "demo-owner", ownerName: "Demo owner", status: "approved",
    ownerDeclaration: true, verified: i % 2 === 0, photos: [], createdAt: now - i * 3600e3, features: [], bathrooms: 1, ...o });
  write(LS.listings, [
    s({ title: "Sunny backroom with own entrance", type: "Backroom", rent: 2200, deposit: 2200, bedrooms: 1, province: "KwaZulu-Natal", city: "Pinetown", suburb: "Ashley", description: "Neat backroom on a quiet street, 5 minutes walk to the taxi rank. Prepaid electricity, shared yard.", contactPhone: "0820000001", whatsapp: true, features: ["Prepaid electricity", "Own entrance", "Near taxi route"] }, 1),
    s({ title: "Bachelor flat close to Wits", type: "Bachelor flat", rent: 4800, deposit: 4800, bedrooms: 1, province: "Gauteng", city: "Johannesburg", suburb: "Braamfontein", description: "Secure building with access control, kitchenette and own bathroom. Ideal for a student or young professional.", contactPhone: "0820000002", whatsapp: true, features: ["Secure / gated", "Own bathroom", "Wi-Fi"] }, 2),
    s({ title: "2-bed house with garden", type: "House", rent: 5900, deposit: 5900, bedrooms: 2, province: "Eastern Cape", city: "Gqeberha", suburb: "Kabega Park", description: "Small family home with fenced garden, carport and space for kids to play. Water included in rent.", contactPhone: "0820000003", whatsapp: false, features: ["Garden", "Parking", "Water included", "Kids welcome"] }, 3),
    s({ title: "Furnished room in shared house", type: "Room", rent: 3200, deposit: 1600, bedrooms: 1, province: "Western Cape", city: "Cape Town", suburb: "Observatory", description: "Furnished room in a friendly 4-person house. Wi-Fi and electricity included, close to trains and UCT shuttle.", contactPhone: "0820000004", whatsapp: true, features: ["Furnished", "Wi-Fi", "Electricity included"] }, 4),
    s({ title: "Garden cottage, pets welcome", type: "Garden cottage", rent: 4300, deposit: 4300, bedrooms: 1, province: "Free State", city: "Bloemfontein", suburb: "Universitas", description: "Private cottage behind the main house with its own garden and parking. Small pets allowed.", contactPhone: "0820000005", whatsapp: true, features: ["Pets allowed", "Parking", "Garden", "Own entrance"] }, 5),
    s({ title: "1-bed flat near Mall of the North", type: "Flat", rent: 3900, deposit: 3900, bedrooms: 1, province: "Limpopo", city: "Polokwane", suburb: "Bendor", description: "Upstairs flat in a small complex with secure parking and prepaid meter.", contactPhone: "0820000006", whatsapp: true, features: ["Secure / gated", "Parking", "Prepaid electricity"] }, 6)
  ]);
}

const demo = {
  async listPublic(f) { seed(); return applyFilters(read(LS.listings, []), f); },
  async getListing(id) { seed(); return read(LS.listings, []).find(l => l.id === id) || null; },
  async myListings(ownerId) { return read(LS.listings, []).filter(l => l.ownerId === ownerId).sort((a, b) => b.createdAt - a.createdAt); },
  async saveListing(user, data, id) {
    const all = read(LS.listings, []);
    if (id) {
      const i = all.findIndex(l => l.id === id && l.ownerId === user.uid);
      if (i < 0) throw new Error("Listing not found.");
      all[i] = { ...all[i], ...data, status: data.status === "let" ? "let" : "pending", updatedAt: Date.now() };
    } else {
      if (all.filter(l => l.ownerId === user.uid).length >= SITE.maxListingsPerOwner) throw new Error(`You can have up to ${SITE.maxListingsPerOwner} listings.`);
      all.push({ ...data, id: uid(), ownerId: user.uid, ownerName: user.name, status: "pending", verified: false, createdAt: Date.now() });
    }
    write(LS.listings, all);
  },
  async deleteListing(user, id) { write(LS.listings, read(LS.listings, []).filter(l => !(l.id === id && (l.ownerId === user.uid || user.admin)))); },
  async uploadPhoto(user, file) {
    const blob = await resizeImage(file, 900, 0.65);
    return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  },
  async signUp({ name, email, password, phone }) {
    const users = read(LS.users, []);
    if (users.find(u => u.email === email.toLowerCase())) throw new Error("An account with this email already exists.");
    const u = { uid: uid(), name, email: email.toLowerCase(), password, phone, admin: users.length === 0, createdAt: Date.now() };
    users.push(u); write(LS.users, users); write(LS.session, u.uid); emit();
    return u;
  },
  async signIn({ email, password }) {
    const u = read(LS.users, []).find(x => x.email === email.toLowerCase() && x.password === password);
    if (!u) throw new Error("Wrong email or password.");
    write(LS.session, u.uid); emit(); return u;
  },
  async resetPassword() { throw new Error("Password reset works once Firebase is connected."); },
  async signOut() { localStorage.removeItem(LS.session); emit(); },
  onAuth(cb) { listeners.add(cb); cb(current()); return () => listeners.delete(cb); },
  async adminList(status) { seed(); return read(LS.listings, []).filter(l => !status || l.status === status).sort((a, b) => b.createdAt - a.createdAt); },
  async setStatus(id, status, extra = {}) { const all = read(LS.listings, []); const l = all.find(x => x.id === id); if (l) Object.assign(l, { status, ...extra }); write(LS.listings, all); },
  async report(listingId, reason) { const r = read(LS.reports, []); r.push({ id: uid(), listingId, reason, createdAt: Date.now() }); write(LS.reports, r); },
  async reports() { return read(LS.reports, []).sort((a, b) => b.createdAt - a.createdAt); }
};
function current() { const id = read(LS.session, null); const u = read(LS.users, []).find(x => x.uid === id); return u ? { uid: u.uid, name: u.name, email: u.email, phone: u.phone, admin: !!u.admin } : null; }
function emit() { const u = current(); listeners.forEach(cb => cb(u)); }

/* ---------- FIREBASE store ---------- */
const toObj = d => { const x = d.data(); return { id: d.id, ...x, createdAt: x.createdAt?.toMillis?.() ?? x.createdAt ?? 0 }; };

const live = {
  async listPublic(f = {}) {
    const F = await firebase();
    const cons = [F.where("status", "==", "approved")];
    if (f.province) cons.push(F.where("province", "==", f.province));
    const snap = await F.getDocs(F.query(F.collection(F.db, "listings"), ...cons, F.limit(500)));
    return applyFilters(snap.docs.map(toObj), f);
  },
  async getListing(id) { const F = await firebase(); const d = await F.getDoc(F.doc(F.db, "listings", id)); return d.exists() ? toObj(d) : null; },
  async myListings(ownerId) {
    const F = await firebase();
    const snap = await F.getDocs(F.query(F.collection(F.db, "listings"), F.where("ownerId", "==", ownerId)));
    return snap.docs.map(toObj).sort((a, b) => b.createdAt - a.createdAt);
  },
  async saveListing(user, data, id) {
    const F = await firebase();
    const clean = { ...data, rent: Number(data.rent), deposit: Number(data.deposit || 0), bedrooms: Number(data.bedrooms || 0), bathrooms: Number(data.bathrooms || 0) };
    if (id) {
      await F.updateDoc(F.doc(F.db, "listings", id), { ...clean, status: data.status === "let" ? "let" : "pending", updatedAt: F.serverTimestamp() });
    } else {
      const mine = await this.myListings(user.uid);
      if (mine.length >= SITE.maxListingsPerOwner) throw new Error(`You can have up to ${SITE.maxListingsPerOwner} listings.`);
      await F.addDoc(F.collection(F.db, "listings"), { ...clean, ownerId: user.uid, ownerName: user.name, status: "pending", verified: false, createdAt: F.serverTimestamp() });
    }
  },
  async deleteListing(user, id) { const F = await firebase(); await F.deleteDoc(F.doc(F.db, "listings", id)); },
  async uploadPhoto(user, file) {
    const F = await firebase();
    const blob = await resizeImage(file);
    const r = F.ref(F.st, `listings/${user.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`);
    await F.uploadBytes(r, blob, { contentType: "image/jpeg" });
    return F.getDownloadURL(r);
  },
  async signUp({ name, email, password, phone }) {
    const F = await firebase();
    const cred = await F.createUserWithEmailAndPassword(F.auth, email, password);
    await F.updateProfile(cred.user, { displayName: name });
    await F.setDoc(F.doc(F.db, "owners", cred.user.uid), { name, phone, email, createdAt: F.serverTimestamp() });
    try { await F.sendEmailVerification(cred.user); } catch {}
    return cred.user;
  },
  async signIn({ email, password }) { const F = await firebase(); return F.signInWithEmailAndPassword(F.auth, email, password); },
  async resetPassword(email) { const F = await firebase(); await F.sendPasswordResetEmail(F.auth, email); },
  async signOut() { const F = await firebase(); await F.signOut(F.auth); },
  onAuth(cb) {
    let unsub = () => {};
    firebase().then(F => {
      unsub = F.onAuthStateChanged(F.auth, async u => {
        if (!u) return cb(null);
        let admin = false, phone = "";
        try { admin = (await F.getDoc(F.doc(F.db, "admins", u.uid))).exists(); } catch {}
        try { phone = (await F.getDoc(F.doc(F.db, "owners", u.uid))).data()?.phone || ""; } catch {}
        cb({ uid: u.uid, name: u.displayName || u.email, email: u.email, emailVerified: u.emailVerified, phone, admin });
      });
    });
    return () => unsub();
  },
  async adminList(status) {
    const F = await firebase();
    const q = status ? F.query(F.collection(F.db, "listings"), F.where("status", "==", status)) : F.collection(F.db, "listings");
    const snap = await F.getDocs(q);
    return snap.docs.map(toObj).sort((a, b) => b.createdAt - a.createdAt);
  },
  async setStatus(id, status, extra = {}) { const F = await firebase(); await F.updateDoc(F.doc(F.db, "listings", id), { status, ...extra, reviewedAt: F.serverTimestamp() }); },
  async report(listingId, reason) { const F = await firebase(); await F.addDoc(F.collection(F.db, "reports"), { listingId, reason: String(reason).slice(0, 500), createdAt: F.serverTimestamp() }); },
  async reports() { const F = await firebase(); const s = await F.getDocs(F.collection(F.db, "reports")); return s.docs.map(toObj).sort((a, b) => b.createdAt - a.createdAt); }
};

export const store = DEMO ? demo : live;
