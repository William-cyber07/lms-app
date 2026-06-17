import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import {
  collection, onSnapshot, doc,
  updateDoc, deleteDoc, query, orderBy
} from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCourses = onSnapshot(collection(db, "courses"), (snapshot) => {
      setCourses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubCourses();
    };
  }, []);

  async function handleRoleChange(userId, newRole) {
    await updateDoc(doc(db, "users", userId), { role: newRole });
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await deleteDoc(doc(db, "users", userId));
  }

  async function handleDeleteCourse(courseId) {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    await deleteDoc(doc(db, "courses", courseId));
  }

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCourses = courses.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.instructorEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm hidden sm:inline">Admin Panel</span>
          <button
            onClick={handleLogout}
            className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">👑 Admin Panel</h2>
        <p className="text-gray-400 mb-8">Manage all users and courses</p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Students</p>
            <p className="text-3xl font-bold text-indigo-400">
              {users.filter((u) => u.role === "student").length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Instructors</p>
            <p className="text-3xl font-bold text-green-400">
              {users.filter((u) => u.role === "instructor").length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Courses</p>
            <p className="text-3xl font-bold text-yellow-400">{courses.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            👥 Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "courses"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            📚 Courses ({courses.length})
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`🔍 Search ${activeTab}...`}
          className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-800 text-sm mb-6"
        />

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-800">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">XP</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800">
                      <td className="px-5 py-3 font-medium text-white">{user.name}</td>
                      <td className="px-5 py-3 text-gray-400">{user.email}</td>
                      <td className="px-5 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-gray-700 text-white rounded-lg px-2 py-1 text-xs outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 text-indigo-400">{user.xp || 0}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-800">
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Instructor</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Students</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800">
                      <td className="px-5 py-3 font-medium text-white">{course.title}</td>
                      <td className="px-5 py-3 text-gray-400">{course.instructorEmail}</td>
                      <td className="px-5 py-3">
                        <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-1 rounded-full">
                          {course.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-300">{course.students?.length || 0}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}