import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { MusicProvider } from "./context/MusicContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Landing } from "./pages/Landing";
import { CandidateLogin } from "./pages/auth/CandidateLogin";
import { CounselorLogin } from "./pages/auth/CounselorLogin";
import { CandidateRegister } from "./pages/auth/CandidateRegister";
import { CounselorRegister } from "./pages/auth/CounselorRegister";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";

// Parent Authentication & Portal Pages
import { ParentLogin } from "./pages/parent/ParentLogin";
import { ParentRegister } from "./pages/parent/ParentRegister";
import { ParentLayout } from "./layouts/ParentLayout";
import { ParentDashboard } from "./pages/parent/ParentDashboard";
import { ParentStudents } from "./pages/parent/ParentStudents";
import { ParentAlerts } from "./pages/parent/ParentAlerts";
import { ParentCounselors } from "./pages/parent/ParentCounselors";
import { ParentAppointments } from "./pages/parent/ParentAppointments";
import { ParentSettings } from "./pages/parent/ParentSettings";

import { CandidateLayout } from "./layouts/CandidateLayout";
import { CounselorLayout } from "./layouts/CounselorLayout";

import { CandidateDashboard } from "./pages/candidate/Dashboard";
import { GlobalSearchPage } from "./pages/candidate/GlobalSearchPage";
import { Companion } from "./pages/candidate/Companion";
import { CandidateFindCounselors } from "./pages/candidate/FindCounselors";
import { CandidateBookAppointment } from "./pages/candidate/BookAppointment";
import { CandidateAppointments } from "./pages/candidate/Appointments";
import { AssessmentPage } from "./pages/candidate/Assessment";
import { PermissionsPage } from "./pages/candidate/Permissions";
import { CandidateConsultationPage } from "./pages/candidate/Consultation";
import { CandidateChats } from "./pages/candidate/Chats";
import { EmergencyContacts } from "./pages/candidate/Emergency";
import { CandidateSettings } from "./pages/candidate/Settings";
import { ParentLinkingPage } from "./pages/candidate/ParentLinkingPage";

// AI Assistant & Media Portal Pages
import { AiChatPage } from "./pages/ai/AiChatPage";
import { EntertainmentHub } from "./pages/media/EntertainmentHub";
import { MusicPage } from "./pages/media/MusicPage";
import { VideoPage } from "./pages/media/VideoPage";
import { MemesPage } from "./pages/media/MemesPage";
import { MemoryManager } from "./pages/candidate/MemoryManager";
import { FavoritesPage } from "./pages/media/FavoritesPage";
import { HistoryPage } from "./pages/media/HistoryPage";

import { NotificationsPage } from "./pages/Notifications";

import { CounselorDashboard } from "./pages/counselor/Dashboard";
import { CounselorProfile } from "./pages/counselor/Profile";
import { AppointmentRequests } from "./pages/counselor/AppointmentRequests";
import { CounselorAppointments } from "./pages/counselor/Appointments";
import { CounselorCandidates } from "./pages/counselor/Patients";
import { CounselorChats } from "./pages/counselor/Chats";
import { CounselorAvailability } from "./pages/counselor/Availability";
import { CounselorSettings } from "./pages/counselor/Settings";
import { CounselorConsultationPage } from "./pages/counselor/Consultation";

function ProtectedCandidate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans text-slate-500">Loading candidate portal…</div>;
  if (!user) return <Navigate to="/login/candidate" replace />;
  if (user.role !== "candidate" && user.role !== "patient") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Unauthorized Portal Access</h1>
        <p className="text-slate-500">This portal is reserved for candidates. Counselors must use the Counselor Portal.</p>
        <a href="/counselor/dashboard" className="btn-primary">Go to Counselor Dashboard</a>
      </div>
    );
  }
  return <>{children}</>;
}

function ProtectedCounselor({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans text-slate-500">Loading counselor portal…</div>;
  if (!user) return <Navigate to="/login/counselor" replace />;
  if (user.role !== "counselor") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Unauthorized Portal Access</h1>
        <p className="text-slate-500">This portal is reserved for counselors. Candidates must use the Candidate Portal.</p>
        <a href="/candidate/dashboard" className="btn-primary">Go to Candidate Dashboard</a>
      </div>
    );
  }
  return <>{children}</>;
}

