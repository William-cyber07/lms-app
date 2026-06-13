import { db } from "../firebase";
import { doc, getDoc, updateDoc, increment, arrayUnion } from "firebase/firestore";

export const BADGES = {
  first_lesson: { name: "First Steps", icon: "🎯", description: "Completed your first lesson" },
  first_course: { name: "Course Champion", icon: "🏆", description: "Completed an entire course" },
  quiz_master: { name: "Quiz Master", icon: "🧠", description: "Scored 100% on a quiz" },
  xp_100: { name: "Rising Star", icon: "⭐", description: "Earned 100 XP" },
  xp_500: { name: "XP Legend", icon: "🔥", description: "Earned 500 XP" },
};

export async function awardXP(userId, amount) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { xp: increment(amount) });

  const snap = await getDoc(userRef);
  const data = snap.data();
  const newBadges = [];

  if (data.xp >= 100 && !data.badges?.includes("xp_100")) newBadges.push("xp_100");
  if (data.xp >= 500 && !data.badges?.includes("xp_500")) newBadges.push("xp_500");

  if (newBadges.length > 0) {
    await updateDoc(userRef, { badges: arrayUnion(...newBadges) });
  }
  return newBadges;
}

export async function awardBadge(userId, badgeId) {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  const data = snap.data();
  if (!data.badges?.includes(badgeId)) {
    await updateDoc(userRef, { badges: arrayUnion(badgeId) });
    return true;
  }
  return false;
}