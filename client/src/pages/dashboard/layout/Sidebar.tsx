import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type NavItem = {
  icon: string;
  label: string;
  path: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "ASSISTANT",
    items: [
      { icon: "chat", label: "Chat", path: "/dashboard" },
      { icon: "history", label: "Recent Chat", path: "/dashboard/chats" },
    ],
  },
  {
    label: "WORKSPACE",
    items: [
      { icon: "task_alt", label: "Tasks", path: "/dashboard/tasks" },
      {
        icon: "notifications",
        label: "Reminders",
        path: "/dashboard/reminders",
      },
      {
        icon: "calendar_today",
        label: "Calendar",
        path: "/dashboard/calendar",
      },
      { icon: "folder", label: "Files", path: "/dashboard/files" },
    ],
  },
  {
    label: "KNOWLEDGE",
    items: [
      { icon: "psychology", label: "Memories", path: "/dashboard/memories" },
      { icon: "auto_stories", label: "Journal", path: "/dashboard/journal" },
      { icon: "school", label: "Knowledge", path: "/dashboard/knowledge" },
    ],
  },
  {
    label: "AUTOMATION",
    items: [
      { icon: "schedule", label: "AI Routines", path: "/dashboard/routines" },
      { icon: "apps", label: "Apps", path: "/dashboard/apps" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { icon: "insights", label: "Activity", path: "/dashboard/activity" },
      { icon: "hub", label: "Integrations", path: "/dashboard/integrations" },
      { icon: "settings", label: "Settings", path: "/dashboard/settings" },
    ],
  },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
};

const Sidebar = ({
  collapsed,
  onToggle,
  isMobile,
  onCloseMobile,
}: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const allItems = useMemo(
    () => NAV_GROUPS.flatMap((group) => group.items),
    [],
  );

  const activeItem = useMemo(
    () =>
      allItems.find((item) => item.path === location.pathname)?.label || "Chat",
    [location, allItems],
  );

  const handleNav = useCallback(
    (item: NavItem) => {
      navigate(item.path);
      if (onCloseMobile) onCloseMobile();
    },
    [navigate, onCloseMobile],
  );

  const handleOpenDashboard = useCallback(() => {
    navigate("/dashboard");
    if (onCloseMobile) onCloseMobile();
  }, [navigate, onCloseMobile]);

  return (
    <aside
      className={`
        border-r border-slate-200 dark:border-slate-800
        bg-white dark:bg-background-dark
        flex flex-col shrink-0 overflow-visible relative h-full
        transition-all duration-300 ease-in-out
        ${collapsed && !isMobile ? "w-[68px]" : "w-64"}
      `}
    >
      {/* ── Logo / Toggle ─────────────────────────────── */}
      <div className="flex items-center h-16 px-3 gap-3 border-b border-slate-100 dark:border-slate-800/50">
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`size-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0 ${isMobile ? "hidden lg:flex" : "flex"}`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {collapsed ? "menu_open" : "menu"}
          </span>
        </button>

        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden size-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}

        <div
          className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-200 ${
            collapsed && !isMobile
              ? "opacity-0 w-0 text-transparent"
              : "opacity-100 w-full"
          }`}
          onClick={handleOpenDashboard}
          style={{ cursor: "pointer" }}
        >
          <h1 className="text-sm font-bold tracking-tight">CHIEF OF AI</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
            Enterprise Version
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────── */}
      <div className="flex flex-col grow px-2 py-4 overflow-y-auto custom-scrollbar">
        <nav className="flex flex-col gap-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              {!collapsed || isMobile ? (
                <div className="px-3 mb-2">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                    {group.label}
                  </span>
                </div>
              ) : (
                <div className="h-4" /> // Spacer when collapsed
              )}
              {group.items.map((item) => {
                const isActive = activeItem === item.label;
                const isCollapsedStyle = collapsed && !isMobile;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item)}
                    title={isCollapsedStyle ? item.label : undefined}
                    className={`
                      flex items-center rounded-lg font-medium text-sm transition-all duration-200 w-full
                      ${isCollapsedStyle ? "justify-center py-2" : "gap-3 px-3 py-2 text-left"}
                      ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }
                    `}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? "font-variation-bold" : ""}`}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsedStyle && (
                      <span className="overflow-hidden whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
