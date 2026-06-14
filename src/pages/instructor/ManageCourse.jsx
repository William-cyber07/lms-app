import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc, getDoc, collection, addDoc, deleteDoc,
  serverTimestamp, onSnapshot, query, where
} from "firebase/firestore";

export default function ManageCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialName, setMaterialName] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");

  useEffect(() => {
    async function fetchCourse() {
      const docSnap = await getDoc(doc(db, "courses", courseId));
      if (docSnap.exists()) setCourse({ id: docSnap.id, ...docSnap.data() });
    }
    fetchCourse();

    const q = query(collection(db, "lessons"), where("courseId", "==", courseId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLessons(data);
    });

    const sessionsQ = query(collection(db, "sessions"), where("courseId", "==", courseId));
    const unsubSessions = onSnapshot(sessionsQ, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.scheduledAt?.toMillis() - b.scheduledAt?.toMillis());
      setSessions(data);
    });

    const enrollmentsQ = query(collection(db, "enrollments"), where("courseId", "==", courseId));
    const unsubStudents = onSnapshot(enrollmentsQ, async (snapshot) => {
      const enrollData = snapshot.docs.map((d) => d.data());
      const studentPromises = enrollData.map((e) => getDoc(doc(db, "users", e.userId)));
      const studentDocs = await Promise.all(studentPromises);
      const studentList = studentDocs.map((d, i) => ({
        ...d.data(),
        id: d.id,
        progress: enrollData[i].progress || 0,
        completedLessons: enrollData[i].completedLessons || [],
      }));
      setStudents(studentList);
    });

    const materialsQ = query(collection(db, "materials"), where("courseId", "==", courseId));
    const unsubMaterials = onSnapshot(materialsQ, (snapshot) => {
      setMaterials(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribe();
      unsubSessions();
      unsubStudents();
      unsubMaterials();
    };
  }, [courseId]);

  async function handleAddLesson(e) {
    e.preventDefault();
    setLoading(true);
    await addDoc(collection(db, "lessons"), {
      courseId,
      title,
      content,
      videoUrl,
      order: lessons.length + 1,
      createdAt: serverTimestamp(),
    });
    setTitle("");
    setContent("");
    setVideoUrl("");
    setShowForm(false);
    setLoading(false);
  }

  async function handleAddMaterial(e) {
    e.preventDefault();
    if (!materialName || !materialUrl) return;
    await addDoc(collection(db, "materials"), {
      courseId,
      name: materialName,
      url: materialUrl,
      createdAt: serverTimestamp(),
    });
    setMaterialName("");
    setMaterialUrl("");
  }

  async function handleDeleteMaterial(id) {
    await deleteDoc(doc(db, "materials", id));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate("/instructor/dashboard")}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          Back
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {course && (
          <>
            <div className="mb-8">
              <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full">
                {course.category}
              </span>
              <h2 className="text-3xl font-bold mt-2 mb-1">{course.title}</h2>
              <p className="text-gray-400">{course.description}</p>
            </div>

            {/* Lessons */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Lessons ({lessons.length})</h3>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition"
                >
                  {showForm ? "Cancel" : "+ Add Lesson"}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleAddLesson} className="bg-gray-800 rounded-xl p-5 mb-6 space-y-4">
                  <h4 className="font-semibold text-white">New Lesson</h4>
                  <div>
                    <label className="text-gray-300 text-sm mb-1 block">Lesson Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Variables and Data Types"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm mb-1 block">Content</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={4}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Write the lesson content here..."
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm mb-1 block">Video URL (optional)</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition"
                  >
                    {loading ? "Saving..." : "Save Lesson"}
                  </button>
                </form>
              )}

              {lessons.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-3xl mb-2">📄</p>
                  <p>No lessons yet. Add your first one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="bg-gray-800 rounded-xl px-5 py-4 flex justify-between items-center border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-400 font-bold text-sm w-6">{index + 1}</span>
                        <div>
                          <p className="font-medium text-white">{lesson.title}</p>
                          <p className="text-gray-400 text-sm line-clamp-1">{lesson.content}</p>
                        </div>
                      </div>
                      {lesson.videoUrl && (
                        <span className="text-xs text-green-400 bg-green-900 px-2 py-1 rounded-full">
                          Video
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Sessions */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Live Sessions</h3>
                <button
                  onClick={() => navigate(`/instructor/course/${courseId}/schedule`)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition"
                >
                  + Schedule Session
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-3xl mb-2">📹</p>
                  <p>No live sessions scheduled yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-gray-800 rounded-xl px-5 py-4 flex justify-between items-center border border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-white">{session.title}</p>
                        <p className="text-gray-400 text-sm">
                          {session.scheduledAt?.toDate().toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          navigate(
                            `/live/${session.roomName}?title=${encodeURIComponent(session.title)}&back=/instructor/course/${courseId}`
                          )
                        }
                        className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg transition"
                      >
                        Start Session
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Course Materials */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
              <h3 className="text-lg font-semibold mb-4">Course Materials</h3>
              <form onSubmit={handleAddMaterial} className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="File name (e.g. Week 1 Slides)"
                  required
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <input
                  type="url"
                  value={materialUrl}
                  onChange={(e) => setMaterialUrl(e.target.value)}
                  placeholder="Link (Google Drive, Dropbox, etc.)"
                  required
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2.5 rounded-lg transition whitespace-nowrap"
                >
                  + Add
                </button>
              </form>

              {materials.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-3xl mb-2">📁</p>
                  <p>No materials added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="bg-gray-800 rounded-xl px-5 py-4 flex justify-between items-center border border-gray-700"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xl shrink-0">📄</span>
                        <p className="font-medium text-white truncate">{material.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enrolled Students */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Enrolled Students ({students.length})
              </h3>
              {students.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-3xl mb-2">👨‍🎓</p>
                  <p>No students enrolled yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="bg-gray-800 rounded-xl px-5 py-4 border border-gray-700"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium text-white">{student.name}</p>
                          <p className="text-gray-400 text-sm">{student.email}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          student.progress === 100
                            ? "bg-green-900 text-green-300"
                            : student.progress > 0
                            ? "bg-indigo-900 text-indigo-300"
                            : "bg-gray-700 text-gray-400"
                        }`}>
                          {student.progress === 100
                            ? "Completed"
                            : student.progress > 0
                            ? "In Progress"
                            : "Not Started"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{student.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}