function ProtectedParent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans text-slate-500">Loading parent portal…</div>;
  if (!user) return <Navigate to="/login/parent" replace />;
  if (user.role !== "parent") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Unauthorized Portal Access</h1>
        <p className="text-slate-500">This portal is reserved for parents and guardians.</p>
        <a href="/candidate/dashboard" className="btn-primary">Go to Candidate Dashboard</a>
      </div>
    );
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "parent") return <Navigate to="/parent/dashboard" replace />;
  if (user?.role === "counselor") return <Navigate to="/counselor/dashboard" replace />;
  if (user?.role === "candidate" || user?.role === "patient") return <Navigate to="/candidate/dashboard" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MusicProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login/candidate" element={<CandidateLogin />} />
            <Route path="/login/patient" element={<Navigate to="/login/candidate" replace />} />
            <Route path="/login/counselor" element={<CounselorLogin />} />
            <Route path="/login/parent" element={<ParentLogin />} />
            <Route path="/register/candidate" element={<CandidateRegister />} />
            <Route path="/register/patient" element={<Navigate to="/register/candidate" replace />} />
            <Route path="/register/counselor" element={<CounselorRegister />} />
            <Route path="/register/parent" element={<ParentRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Candidate Portal Routes */}
            <Route path="/candidate" element={
              <ProtectedCandidate><CandidateLayout /></ProtectedCandidate>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CandidateDashboard />} />
              <Route path="entertainment" element={<EntertainmentHub />} />
              <Route path="ai-chat" element={<AiChatPage />} />
              <Route path="music" element={<MusicPage />} />
              <Route path="videos" element={<VideoPage />} />
              <Route path="memes" element={<MemesPage />} />
              <Route path="memory" element={<MemoryManager />} />
              <Route path="favorites" element={<Navigate to="/candidate/dashboard" replace />} />
              <Route path="history" element={<Navigate to="/candidate/dashboard" replace />} />
              <Route path="companion" element={<Companion />} />
              <Route path="counselors" element={<CandidateFindCounselors />} />
              <Route path="book/:id" element={<CandidateBookAppointment />} />
              <Route path="appointments" element={<CandidateAppointments />} />
              <Route path="parents" element={<ParentLinkingPage />} />
              <Route path="chats" element={<CandidateChats />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="emergency" element={<EmergencyContacts />} />
              <Route path="assessment" element={<AssessmentPage />} />
              <Route path="permissions" element={<PermissionsPage />} />
              <Route path="consultation/:id" element={<CandidateConsultationPage />} />
              <Route path="search" element={<GlobalSearchPage />} />
              <Route path="settings" element={<CandidateSettings />} />
            </Route>

            {/* Redirect legacy /patient routes to /candidate */}
            <Route path="/patient/*" element={<Navigate to="/candidate" replace />} />

            {/* Parent Portal Routes */}
            <Route path="/parent" element={
              <ProtectedParent><ParentLayout /></ProtectedParent>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ParentDashboard />} />
              <Route path="students" element={<ParentStudents />} />
              <Route path="alerts" element={<ParentAlerts />} />
              <Route path="counselors" element={<ParentCounselors />} />
              <Route path="appointments" element={<ParentAppointments />} />
              <Route path="settings" element={<ParentSettings />} />
            </Route>

            {/* Counselor Portal Routes */}
            <Route path="/counselor" element={
              <ProtectedCounselor><CounselorLayout /></ProtectedCounselor>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CounselorDashboard />} />
              <Route path="profile" element={<CounselorProfile />} />
              <Route path="appointment-requests" element={<AppointmentRequests />} />
              <Route path="appointments" element={<CounselorAppointments />} />
              <Route path="patients" element={<CounselorCandidates />} />
              <Route path="candidates" element={<CounselorCandidates />} />
              <Route path="chats" element={<CounselorChats />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="consultation/:id" element={<CounselorConsultationPage />} />
              <Route path="availability" element={<CounselorAvailability />} />
              <Route path="settings" element={<CounselorSettings />} />
            </Route>
          </Routes>
        </MusicProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
