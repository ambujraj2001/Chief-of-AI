import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';

type NavItem = {
  icon: string;
  label: string;
  path: string;
};

const NAV_ITEMS: NavItem[] = [
  { icon: 'chat', label: 'Chat', path: '/dashboard' },
  { icon: 'psychology', label: 'Memories', path: '/dashboard/memories' },
  { icon: 'task_alt', label: 'Tasks', path: '/dashboard/tasks' },
  { icon: 'notifications', label: 'Reminders', path: '/dashboard/reminders' },
  { icon: 'calendar_today', label: 'Calendar', path: '/dashboard/calendar' },
  { icon: 'folder', label: 'Files', path: '/dashboard/files' },
  { icon: 'auto_stories', label: 'Journal', path: '/dashboard/journal' },
  { icon: 'school', label: 'Knowledge', path: '/dashboard/knowledge' },
  { icon: 'payments', label: 'Expenses', path: '/dashboard/expenses' },
  { icon: 'insights', label: 'Activity', path: '/dashboard/activity' },
  { icon: 'hub', label: 'Integrations', path: '/dashboard/integrations' },
  { icon: 'settings', label: 'Settings', path: '/dashboard/settings' },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean; // New prop
  onCloseMobile?: () => void; // New prop
};

const Sidebar = ({ collapsed, onToggle, isMobile, onCloseMobile }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = useSelector((state: RootState) => state.user.fullName);

  const [showLogout, setShowLogout] = useState(false);

  const activeItem = useMemo(() => 
    NAV_ITEMS.find(item => item.path === location.pathname)?.label || 'Chat',
    [location]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessCode');
    sessionStorage.removeItem('chief_user');
    navigate('/login');
  }, [navigate]);

  const handleNav = useCallback((item: NavItem) => {
    navigate(item.path);
    if (onCloseMobile) onCloseMobile();
  }, [navigate, onCloseMobile]);

  const handleOpenDashboard = useCallback(() => {
    navigate('/dashboard');
    if (onCloseMobile) onCloseMobile();
  }, [navigate, onCloseMobile]);

  const handleToggleLogout = useCallback(() => {
    setShowLogout(prev => !prev);
  }, []);

  return (
    <aside
      className={`
        border-r border-slate-200 dark:border-slate-800
        bg-white dark:bg-background-dark
        flex flex-col shrink-0 overflow-visible relative h-full
        transition-all duration-300 ease-in-out
        ${collapsed && !isMobile ? 'w-[68px]' : 'w-64'}
      `}
    >
      {/* ── Logo / Toggle ─────────────────────────────── */}
      <div className="flex items-center h-16 px-3 gap-3">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`size-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0 ${isMobile ? 'hidden lg:flex' : 'flex'}`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {collapsed ? 'menu_open' : 'menu'}
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
            collapsed && !isMobile ? 'opacity-0 w-0 text-transparent' : 'opacity-100 w-full'
          }`}
          onClick={handleOpenDashboard}
          style={{ cursor: 'pointer' }}
        >
          <h1 className="text-sm font-bold tracking-tight">CHIEF OF AI</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
            Enterprise Version
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────── */}
      <div className="flex flex-col gap-1 grow px-2 py-3 overflow-y-auto">
        {/* Nav Items */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeItem === item.label;
            const isCollapsedStyle = collapsed && !isMobile;
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                title={isCollapsedStyle ? item.label : undefined}
                className={`
                  flex items-center rounded-lg font-medium text-sm transition-colors w-full
                  ${isCollapsedStyle ? 'justify-center py-2' : 'gap-3 px-3 py-2 text-left'}
                  ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }
                `}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  {item.icon}
                </span>
                {!isCollapsedStyle && (
                  <span className="overflow-hidden whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── User Profile ──────────────────────────────── */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 relative overflow-visible">
        {collapsed && !isMobile && showLogout && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold text-sm shadow-2xl whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Logout Account</span>
            </button>
          </div>
        )}

        <div className={`flex items-center w-full rounded-xl p-2 ${collapsed && !isMobile ? 'justify-center' : 'gap-2 sm:gap-3'}`}>
          <div
            className="size-8 sm:size-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer hover:opacity-80 transition-opacity border border-slate-200 dark:border-slate-700"
            onClick={handleToggleLogout}
            title={collapsed && !isMobile ? (showLogout ? 'Close Menu' : 'Open Menu') : undefined}
            style={{
              backgroundImage:
                `url('https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=137fec&color=fff&size=64')`,
              backgroundSize: 'cover',
            }}
          />
          {!(collapsed && !isMobile) && (
            <>
              <div className="flex flex-col overflow-hidden text-left grow">
                <p className="text-xs font-bold truncate leading-tight">{userName}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Pro Plan Member</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center size-8 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all shadow-sm shrink-0"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
