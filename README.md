# Kaya Rentals

Affordable homes to rent anywhere in South Africa, R6,000 a month or less, listed only by owners.

## What's included
- `index.html` – search by area, province, type, rent and bedrooms; listing details; WhatsApp/call the owner; share; report.
- `owner.html` – owner sign-up/sign-in, password reset, dashboard, add/edit/delete listings, photo upload, "rented out" toggle, owner declaration.
- `admin.html` – approve/reject listings, mark owners verified, review reports.
- `about.html` – how it works, tenant safety tips, POPIA privacy notice, terms.
- `firestore.rules` / `storage.rules` – the database itself refuses listings over R6,000, edits by non-owners, and owners approving themselves.

## Demo mode
With an empty `firebaseConfig` in `js/config.js` the site runs in demo mode: sample listings, and accounts saved in the browser only. The first account created in demo mode is the admin.

## Going live (Firebase, free Spark plan is enough to start)
1. console.firebase.google.com → Add project → "kaya-rentals".
2. Build → Authentication → Get started → enable **Email/Password**.
3. Build → Firestore Database → Create (production mode, region `africa-south1` Johannesburg).
4. Build → Storage → Get started (Storage may require the Blaze plan on new projects; it stays free within the free quota).
5. Project settings → Your apps → Web app → copy the config into `js/config.js`.
6. Deploy rules: `npm i -g firebase-tools && firebase login && firebase use --add && firebase deploy --only firestore:rules,storage`.
7. Create your account on owner.html, then in Firestore create collection `admins` with a document whose ID is your user UID (Authentication tab). You're now admin.
8. Authentication → Settings → Authorized domains → add your site's domain.

## Hosting
- GitHub Pages: the workflow in `.github/workflows/pages.yml` deploys on every push to `main` (Settings → Pages → Source: GitHub Actions).
- Or Firebase Hosting: `firebase deploy --only hosting`.
