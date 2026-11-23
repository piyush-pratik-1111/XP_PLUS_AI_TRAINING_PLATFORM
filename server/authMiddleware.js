
import { adminAuth } from "./firebaseAdmin.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required. Please sign in."
    });
  }

  const idToken = authHeader.slice(7).trim();

  if (!idToken) {
    return res.status(401).json({
      error: "Authentication token is missing."
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    };

    next();
  } catch (error) {
    console.warn("Firebase authentication failed:", error.code || error.message);

    return res.status(401).json({
      error: "Invalid or expired authentication token. Please sign in again."
    });
  }
}
