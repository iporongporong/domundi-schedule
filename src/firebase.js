import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXpNQxFzRZ09ZI3PH1Lk6RgmA-NBsLSMY",
  authDomain: "domundi-schedule-bbc58.firebaseapp.com",
  databaseURL: "https://domundi-schedule-bbc58-default-rtdb.firebaseio.com",
  projectId: "domundi-schedule-bbc58",
  storageBucket: "domundi-schedule-bbc58.firebasestorage.app",
  messagingSenderId: "434515486044",
  appId: "1:434515486044:web:1c302bac57d60d85e24d99",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export async function dbGet(path) {
  const snapshot = await get(ref(db, path));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function dbSet(path, value) {
  await set(ref(db, path), value);
}

// ---------- 관리자 로그인 (구글 계정) ----------
export function authLogin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export function authLogout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
