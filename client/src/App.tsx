import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import { AuthBootstrap } from './components/AuthBootstrap';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import DashboardLayout from './layouts/DashboardLayout';
import ComingSoonPage from './pages/dashboard/ComingSoonPage';
import { SignupProvider } from './context/SignupContext.tsx';

import { Provider } from 'react-redux';
import { store } from './store';

const PRIMARY = '#137fec';

const App = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
      theme={{
        algorithm: antTheme.defaultAlgorithm,
        token: {
          colorPrimary: PRIMARY,
          fontFamily: 'Inter, sans-serif',
          borderRadius: 8,
        },
      }}
    >
      <SignupProvider>
        <BrowserRouter>
          <AuthBootstrap>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Dashboard Nested Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="memories" element={<ComingSoonPage title="Memories" />} />
                <Route path="tasks" element={<ComingSoonPage title="Tasks" />} />
                <Route path="reminders" element={<ComingSoonPage title="Reminders" />} />
                <Route path="calendar" element={<ComingSoonPage title="Calendar" />} />
                <Route path="files" element={<ComingSoonPage title="Files" />} />
                <Route path="journal" element={<ComingSoonPage title="Journal" />} />
                <Route path="knowledge" element={<ComingSoonPage title="Knowledge" />} />
                <Route path="expenses" element={<ComingSoonPage title="Expenses" />} />
                <Route path="activity" element={<ComingSoonPage title="Activity" />} />
                <Route path="integrations" element={<ComingSoonPage title="Integrations" />} />
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
