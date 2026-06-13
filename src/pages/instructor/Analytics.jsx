import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState([]);
  const [totals, setTotals] = useState({ courses: 0, students: 0, avgCompletion: 0 });

  useEffect(() => {
    async function fetchAnalytics() {
      const coursesQ = query(
        collection(db, "courses"),
        where("instructorId", "==", auth.currentUser.uid)
      );
      const coursesSnap = await getDocs(coursesQ);
      const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      let totalStudents = 0;
      let totalProgressSum = 0;
      let totalEnrollments = 0;
      const stats = [];

      for (const course of courses) {
        const enrollQ = query(
          collection(db, "enrollments"),
          where("courseId", "==", course.id)
        );
        const enrollSnap = await getDocs(enrollQ);
        const enrollments = enrollSnap.docs.map((d) => d.data());

        const studentCount = enrollments.length;
        const progressSum = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
        const avgProgress = studentCount > 0 ? Math.round(progressSum / studentCount) : 0;
        const completedCount = enrollments.filter((e) => e.progress === 100).length;

        totalStudents += studentCount;
        totalProgressSum += progressSum;
        totalEnrollments += studentCount;

        stats.push({
          title: course.title,
          students: studentCount,
          avgProgress,
          completed: completedCount,
        });
      }

      setCourseStats(stats);
      setTotals({
        courses: courses.length,
        students: totalStudents,
        avgCompletion: totalEnrollments > 0 ? Math.round(totalProgressSum / totalEnrollments) : 0,
      });
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate("/instructor/dashboard")}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">📊 Analytics Dashboard</h2>
        <p className="text-gray-400 mb-8">Overview of your courses and students</p>

        {loading ? (
          <p className="text-gray-500 text-center py-20">Loading analytics...</p>
        ) : courseStats.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p>No data yet. Create courses and get students enrolled!</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm mb-1">Total Courses</p>
                <p className="text-3xl font-bold text-white">{totals.courses}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm mb-1">Total Students</p>
                <p className="text-3xl font-bold text-indigo-400">{totals.students}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm mb-1">Avg. Completion</p>
                <p className="text-3xl font-bold text-green-400">{totals.avgCompletion}%</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
              <h3 className="text-lg font-semibold mb-4">Average Completion by Course</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="title" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="avgProgress" fill="#6366f1" radius={[6, 6, 0, 0]} name="Avg Progress %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Course Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-gray-800">
                      <th className="py-2 pr-4">Course</th>
                      <th className="py-2 pr-4">Students</th>
                      <th className="py-2 pr-4">Avg. Progress</th>
                      <th className="py-2 pr-4">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStats.map((c, i) => (
                      <tr key={i} className="border-b border-gray-800 last:border-0">
                        <td className="py-3 pr-4 font-medium text-white">{c.title}</td>
                        <td className="py-3 pr-4 text-gray-300">{c.students}</td>
                        <td className="py-3 pr-4 text-gray-300">{c.avgProgress}%</td>
                        <td className="py-3 pr-4 text-gray-300">{c.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}