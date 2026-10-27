// Kaya Rentals configuration.
// Leave firebaseConfig.apiKey empty to run in DEMO MODE (data saved in this browser only).
// To go live: create a Firebase project, add a Web app, and paste its config here.
export const firebaseConfig = {
  apiKey: "AIzaSyDqCeNIxArdVW-iX8JWXVai-9YsegQwmhE",
  authDomain: "kaya-rentals.firebaseapp.com",
  projectId: "kaya-rentals",
  storageBucket: "kaya-rentals.firebasestorage.app",
  messagingSenderId: "150575832693",
  appId: "1:150575832693:web:242b779cd0aa01d151223c"
};

export const SITE = {
  name: "Kaya Rentals",
  tagline: "Affordable homes to rent, listed by the owners themselves",
  maxRent: 6000,
  supportEmail: "rangariraimutasa@gmail.com",
  maxPhotos: 5,
  maxListingsPerOwner: 5,
  salesWhatsApp: "27767390886"
};

// Paid extras for owners. Tenants never pay.
export const PRICES = {
  featuredWeek: 49, featuredMonth: 149, bump: 20, fastVerify: 79, sponsorMonth: 250
};

export const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape"
];

export const PROPERTY_TYPES = [
  "Room", "Backroom", "Garden cottage", "Bachelor flat", "Flat", "Townhouse", "House"
];

export const FEATURES = [
  "Prepaid electricity", "Water included", "Electricity included", "Wi-Fi", "Parking",
  "Secure / gated", "Pets allowed", "Furnished", "Own entrance", "Own bathroom",
  "Near taxi route", "Garden", "Kids welcome"
];

export const DEMO = !firebaseConfig.apiKey;
