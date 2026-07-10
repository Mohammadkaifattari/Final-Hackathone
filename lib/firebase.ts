import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCEmsA8IMFXCxJlMobeK4AGxDatqsuRDgo",
  authDomain: "my-web-d29b8.firebaseapp.com",
  projectId: "my-web-d29b8",
  storageBucket: "my-web-d29b8.firebasestorage.app",
  messagingSenderId: "766977358332",
  appId: "1:766977358332:web:ed28dbd785dba319ad5a79",
  measurementId: "G-45EPTGLGZJ",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)

if (typeof window !== "undefined") {
  getAnalytics(app)
}
