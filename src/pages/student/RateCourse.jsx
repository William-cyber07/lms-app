import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import {
  collection, addDoc, serverTimestamp, query,
  where, onSnapshot, getDocs, doc, getDoc
} from "firebase/firestore";

export default function RateCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      const snap = await getDoc(doc(db, "courses", courseId));
      if (snap.exists()) setCourse({ id: snap.id, ...snap.data() });

      const myQ = query(
        collection(db, "reviews"),
        where("courseId", "==", courseId),
        where("userId", "==", auth.currentUser.uid)
      );
      const mySnap = await getDocs(myQ);
      if (!mySnap.empty) setHasReviewed(true);
    }
    fetchCourse();

    const q = query(collection(db, "reviews"), where("courseId", "==", courseId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setReviews(data);
    });
    return unsubscribe;
  }, [courseId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    await addDoc(collection(db, "reviews"), {
      courseId,
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      rating,
      review,
      createdAt: serverTimestamp(),
    });
    setHasReviewed(true);
    setLoading(false);
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate(`/student/course/${courseId}`)}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Back to Course
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">Rate this Course</h2>
        <p className="text-gray-400 mb-8">{course?.title}</p>

        {/* Average Rating */}
        {avgRating && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-6 flex items-center gap-4">
            <p className="text-5xl font-bold text-yellow-400">{avgRating}</p>
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-xl ${s <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-600"}`}>★</span>
                ))}
              </div>
              <p className="text-gray-400 text-sm">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        {/* Submit Review */}
        {!hasReviewed ? (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
            <h3 className="text-lg font-semibold mb-4">Your Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="text-3xl transition"
                    >
                      <span className={star <= (hover || rating) ? "text-yellow-400" : "text-gray-600"}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Review (optional)</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  placeholder="Share your experience with this course..."
                />
              </div>
              <button
                type="submit"
                disabled={rating === 0 || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-green-900 rounded-2xl p-5 border border-green-700 mb-6 text-center">
            <p className="text-green-300 font-semibold">✅ You've already reviewed this course!</p>
          </div>
        )}

        {/* All Reviews */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">All Reviews</h3>
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-3xl mb-2">⭐</p>
              <p>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white text-sm font-medium">{r.userEmail}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-sm ${s <= r.rating ? "text-yellow-400" : "text-gray-600"}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs">{r.createdAt?.toDate().toLocaleDateString()}</p>
                  </div>
                  {r.review && <p className="text-gray-300 text-sm mt-2">{r.review}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}