import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";

export const generateOrderId = async (): Promise<string> => {
  let newCount = 0;

  try {
    await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, "metadata", "bookingCounter");
      const snapshot = await transaction.get(counterRef);

      if (!snapshot.exists()) {
        throw new Error("Counter doesn't exist");
      }

      newCount = snapshot.data().count + 1;

      // Increment the counter
      transaction.update(counterRef, { count: newCount });
    });

    // Construct and return the booking ID
    return `#RMS${newCount.toString().padStart(5, "0")}`;
  } catch (error) {
    console.error("Error generating order ID:", error);
    throw error;
  }
};
