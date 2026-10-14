import { Navigate, Route, Routes } from "react-router";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { GuestRoute, ProtectedRoute } from "./components/routing/Guards";
import { AdminCompaniesPage } from "./pages/admin/AdminCompaniesPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminJobsPage } from "./pages/admin/AdminJobsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { EmployerApplicantsPage } from "./pages/employer/EmployerApplicantsPage";
import { EmployerDashboard } from "./pages/employer/EmployerDashboard";
import { PostJobPage } from "./pages/employer/PostJobPage";
import { NotFoundPage, ServerErrorPage } from "./pages/ErrorPages";
import { JobDetailsPage } from "./pages/JobDetailsPage";
import { JobsPage } from "./pages/JobsPage";
import { LandingPage } from "./pages/LandingPage";
import { MessagesPage } from "./pages/MessagesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ApplicationsPage } from "./pages/worker/ApplicationsPage";
import { WorkerDashboard } from "./pages/worker/WorkerDashboard";
import { WorkerProfilePage } from "./pages/worker/WorkerProfilePage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["worker"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/worker/profile" element={<WorkerProfilePage />} />
          <Route path="/worker/applications" element={<ApplicationsPage />} />
          <Route path="/worker/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["employer"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/employer" element={<EmployerDashboard />} />
          <Route path="/employer/jobs/new" element={<PostJobPage />} />
          <Route path="/employer/applicants" element={<EmployerApplicantsPage />} />
          <Route path="/employer/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin", "superAdmin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          <Route path="/admin/jobs" element={<AdminJobsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/messages" element={<MessagesPage />} />
        </Route>
      </Route>

      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
