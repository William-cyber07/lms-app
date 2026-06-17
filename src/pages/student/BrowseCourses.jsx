import { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection, onSnapshot, doc, updateDoc,
  arrayUnion, addDoc, serverTimestamp, query, where, getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function BrowseCourses() {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const navigate = useNavigate();
  const [ratings, setRatings] = useState({});

  const categories = ["All", "Development", "Design", "Business", "Marketing", "Science", "Mathematics", "Language", "Other"];
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      setCourses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    async function fetchEnrollments() {
      const q = query(
        collection(db, "enrollments"),
        where("userId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      setEnrolledIds(snapshot.docs.map((d) => d.data().courseId));
    }
    fetchEnrollments();
    return unsubscribe;
  }, []);

  async function handleEnroll(course) {
    setLoading(course.id);
    try {
      await addDoc(collection(db, "enrollments"), {
        userId: auth.currentUser.uid,
        courseId: course.id,
        progress: 0,
        completedLessons: [],
        enrolledAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "courses", course.id), {
        students: arrayUnion(auth.currentUser.uid),
      });
      setEnrolledIds((prev) => [...prev, course.id]);
    } catch (err) {
      console.error(err);
    }
    setLoading(null);
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    const matchesLevel =
      selectedLevel === "All" || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });


useEffect(() => {
  const unsubRatings = onSnapshot(collection(db, "reviews"), (snapshot) => {
    const ratingMap = {};
    snapshot.docs.forEach((d) => {
      const data = d.data();
      if (!ratingMap[data.courseId]) ratingMap[data.courseId] = [];
      ratingMap[data.courseId].push(data.rating);
    });
    setRatings(ratingMap);
  });
  return unsubRatings;
}, []);

useEffect(() => {
  const unsubRatings = onSnapshot(collection(db, "reviews"), (snapshot) => {
    const ratingMap = {};
    snapshot.docs.forEach((d) => {
      const data = d.data();
      if (!ratingMap[data.courseId]) ratingMap[data.courseId] = [];
      ratingMap[data.courseId].push(data.rating);
    });
    setRatings(ratingMap);
  });
  return unsubRatings;
}, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">Browse Courses</h2>
        <p className="text-gray-400 mb-6">Find something new to learn today</p>

        {/* Search & Filters */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search courses..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <p className="text-gray-400 text-sm mb-4">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
        </p>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">🔍</p>
            <p>No courses match your search.</p>
            <button
              onClick={() => { setSearch(""); setSelectedCategory("All"); setSelectedLevel("All"); }}
              className="mt-4 text-indigo-400 hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => {
              const enrolled = enrolledIds.includes(course.id);
              return (
                <div
                  key={course.id}
                  className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-indigo-500 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full">
                        {course.category}
                      </span>
                      <span className="text-xs text-gray-400">{course.level}</span>
                    </div>
                    <h4 className="font-semibold text-white mb-2">{course.title}</h4>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {course.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
  👨‍🏫 {course.instructorEmail}
</p>
{ratings[course.id]?.length > 0 && (
  <div className="flex items-center gap-1 mb-4">
    <span className="text-yellow-400 text-sm">★</span>
    <span className="text-white text-sm font-semibold">
      {(ratings[course.id].reduce((a, b) => a + b, 0) / ratings[course.id].length).toFixed(1)}
    </span>
    <span className="text-gray-500 text-xs">({ratings[course.id].length})</span>
  </div>
)}
                  </div>
                  <button
                    onClick={() =>
                      enrolled
                        ? navigate(`/student/course/${course.id}`)
                        : handleEnroll(course)
                    }
                    disabled={loading === course.id}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                      enrolled
                        ? "bg-green-700 hover:bg-green-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    {loading === course.id
                      ? "Enrolling..."
                      : enrolled
                      ? "Continue Learning →"
                      : "Enroll Now"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}