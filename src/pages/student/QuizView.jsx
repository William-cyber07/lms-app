import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "../../firebase";
import { awardXP, awardBadge } from "../../utils/gamification";

export default function QuizView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchLesson() {
      const snap = await getDoc(doc(db, "lessons", lessonId));
      if (snap.exists()) setLesson({ id: snap.id, ...snap.data() });
    }
    fetchLesson();
  }, [lessonId]);

  async function generateQuiz() {
    setGenerating(true);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);

   const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a 4-question multiple choice quiz based on this lesson content. 
Return ONLY a JSON array with no markdown or extra text, like this:
[
  {
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "answer": "A"
  }
]

Lesson title: ${lesson.title}
Lesson content: ${lesson.content}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  }
);

const data = await response.json();
const text = data.candidates[0].content.parts[0].text;
const parsed = JSON.parse(text);
    setQuiz(parsed);
    setGenerating(false);
  }

  function handleSelect(qIndex, option) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  }
function handleSubmit() {
  let correct = 0;
  quiz.forEach((q, i) => {
    if (answers[i] === q.answer) correct++;
  });
  setScore(correct);
  setSubmitted(true);

  awardXP(auth.currentUser.uid, correct * 5);
  if (correct === quiz.length) {
    awardBadge(auth.currentUser.uid, "quiz_master");
  }
}
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-1">AI Quiz</h2>
        <p className="text-gray-400 mb-6">
          Based on: <span className="text-indigo-400">{lesson?.title}</span>
        </p>

        {!quiz && !generating && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🤖</p>
            <p className="text-gray-400 mb-6">
              Click below to generate a quiz from this lesson using AI
            </p>
            <button
              onClick={generateQuiz}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Generate Quiz
            </button>
          </div>
        )}

        {generating && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4 animate-bounce">🤖</p>
            <p className="text-gray-400">Generating your quiz...</p>
          </div>
        )}

        {quiz && (
          <div className="space-y-6">
            {quiz.map((q, i) => (
              <div
                key={i}
                className="bg-gray-900 rounded-xl p-5 border border-gray-800"
              >
                <p className="font-semibold mb-4">
                  {i + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((option) => {
                    let style = "bg-gray-800 hover:bg-gray-700 border-gray-700";
                    if (submitted) {
                      if (option === q.answer)
                        style = "bg-green-900 border-green-500 text-green-300";
                      else if (answers[i] === option)
                        style = "bg-red-900 border-red-500 text-red-300";
                    } else if (answers[i] === option) {
                      style = "bg-indigo-900 border-indigo-500";
                    }
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelect(i, option)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${style}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < quiz.length}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
              >
                Submit Answers
              </button>
            ) : (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
                <p className="text-4xl mb-2">
                  {score === quiz.length ? "🏆" : score >= quiz.length / 2 ? "👍" : "📚"}
                </p>
                <p className="text-2xl font-bold mb-1">
                  {score}/{quiz.length} correct
                </p>
                <p className="text-gray-400 mb-4">
                  {score === quiz.length
                    ? "Perfect score!"
                    : score >= quiz.length / 2
                    ? "Good job! Keep practicing."
                    : "Keep studying and try again!"}
                </p>
                <button
                  onClick={generateQuiz}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition"
                >
                  Generate New Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}