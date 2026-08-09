import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  addDoc,
  collection,
  getCountFromServer,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Firestore,
} from 'firebase/firestore';

/**
 * Online leaderboard, shared by every visitor to the site.
 *
 * KNOWN LIMITATION: writes go straight from the browser to Firestore, so anyone
 * comfortable with dev tools could post a fabricated score. That's an accepted
 * trade for a casual project. If score integrity ever matters, move saveScore
 * behind a Cloud Function (or any server endpoint) and lock the collection down
 * to read-only in the security rules.
 */

export interface HighscoreEntry {
  name: string;
  score: number;
}

const COLLECTION = 'highscores';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let db: Firestore | null = null;

/** Lazy init so a missing .env fails at call time, not on page load. */
function database(): Firestore {
  if (db) return db;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      'Firebase config missing. Copy .env.example to .env and fill in the VITE_FIREBASE_* values.',
    );
  }
  const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
  db = getFirestore(app);
  return db;
}

/** Top N scores, highest first. */
export async function getTopScores(max = 3): Promise<HighscoreEntry[]> {
  const snapshot = await getDocs(
    query(collection(database(), COLLECTION), orderBy('score', 'desc'), limit(max)),
  );
  return snapshot.docs.map((doc) => {
    const data = doc.data() as { name?: unknown; score?: unknown };
    return {
      name: typeof data.name === 'string' ? data.name : 'Unknown',
      score: typeof data.score === 'number' ? data.score : 0,
    };
  });
}

/** Appends a run. Nothing is ever overwritten — the full history is kept. */
export async function saveScore(name: string, score: number): Promise<void> {
  await addDoc(collection(database(), COLLECTION), {
    name: name.slice(0, 24),
    score,
    createdAt: serverTimestamp(),
  });
}

/** Placement for a score: 1 = nobody has beaten it. */
export async function getRank(score: number): Promise<number> {
  const higher = query(collection(database(), COLLECTION), where('score', '>', score));
  try {
    const count = await getCountFromServer(higher);
    return count.data().count + 1;
  } catch {
    // count aggregation unavailable — fall back to reading the documents
    const snapshot = await getDocs(higher);
    return snapshot.size + 1;
  }
}
