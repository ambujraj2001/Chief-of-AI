import { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme as antTheme } from "antd";
import { AuthBootstrap } from "./components/AuthBootstrap";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Dashboard - Overview
import DashboardPage from "./pages/dashboard/overview/DashboardPage";
import ActivityPage from "./pages/dashboard/overview/ActivityPage";
import RecentChatsPage from "./pages/dashboard/overview/RecentChatsPage";

// Dashboard - Productivity
import TasksPage from "./pages/dashboard/productivity/TasksPage";
import RemindersPage from "./pages/dashboard/productivity/RemindersPage";
import CalendarPage from "./pages/dashboard/productivity/CalendarPage";
import JournalPage from "./pages/dashboard/productivity/JournalPage";

// Dashboard - Knowledge
import KnowledgePage from "./pages/dashboard/knowledge/KnowledgePage";
import FilesPage from "./pages/dashboard/knowledge/FilesPage";
import MemoriesPage from "./pages/dashboard/knowledge/MemoriesPage";

// Dashboard - Apps
import AppsPage from "./pages/dashboard/apps/AppsPage";
import AppPage from "./pages/dashboard/apps/AppPage";
import AIRoutinesPage from "./pages/dashboard/apps/AIRoutinesPage";

// Dashboard - Settings
import SettingsPage from "./pages/dashboard/settings/SettingsPage";

// Dashboard - Misc
import ComingSoonPage from "./pages/dashboard/misc/ComingSoonPage";

import { Provider } from "react-redux";
import { store } from "./store";
import DashboardLayout from "./layouts/DashboardLayout";
import { SignupProvider } from "./context/SignupContext.tsx";

const PRIMARY = "#3c83f6";

const App = () => {
  const themeConfig = useMemo(
    () => ({
      algorithm: antTheme.defaultAlgorithm,
      token: {
        colorPrimary: PRIMARY,
        fontFamily: "Inter, sans-serif",
        borderRadius: 8,
      },
    }),
    [],
  );

  return (
    <Provider store={store}>
      <ConfigProvider theme={themeConfig}>
        <SignupProvider>
          <BrowserRouter>
            <AuthBootstrap>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route
                  path="/forgot-access-code"
                  element={<ForgotPasswordPage />}
                />

                {/* Dashboard Nested Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route
                    path="chat/:conversationId"
                    element={<DashboardPage />}
                  />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="chats" element={<RecentChatsPage />} />
                  <Route path="memories" element={<MemoriesPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="reminders" element={<RemindersPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="files" element={<FilesPage />} />
                  <Route path="journal" element={<JournalPage />} />
                  <Route path="knowledge" element={<KnowledgePage />} />
                  <Route path="apps" element={<AppsPage />} />
                  <Route path="app/:appId" element={<AppPage />} />
                  <Route path="routines" element={<AIRoutinesPage />} />
                  <Route path="activity" element={<ActivityPage />} />
                  <Route
                    path="integrations"
                    element={
                      <ComingSoonPage
                        title="Integrations"
                        message="We're building powerful integrations to connect your AI workspace with the tools you use every day."
                      />
                    }
                  />
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </AuthBootstrap>
          </BrowserRouter>
        </SignupProvider>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
