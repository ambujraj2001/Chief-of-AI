import { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme as antTheme } from "antd";
import { AuthBootstrap } from "./components/AuthBootstrap";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import DashboardLayout from "./layouts/DashboardLayout";
import RecentChatsPage from "./pages/dashboard/RecentChatsPage";
import MemoriesPage from "./pages/dashboard/MemoriesPage";
import KnowledgePage from "./pages/dashboard/KnowledgePage";
import ComingSoonPage from "./pages/dashboard/ComingSoonPage";
import { SignupProvider } from "./context/SignupContext.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

import { Provider } from "react-redux";
import { store } from "./store";
import JournalPage from "./pages/dashboard/JournalPage.tsx";
import TasksPage from "./pages/dashboard/TasksPage.tsx";
import ActivityPage from "./pages/dashboard/ActivityPage.tsx";
import CalendarPage from "./pages/dashboard/CalendarPage.tsx";
import RemindersPage from "./pages/dashboard/RemindersPage.tsx";
import FilesPage from "./pages/dashboard/FilesPage.tsx";
import AppPage from "./pages/dashboard/AppPage.tsx";
import AppsPage from "./pages/dashboard/AppsPage.tsx";

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
