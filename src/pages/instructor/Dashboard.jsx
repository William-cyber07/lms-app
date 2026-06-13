import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function InstructorDashboard() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "courses"),
      where("instructorId", "==", currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCourses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
       <div className="flex items-center gap-3">
  <button
    onClick={() => navigate("/instructor/analytics")}
    className="bg-indigo-700 hover:bg-indigo-600 text-sm px-4 py-2 rounded-lg transition"
  >
    📊 Analytics
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
        <h2 className="text-3xl font-bold mb-1">Instructor Dashboard 🧑‍🏫</h2>
        <p className="text-gray-400 mb-8">Manage your courses and students</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">My Courses</p>
            <p className="text-3xl font-bold text-white">{courses.length}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Students</p>
            <p className="text-3xl font-bold text-indigo-400">
              {courses.reduce((acc, c) => acc + (c.students?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Avg. Completion</p>
            <p className="text-3xl font-bold text-green-400">0%</p>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">My Courses</h3>
            <button
              onClick={() => navigate("/instructor/create-course")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              + Create Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">📝</p>
              <p>You haven't created any courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-indigo-500 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full">
                      {course.category}
                    </span>
                    <span className="text-xs text-gray-400">{course.level}</span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">{course.title}</h4>
                  <p className="text-gray-400 text-sm line-clamp-2">{course.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {course.students?.length || 0} students
                    </span>
                    <button
                      onClick={() => navigate(`/instructor/course/${course.id}`)}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Manage →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}