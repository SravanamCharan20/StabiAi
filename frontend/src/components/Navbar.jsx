import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiRobot2Line } from 'react-icons/ri';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div
        className={[
          'fixed top-4 left-0 right-0 z-50 mx-auto w-fit rounded-full border px-3 py-1 transition-all duration-300',
          isScrolled
            ? 'border-slate-300/70 bg-white/85 shadow-sm backdrop-blur-xl'
            : 'border-slate-300/60 bg-white/75 backdrop-blur-lg',
        ].join(' ')}
      >
        <div className="flex h-11 items-center justify-between gap-6 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <RiRobot2Line className="text-2xl text-slate-800" />
            <span className="text-sm font-semibold tracking-wide text-slate-900">StabiAI</span>
          </Link>

          <nav className="flex items-center">
            <Link
              to="/employee/predict"
              className={[
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                location.pathname.includes('/employee')
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              Employee Risk
            </Link>
          </nav>
        </div>
      </div>
      <div className="h-16" />
    </>
  );
};

export default Navbar;
