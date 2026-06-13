import { useParams, useNavigate, useSearchParams } from "react-router-dom";

export default function LiveSession() {
  const { roomName } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const title = params.get("title") || "Live Session";
  const back = params.get("back") || "/dashboard";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-indigo-400">🎓 LearnFlow</h1>
          <p className="text-gray-400 text-sm">{title}</p>
        </div>
        <button
          onClick={() => navigate(back)}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          ← Leave Session
        </button>
      </nav>

      <div className="flex-1">
        <iframe
          src={`https://meet.jit.si/${roomName}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 73px)" }}
        />
      </div>
    </div>
  );
}