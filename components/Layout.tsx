import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Users, CheckSquare, BarChart2, Settings, Moon, Sun } from 'lucide-react';

const Layout: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => `flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
    >
      {({ isActive }) => (
        <>
          <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "scale-110 transition-transform" : ""} />
          <span className="text-[10px] font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    // Main Container - 100dvh handles mobile browser heights better
    <div className="h-[100dvh] flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Header */}
      <header className="flex-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-4 shadow-sm z-20 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400 tracking-tight">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          مدرسه یار
        </h1>
        <button 
          onClick={toggleTheme} 
          className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-700 hover:text-emerald-600 transition-all active:scale-95"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>
      
      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto scroll-smooth no-scrollbar relative w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center z-20 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.05)]">
        <NavItem to="/classes" icon={Home} label="کلاس‌ها" />
        <NavItem to="/students" icon={Users} label="دانش‌آموزان" />
        <NavItem to="/attendance" icon={CheckSquare} label="حضورغیاب" />
        <NavItem to="/reports" icon={BarChart2} label="گزارشات" />
        <NavItem to="/settings" icon={Settings} label="تنظیمات" />
      </nav>
    </div>
  );
};

export default Layout;