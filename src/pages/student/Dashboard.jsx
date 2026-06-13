import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  collection, query, where, onSnapshot, doc, getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { BADGES } from "../../utils/gamification";

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ xp: 0, badges: [] });

useEffect(() => {
  const q = query(
    collection(db, "enrollments"),
    where("userId", "==", currentUser.uid)
  );
  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const enrollData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setEnrollments(enrollData);

    const coursePromises = enrollData.map((e) =>
      getDoc(doc(db, "courses", e.courseId))
    );
    const courseDocs = await Promise.all(coursePromises);
    setCourses(
      courseDocs
        .filter((d) => d.exists())
        .map((d) => ({ id: d.id, ...d.data() }))
    );
  });

  const userUnsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
    if (snap.exists()) setUserData(snap.data());
  });

  return () => {
    unsubscribe();
    userUnsub();
  };
}, []);

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  const totalXP = enrollments.reduce((acc, e) => acc + (e.progress || 0), 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
<div className="flex items-center gap-3">
  <button
    onClick={() => navigate("/student/leaderboard")}
    className="bg-yellow-600 hover:bg-yellow-500 text-sm px-4 py-2 rounded-lg transition"
  >
    🏆 Leaderboard
  </button>
  <span className="text-gray-400 text-sm">{currentUser?.email}</span>
  <button
    onClick={handleLogout}
    className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
  >
    Logout
  </button>
</div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">Welcome back 👋</h2>
        <p className="text-gray-400 mb-8">Continue where you left off</p>

        {/* Stats */}
        {/* Stats */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
  <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
    <p className="text-gray-400 text-sm mb-1">Enrolled Courses</p>
    <p className="text-3xl font-bold text-white">{enrollments.length}</p>
  </div>
  <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
    <p className="text-gray-400 text-sm mb-1">XP Points</p>
    <p className="text-3xl font-bold text-indigo-400">{userData.xp || 0} XP</p>
  </div>
  <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
    <p className="text-gray-400 text-sm mb-1">Badges Earned</p>
    <p className="text-3xl font-bold text-yellow-400">{userData.badges?.length || 0} 🏅</p>
  </div>
</div>

{/* Badges */}
{userData.badges?.length > 0 && (
  <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
    <h3 className="text-lg font-semibold mb-4">My Badges</h3>
    <div className="flex flex-wrap gap-3">
      {userData.badges.map((badgeId) => {
        const badge = BADGES[badgeId];
        if (!badge) return null;
        return (
          <div
            key={badgeId}
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <span className="text-2xl">{badge.icon}</span>
            <div>
              <p className="font-semibold text-sm text-white">{badge.name}</p>
              <p className="text-xs text-gray-400">{badge.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

        {/* Courses */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">My Courses</h3>
          {courses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">📚</p>
              <p>You haven't enrolled in any courses yet.</p>
              <button
                onClick={() => navigate("/student/browse")}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => {
                const enrollment = enrollments.find((e) => e.courseId === course.id);
                const progress = enrollment?.progress || 0;
                return (
                  <div
                    key={course.id}
                    className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-indigo-500 transition cursor-pointer"
                    onClick={() => navigate(`/student/course/${course.id}`)}
                  >
                    <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full">
                      {course.category}
                    </span>
                    <h4 className="font-semibold text-white mt-3 mb-2">{course.title}</h4>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}