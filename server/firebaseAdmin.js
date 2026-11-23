
import "dotenv/config";

import { existsSync } from "node:fs";
import {
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID;

const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!projectId) {
  throw new Error("Firebase project ID is missing from .env");
}

if (!credentialPath || !existsSync(credentialPath)) {
  throw new Error(
    "Firebase service-account credentials were not found. Check GOOGLE_APPLICATION_CREDENTIALS."
  );
}

const firebaseAdminApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: applicationDefault(),
      projectId,
    });

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);

console.log("Firebase Admin SDK initialized successfully.");
