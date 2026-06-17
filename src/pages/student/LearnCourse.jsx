  import { useEffect, useState } from "react";
  import { useParams, useNavigate } from "react-router-dom";
  import { db, auth } from "../../firebase";
  import {
    doc, getDoc, collection, query,
    where, onSnapshot, updateDoc, arrayUnion, getDocs
  } from "firebase/firestore";
  import { awardXP, awardBadge, BADGES } from "../../utils/gamification";
  import { generateCertificate } from "../../utils/certificate";
  import { useAuth } from "../../context/AuthContext";

  export default function LearnCourse() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [userName, setUserName] = useState("");
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [activeLesson, setActiveLesson] = useState(null);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [enrollmentId, setEnrollmentId] = useState(null);
    const [earnedBadge, setEarnedBadge] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [ratings, setRatings] = useState({});

useEffect(() => {
  let unsubMaterials = () => {};
  let unsubAnnouncements = () => {};

  async function fetchData() {
    const courseSnap = await getDoc(doc(db, "courses", courseId));
    if (courseSnap.exists()) setCourse({ id: courseSnap.id, ...courseSnap.data() });

    const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (userSnap.exists()) setUserName(userSnap.data().name);

    const enrollQ = query(
      collection(db, "enrollments"),
      where("userId", "==", auth.currentUser.uid),
      where("courseId", "==", courseId)
    );
    const enrollSnap = await getDocs(enrollQ);
    if (!enrollSnap.empty) {
      const enrollDoc = enrollSnap.docs[0];
      setEnrollmentId(enrollDoc.id);
      setCompletedLessons(enrollDoc.data().completedLessons || []);
    }
  }
  fetchData();

  const q = query(collection(db, "lessons"), where("courseId", "==", courseId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.order - b.order);
    setLessons(data);
    if (data.length > 0) setActiveLesson(data[0]);
  });

  const sessionsQ = query(collection(db, "sessions"), where("courseId", "==", courseId));
  const unsubSessions = onSnapshot(sessionsQ, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => a.scheduledAt?.toMillis() - b.scheduledAt?.toMillis());
    setSessions(data);
  });

  const materialsQ = query(collection(db, "materials"), where("courseId", "==", courseId));
  unsubMaterials = onSnapshot(materialsQ, (snapshot) => {
    setMaterials(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });

  const announcementsQ = query(collection(db, "announcements"), where("courseId", "==", courseId));
  unsubAnnouncements = onSnapshot(announcementsQ, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
    setAnnouncements(data);
  });

  return () => {
    unsubscribe();
    unsubSessions();
    unsubMaterials();
    unsubAnnouncements();
  };
}, [courseId]);

    async function markComplete(lessonId) {
    if (!enrollmentId || completedLessons.includes(lessonId)) return;
    const newCompleted = [...completedLessons, lessonId];
    setCompletedLessons(newCompleted);
    const progress = Math.round((newCompleted.length / lessons.length) * 100);
    await updateDoc(doc(db, "enrollments", enrollmentId), {
      completedLessons: arrayUnion(lessonId),
      progress,
    });

    const newBadges = await awardXP(auth.currentUser.uid, 10);

    if (completedLessons.length === 0) {
      const earned = await awardBadge(auth.currentUser.uid, "first_lesson");
      if (earned) newBadges.push("first_lesson");
    }

    if (progress === 100) {
      await awardXP(auth.currentUser.uid, 50);
      const earned = await awardBadge(auth.currentUser.uid, "first_course");
      if (earned) newBadges.push("first_course");
    }

    if (newBadges.length > 0) {
      setEarnedBadge(BADGES[newBadges[0]]);
      setTimeout(() => setEarnedBadge(null), 4000);
    }
  }

    function getYouTubeId(url) {
      const match = url?.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
      );
      return match ? match[1] : null;
    }

    const progress = lessons.length
      ? Math.round((completedLessons.length / lessons.length) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {earnedBadge && (
    <div className="fixed top-5 right-5 z-50 bg-gray-900 border border-yellow-500 rounded-xl px-5 py-4 shadow-lg flex items-center gap-3 animate-bounce">
      <span className="text-3xl">{earnedBadge.icon}</span>
      <div>
        <p className="font-bold text-yellow-400">New Badge!</p>
        <p className="text-sm text-gray-300">{earnedBadge.name}</p>
      </div>
    </div>
  )}
        {/* Navbar */}
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
    <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
    <div className="flex gap-2 flex-wrap">
  <button
    onClick={() => navigate(`/student/chatbot/${courseId}`)}
    className="bg-purple-700 hover:bg-purple-600 text-sm px-3 py-2 rounded-lg transition"
  >
    🤖 AI Tutor
  </button>
  <button
    onClick={() => navigate(`/student/course/${courseId}/rate`)}
    className="bg-yellow-600 hover:bg-yellow-500 text-sm px-3 py-2 rounded-lg transition"
  >
    ⭐ Rate
  </button>
  <button
    onClick={() => navigate("/student/dashboard")}
    className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-2 rounded-lg transition"
  >
    ← Dashboard
  </button>
    </div>
  </nav>
        

  <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">
    {/* Sidebar */}
    <div className="w-full lg:w-72 bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col">
            <div className="p-5 border-b border-gray-800">
              <h2 className="font-semibold text-white mb-1">{course?.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{progress}%</span>
              </div>

              {progress === 100 && (
                <button
                  onClick={() =>
                    generateCertificate({
                      studentName: userName || "Student",
                      courseTitle: course.title,
                      date: new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }),
                      certId: `${courseId.slice(0, 6)}-${auth.currentUser.uid.slice(0, 6)}`,
                    })
                  }
                  className="mt-3 w-full bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold py-2 rounded-lg transition"
                >
                  🎓 Download Certificate
                </button>
              )}
            </div>
            {sessions.length > 0 && (
              <div className="p-3 border-b border-gray-800">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2 px-1">Live Sessions</p>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-gray-800 rounded-lg px-3 py-2 mb-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">{session.title}</p>
                      <p className="text-xs text-gray-400">
                        {session.scheduledAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/live/${session.roomName}?title=${encodeURIComponent(session.title)}&back=/student/course/${courseId}`
                        )
                      }
                      className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg transition shrink-0 ml-2"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 lg:overflow-y-auto p-3 space-y-1">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
                    activeLesson?.id === lesson.id
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                >
                  <span className="text-xs font-bold w-5 shrink-0">
                    {completedLessons.includes(lesson.id) ? "✅" : index + 1}
                  </span>
                  <span className="text-sm line-clamp-1">{lesson.title}</span>
                </button>
              ))}
            </div>

            {materials.length > 0 && (
              <div className="p-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2 px-1">
                  Materials
                </p>
                {materials.map((material) => (
                  <a
                    key={material.id}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg hover:bg-gray-800 transition text-gray-300 text-sm"
                  >
                    <span className="shrink-0">📄</span>
                    <span className="truncate">{material.name}</span>
                  </a>
                ))}
              </div>
            )}
            {announcements.length > 0 && (
  <div className="p-3 border-t border-gray-800">
    <p className="text-xs text-gray-500 uppercase font-semibold mb-2 px-1">
      📢 Announcements
    </p>
    {announcements.map((a) => (
      <div
        key={a.id}
        className="bg-gray-800 rounded-lg px-3 py-2 mb-2"
      >
        <p className="text-white text-xs">{a.text}</p>
        <p className="text-gray-500 text-xs mt-1">
          {a.createdAt?.toDate().toLocaleString()}
        </p>
      </div>
    ))}
  </div>
)}
          </div>

          {/* Main content */}
          <div className="flex-1 lg:overflow-y-auto p-3 space-y-1">
            {activeLesson ? (
              <>
                <h3 className="text-2xl font-bold mb-4">{activeLesson.title}</h3>

                {activeLesson.videoUrl && getYouTubeId(activeLesson.videoUrl) && (
                  <div className="mb-6 rounded-xl overflow-hidden w-full" style={{ paddingTop: "56.25%", position: "relative" }}>
                <iframe
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      src={`https://www.youtube.com/embed/${getYouTubeId(activeLesson.videoUrl)}`}
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6 leading-relaxed text-gray-300">
                  {activeLesson.content}
                </div>

                <button
                onClick={() => navigate(`/student/quiz/${activeLesson.id}`)}
              className="mb-4 bg-purple-700 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg transition font-semibold"
                >
              🤖 Take AI Quiz
              </button>

                {!completedLessons.includes(activeLesson.id) ? (
                  <button
                    onClick={() => markComplete(activeLesson.id)}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg transition font-semibold"
                  >
                    ✅ Mark as Complete
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <span>✅ Lesson Completed</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <p className="text-4xl mb-3">📖</p>
                <p>Select a lesson to start learning</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }