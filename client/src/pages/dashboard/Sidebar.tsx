import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';

type NavItem = {
  icon: string;
  label: string;
  path: string;
};

const NAV_ITEMS: NavItem[] = [
  { icon: 'add_box', label: 'New Conversation', path: '/dashboard' },
  { icon: 'chat_bubble', label: 'Recent Chats', path: '/dashboard/recent' },
  { icon: 'history', label: 'History', path: '/dashboard/history' },
  { icon: 'lightbulb', label: 'Prompt Library', path: '/dashboard/prompts' },
  { icon: 'settings', label: 'Settings', path: '/dashboard/settings' },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = useSelector((state: RootState) => state.user.fullName);

  const [showLogout, setShowLogout] = useState(false);

  const activeItem = NAV_ITEMS.find(item => item.path === location.pathname)?.label || 'Recent Chats';

  const handleLogout = () => {
    localStorage.removeItem('accessCode');
    sessionStorage.removeItem('chief_user');
    navigate('/login');
  };

  const handleNav = (item: NavItem) => {
    navigate(item.path);
  };

  return (
    <aside
      className={`
        border-r border-slate-200 dark:border-slate-800
        bg-white dark:bg-background-dark
        flex flex-col shrink-0 overflow-visible relative
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[68px]' : 'w-64'}
      `}
    >
      {/* ── Logo / Toggle ─────────────────────────────── */}
      <div className="flex items-center h-16 px-3 gap-3">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="size-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[22px]">
            {collapsed ? 'menu_open' : 'menu'}
          </span>
        </button>

        <div
          className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-200 ${
            collapsed ? 'opacity-0 w-0 text-transparent' : 'opacity-100 w-full'
          }`}
          onClick={() => navigate('/dashboard')}
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
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center rounded-lg font-medium text-sm transition-colors w-full
                  ${collapsed ? 'justify-center py-2' : 'gap-3 px-3 py-2 text-left'}
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
                {!collapsed && (
                  <span className="overflow-hidden whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── User Profile ──────────────────────────────── */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 relative overflow-visible">
        {collapsed && showLogout && (
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

        <div className={`flex items-center w-full rounded-xl p-2 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div
            className="size-8 rounded-full bg-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowLogout(!showLogout)}
            title={collapsed ? (showLogout ? 'Close Menu' : 'Open Menu') : undefined}
            style={{
              backgroundImage:
                `url('https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=137fec&color=fff&size=64')`,
              backgroundSize: 'cover',
            }}
          />
          {!collapsed && (
            <>
              <div className="flex flex-col overflow-hidden text-left grow">
                <p className="text-xs font-semibold truncate">{userName || 'Alex Richardson'}</p>
                <p className="text-[10px] text-slate-500">Pro Plan Member</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center size-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all shadow-sm shrink-0"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
