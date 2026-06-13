import { useState } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CreateCourse() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Development");
  const [level, setLevel] = useState("Beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "courses"), {
        title,
        description,
        category,
        level,
        instructorId: auth.currentUser.uid,
        instructorEmail: auth.currentUser.email,
        students: [],
        modules: [],
        createdAt: serverTimestamp(),
      });
      navigate("/instructor/dashboard");
    } catch (err) {
      setError("Failed to create course. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate("/instructor/dashboard")}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">Create a Course</h2>
        <p className="text-gray-400 mb-8">Fill in the details to get started</p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Course Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Introduction to Python"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="What will students learn in this course?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Development</option>
                <option>Design</option>
                <option>Business</option>
                <option>Marketing</option>
                <option>Science</option>
                <option>Mathematics</option>
                <option>Language</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {loading ? "Creating..." : "Create Course"}
          </button>
        </form>
      </div>
    </div>
  );
}