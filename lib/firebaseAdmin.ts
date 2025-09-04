import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Allow .env to specify GOOGLE_APPLICATION_CREDENTIALS_PATH and map it to
// GOOGLE_APPLICATION_CREDENTIALS which is what the Admin SDK expects for ADC.
if (
  !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH
) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;
}

// Initialize Admin SDK once using Application Default Credentials (ADC).
// Set GOOGLE_APPLICATION_CREDENTIALS_PATH in .env to the absolute path of the
// service account JSON. In hosting, configure credentials via the env.
if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

export const adminAuth = getAuth();
