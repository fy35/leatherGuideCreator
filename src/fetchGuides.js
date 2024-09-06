import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const fetchGuides = async () => {
  try {
    const guidesCollection = collection(db, "guides");
    const guideSnapshot = await getDocs(guidesCollection);
    const guideList = guideSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return guideList;
  } catch (error) {
    console.error("Error fetching guides: ", error);
    throw error;
  }
};

export default fetchGuides;
