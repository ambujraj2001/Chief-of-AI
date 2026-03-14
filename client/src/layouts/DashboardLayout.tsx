import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { message, Modal, Dropdown, Tooltip, Spin } from "antd";
import type { MenuProps } from "antd";
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import Sidebar from "../pages/dashboard/layout/Sidebar";
import Joyride, { STATUS } from "react-joyride";
import type { Step, CallBackProps } from "react-joyride";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";
import { apiUpdateProfile } from "../services/api";

const IntelligencePanel = lazy(
  () => import("../features/intelligence/IntelligencePanel"),
);

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const isChatPage =
    location.pathname === "/dashboard" ||
    location.pathname === "/dashboard/" ||
    location.pathname.startsWith("/dashboard/chat/");
  const user = useSelector((state: RootState) => state.user);
  const userName = user.fullName;
  const showDemo = user.showDemo;
  const accessCode =
    user.accessCode || localStorage.getItem("accessCode") || "";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 1024,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [isIncognito, setIsIncognito] = useState<boolean>(false);

  useEffect(() => {
    const checkIncognito = () => {
      const stored = localStorage.getItem("incognitoUntil");
      if (stored) {
        setIsIncognito(parseInt(stored, 10) > Date.now());
      } else {
        setIsIncognito(false);
      }
    };
    checkIncognito();
    const interval = setInterval(checkIncognito, 5000); // Check every 5 second to keep synced across tabs/actions
    return () => clearInterval(interval);
  }, []);

  const handleToggleSidebar = useCallback(
    () => setSidebarCollapsed((p) => !p),
    [],
  );
  const handleCloseMobileMenu = useCallback(
    () => setIsMobileMenuOpen(false),
    [],
  );
  const handleOpenMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);

  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  const toggleDark = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const tourSteps: Step[] = [
    {
      target: "#sidebar-main-nav",
      content:
        "Welcome! This is your intelligence hub. You can access all your specialized modules like Memories, Tasks, and Files here.",
      placement: "top", // Changed from right to top as per request
      disableBeacon: true,
      disableScrolling: true,
    },
    {
      target: "#chat-input",
      content:
        "This is your AI Command Center. Type or speak commands to instantly control any of the modules or documents.",
      placement: "top",
    },
    {
      target: "#send-button",
      content:
        "Click here or press Enter to send your commands to the AI assistant.",
      placement: "left",
    },
    {
      target: "#sidebar-bottom-nav",
      content:
        "Access system settings and connect third-party integrations like Calendar and Slack to supercharge your AI.",
      placement: "top",
      disableScrolling: true,
    },
    {
      target: "#theme-toggle-btn",
      content:
        "Switch between high-contrast dark mode and clean light mode to suit your workspace.",
      placement: "bottom",
    },
  ];

  const handleJoyrideCallback = useCallback(
    async (data: CallBackProps) => {
      const { status } = data;
      if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
        setRunTour(false);
        try {
          const response = await apiUpdateProfile({
            accessCode,
            showDemo: true, // Marking as done
          });
          dispatch(setUser(response));
        } catch (err) {
          console.error("Failed to update tour status:", err);
        }
      }
    },
    [accessCode, dispatch],
  );

  useEffect(() => {
    if (user.fullName && showDemo === false) {
      console.log("Tour trigger conditions met. Starting in 2s...");
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user.fullName, showDemo]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success("Link copied to clipboard!");
    });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("accessCode");
    sessionStorage.removeItem("chief_user");
    navigate("/login");
  }, [navigate]);

  const menuItems: MenuProps["items"] = [
    {
      key: "logout",
      label: (
        <div className="flex items-center gap-2 text-rose-600 font-bold py-1">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Logout</span>
        </div>
      ),
      onClick: () => setLogoutModalVisible(true),
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display relative">
      {/* Logout Confirmation Modal */}
      <Modal
        title={null}
        open={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        footer={null}
        centered
        width={400}
        className="dark-modal"
      >
        <div className="text-center py-6">
          <div className="size-16 rounded-full bg-rose-50 dark:bg-rose-900/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <h1 className="text-sm font-black tracking-tighter">CHIEF OF AI</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
              AI OPERATING SYSTEM
            </p>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            Confirm Logout
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 px-4">
            Are you sure you want to sign out of your account? You will need to
            enter your access code to log back in.
          </p>
          <div className="flex gap-3 px-4">
            <button
              onClick={() => setLogoutModalVisible(false)}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-display"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 font-display"
            >
              Logout
            </button>
          </div>
        </div>
      </Modal>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleCloseMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          isMobile={true}
          onCloseMobile={handleCloseMobileMenu}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col w-full">
        {/* Unified App Header */}
        <header className="h-14 sm:h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 w-full">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden w-full">
            {/* Mobile menu toggle */}
            <button
              onClick={handleOpenMobileMenu}
              className="lg:hidden size-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="lg:hidden ml-1 text-sm font-bold tracking-tight text-slate-900 dark:text-white shrink-0 hidden sm:block">
              CHIEF OF AI
            </h1>

            <div className="flex flex-col overflow-hidden max-w-full lg:max-w-none">
              <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5 truncate uppercase tracking-tight">
                <span className="truncate">AI Nexus</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="size-1.5 sm:size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                  System Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Share */}
            <button
              onClick={handleShare}
              className="size-8 sm:size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Share Page"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-slate-600 dark:text-slate-400">
                share
              </span>
            </button>

            {/* Incognito Indicator */}
            {isIncognito && (
              <Tooltip
                title="Privacy Mode is active. Chats are not being saved."
                placement="bottom"
              >
                <div className="size-8 sm:size-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default transition-all">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                    visibility_off
                  </span>
                </div>
              </Tooltip>
            )}

            {/* Dark mode toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleDark}
              className="size-8 sm:size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle dark mode"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-slate-600 dark:text-slate-400">
                {darkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* User Profile Dropdown */}
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <button className="flex items-center gap-2 pl-2 cursor-pointer group outline-none">
                <div
                  className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 transition-all group-hover:border-primary/50"
                  style={{
                    backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "User")}&background=3c83f6&color=fff&size=64')`,
                    backgroundSize: "cover",
                  }}
                />
              </button>
            </Dropdown>
          </div>
        </header>

        {/* Dynamic Contextual Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative overflow-hidden flex flex-col min-w-0">
            <Outlet context={{ sidebarCollapsed, setSidebarCollapsed }} />
          </div>

          {isChatPage && (
            <Suspense
              fallback={
                <div className="w-[280px] xl:w-[320px] h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
                  <Spin />
                </div>
              }
            >
              <IntelligencePanel />
            </Suspense>
          )}
        </div>
      </main>

      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "#3c83f6",
            zIndex: 1000,
          },
        }}
      />
    </div>
  );
};

export default DashboardLayout;
