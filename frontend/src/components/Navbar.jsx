import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiRobot2Line } from 'react-icons/ri';
import { HiOutlineChartBar, HiOutlineHome, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const homeActive = location.pathname === '/';
  const predictorActive = location.pathname.includes('/employee');

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-3">
        <div
          className={[
            'inline-flex items-center gap-1 rounded-full border p-1.5 transition-all duration-300',
            isScrolled
              ? 'border-slate-300/80 bg-white/90 shadow-md backdrop-blur-xl'
              : 'border-slate-300/70 bg-white/82 shadow-sm backdrop-blur-lg',
          ].join(' ')}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
              <RiRobot2Line className="text-lg" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">Career Shield</span>
          </Link>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <Link
            to="/"
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition',
              homeActive
                ? 'border border-black bg-slate-200 text-black'
                : 'text-slate-700 hover:bg-slate-100',
            ].join(' ')}
          >
            <HiOutlineHome className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/employee/predict"
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition',
                predictorActive
                  ? 'border border-black bg-slate-200 text-black'
                  : 'text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              <HiOutlineChartBar className="h-4 w-4" />
              <span className="hidden sm:inline">Predictor</span>
            </Link>
          )}

          <span className="mx-1 h-5 w-px bg-slate-200" />

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <HiOutlineUser className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.fullName?.split(' ')[0] || 'User'}</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="p-3 border-b border-slate-200">
                    <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    {user?.role && (
                      <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {user.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <HiOutlineLogout className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
      <div className="h-20" />
    </>
  );
};

export default Navbar;
