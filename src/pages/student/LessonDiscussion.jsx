import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import {
  collection, addDoc, serverTimestamp,
  query, where, onSnapshot, doc, getDoc
} from "firebase/firestore";

export default function LessonDiscussion() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const lessonSnap = await getDoc(doc(db, "lessons", lessonId));
      if (lessonSnap.exists()) setLesson({ id: lessonSnap.id, ...lessonSnap.data() });

      const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userSnap.exists()) setUserName(userSnap.data().name);
    }
    fetchData();

    const q = query(collection(db, "comments"), where("lessonId", "==", lessonId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
      setComments(data);
    });
    return unsubscribe;
  }, [lessonId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "comments"), {
      lessonId,
      userId: auth.currentUser.uid,
      userName: userName || auth.currentUser.email,
      text,
      createdAt: serverTimestamp(),
    });
    setText("");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">💬 Discussion</h2>
        <p className="text-gray-400 mb-8">
          {lesson?.title}
        </p>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm mb-3"
            placeholder="Ask a question or share your thoughts..."
          />
          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg transition"
          >
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">💬</p>
              <p>No comments yet. Start the discussion!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`bg-gray-900 rounded-xl p-4 border ${
                  comment.userId === auth.currentUser.uid
                    ? "border-indigo-700"
                    : "border-gray-800"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {comment.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {comment.userName}
                        {comment.userId === auth.currentUser.uid && (
                          <span className="text-indigo-400 text-xs ml-2">(You)</span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {comment.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}