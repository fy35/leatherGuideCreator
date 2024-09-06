import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const uploadDetails = async (guideData) => {
  try {
    console.log(
      "Attempting to upload data:",
      JSON.stringify(guideData, null, 2)
    );

    const dataToUpload = {
      ...guideData,
      createdAt: serverTimestamp(), // Firestore server timestamp kullan
    };

    const docRef = await addDoc(collection(db, "guides"), dataToUpload);
    console.log("Document written with ID: ", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding document: ", error);
    return { success: false, error: error.message };
  }
};

export default uploadDetails;
