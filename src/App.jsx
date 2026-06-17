import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import StudentDashboard from "./pages/student/Dashboard";
import InstructorDashboard from "./pages/instructor/Dashboard";
import CreateCourse from "./pages/instructor/CreateCourse";
import ManageCourse from "./pages/instructor/ManageCourse";
import BrowseCourses from "./pages/student/BrowseCourses";
import LearnCourse from "./pages/student/LearnCourse";
import QuizView from "./pages/student/QuizView";
import CourseChatbot from "./pages/student/CourseChatbot";
import Leaderboard from "./pages/student/Leaderboard";
import LiveSession from "./pages/LiveSession";
import ScheduleSession from "./pages/instructor/ScheduleSession";
import Analytics from "./pages/instructor/Analytics";
import RateCourse from "./pages/student/RateCourse";
import LessonDiscussion from "./pages/student/LessonDiscussion";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function RoleRoute() {
  const { userRole } = useAuth();
  if (userRole === "instructor") return <Navigate to="/instructor/dashboard" />;
  if (userRole === "admin") return <Navigate to="/admin/dashboard" />;
  return <Navigate to="/student/dashboard" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<PrivateRoute><RoleRoute /></PrivateRoute>} />
        <Route path="/student/dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
        <Route path="/instructor/dashboard" element={<PrivateRoute><InstructorDashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/instructor/create-course" element={<PrivateRoute><CreateCourse /></PrivateRoute>} />
        <Route path="/instructor/course/:courseId" element={<PrivateRoute><ManageCourse /></PrivateRoute>} />
        <Route path="/student/browse" element={<PrivateRoute><BrowseCourses /></PrivateRoute>} />
        <Route path="/student/course/:courseId" element={<PrivateRoute><LearnCourse /></PrivateRoute>} />  
        <Route path="/student/quiz/:lessonId" element={<PrivateRoute><QuizView /></PrivateRoute>} />
        <Route path="/student/chatbot/:courseId" element={<PrivateRoute><CourseChatbot /></PrivateRoute>} />
        <Route path="/student/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
        <Route path="/instructor/course/:courseId/schedule" element={<PrivateRoute><ScheduleSession /></PrivateRoute>} />
        <Route path="/live/:roomName" element={<PrivateRoute><LiveSession /></PrivateRoute>} />
        <Route path="/instructor/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/student/course/:courseId/rate" element={<PrivateRoute><RateCourse /></PrivateRoute>} />
        <Route path="/student/discussion/:lessonId" element={<PrivateRoute><LessonDiscussion /></PrivateRoute>} />

      </Routes>
    </BrowserRouter>
  );  
}