// Kaya Rentals configuration.
// Leave firebaseConfig.apiKey empty to run in DEMO MODE (data saved in this browser only).
// To go live: create a Firebase project, add a Web app, and paste its config here.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export const SITE = {
  name: "Kaya Rentals",
  tagline: "Affordable homes to rent, listed by the owners themselves",
  maxRent: 6000,
  supportEmail: "rangariraimutasa@gmail.com",
  maxPhotos: 6,
  maxListingsPerOwner: 5
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
