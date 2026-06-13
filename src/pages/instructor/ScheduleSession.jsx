import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ScheduleSession() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const scheduledAt = new Date(`${date}T${time}`);
    const roomName = `lms-app-${courseId}-${Date.now()}`;

    await addDoc(collection(db, "sessions"), {
      courseId,
      title,
      scheduledAt,
      roomName,
      instructorId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

    navigate(`/instructor/course/${courseId}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate(`/instructor/course/${courseId}`)}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-md mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">Schedule Live Session</h2>
        <p className="text-gray-400 mb-8">Set a date and time for your class</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Week 1 Live Q&A"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {loading ? "Scheduling..." : "Schedule Session"}
          </button>
        </form>
      </div>
    </div>
  );
}