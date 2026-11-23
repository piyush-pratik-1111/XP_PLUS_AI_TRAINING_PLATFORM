
import { adminAuth, adminDb } from "../server/firebaseAdmin.js";

async function setAdmin() {
  const email = process.argv[2]?.trim();

  if (!email) {
    throw new Error(
      "Usage: node scripts/setAdmin.js your-email@example.com"
    );
  }

  // Find the Firebase Authentication user.
  const user = await adminAuth.getUserByEmail(email);

  // Confirm that the user has an application profile.
  const userRef = adminDb.collection("users").doc(user.uid);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    throw new Error(
      "User profile not found. Register and log in to XP-PLUS first."
    );
  }

  // Preserve existing custom claims.
  const existingClaims = user.customClaims || {};

  const updatedClaims = {
    ...existingClaims,
    admin: true,
  };

  // Update the Firestore display role.
  // Admin SDK operations bypass Firestore Security Rules.
  await userRef.set(
    { role: "admin" },
    { merge: true }
  );

  // Assign trusted Firebase administrator permission.
  await adminAuth.setCustomUserClaims(
    user.uid,
    updatedClaims
  );

  // Verify that the claim was assigned successfully.
  const verifiedUser = await adminAuth.getUser(user.uid);

  if (verifiedUser.customClaims?.admin !== true) {
    throw new Error("Administrator claim verification failed.");
  }

  console.log("\nAdministrator configured successfully!");
  console.log("Email:", user.email);
  console.log("Admin custom claim:", verifiedUser.customClaims.admin);
  console.log("Firestore role: admin");
}

setAdmin().catch((error) => {
  console.error("\nAdmin setup failed:", error.message);
  process.exitCode = 1;
});
