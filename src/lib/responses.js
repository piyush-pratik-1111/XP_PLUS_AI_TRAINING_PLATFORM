
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export const getUserResponses = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const responsesQuery = query(
    collection(db, "responses"),
    where("user_id", "==", userId)
  );

  const snapshot = await getDocs(responsesQuery);

  return snapshot.docs.map((responseDoc) => ({
    id: responseDoc.id,
    ...responseDoc.data(),
  }));
};
