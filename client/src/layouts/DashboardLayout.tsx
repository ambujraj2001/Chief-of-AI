import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../pages/dashboard/Sidebar';

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);
  const handleCloseMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const handleOpenMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleCloseMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={handleToggleSidebar} 
          isMobile={true}
          onCloseMobile={handleCloseMobileMenu}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col w-full">
        {/* Mobile Header with Burger Menu */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
          <button
            onClick={handleOpenMobileMenu}
            className="size-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="ml-3 text-sm font-bold tracking-tight text-slate-900 dark:text-white">CHIEF OF AI</h1>
        </header>

        <Outlet context={{ sidebarCollapsed, setSidebarCollapsed }} />
      </main>
    </div>
  );
};

export default DashboardLayout;
