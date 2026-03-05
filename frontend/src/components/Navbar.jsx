import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiRobot2Line } from 'react-icons/ri';
import { HiOutlineChartBar, HiOutlineHome } from 'react-icons/hi';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const homeActive = location.pathname === '/';
  const predictorActive = location.pathname.includes('/employee');

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
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">StabiAI</span>
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
        </div>
      </div>
      <div className="h-20" />
    </>
  );
};

export default Navbar;
