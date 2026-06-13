import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
   const q = query(
  collection(db, "users"),
  where("role", "==", "student"),
  orderBy("xp", "desc"),
  limit(20)
);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">🏆 Leaderboard</h2>
        <p className="text-gray-400 mb-8">Top learners ranked by XP</p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800">
          {users.map((user, index) => {
            const isCurrentUser = user.id === auth.currentUser.uid;
            return (
              <div
                key={user.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  isCurrentUser ? "bg-indigo-900/30" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold w-8 text-center">
                    {medals[index] || `#${index + 1}`}
                  </span>
                  <div>
                    <p className="font-medium text-white">
                      {user.name} {isCurrentUser && <span className="text-indigo-400 text-xs">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{user.badges?.length || 0} badges</p>
                  </div>
                </div>
                <span className="font-bold text-indigo-400">{user.xp || 0} XP</span>
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">🏆</p>
              <p>No rankings yet. Start earning XP!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}