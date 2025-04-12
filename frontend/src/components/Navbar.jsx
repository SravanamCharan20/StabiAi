/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { RiRobot2Line } from 'react-icons/ri'

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
      <div className={`
        fixed top-0 left-0 right-0 z-50 
        transition-all duration-300 ease-out
        rounded-full border border-gray-400/50 w-fit mx-auto mt-10 px-3 py-1
        ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50' : 'bg-transparent'}
      `}>
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-10 h-12 px-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-5">
              <RiRobot2Line className="text-3xl mb-1 text-gray-900" />
              <span className="text-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">StabiAI</span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { path: '/employee/predict', label: 'Employee' },
                { path: '/student/predict', label: 'Student' },
                { path: '/investor/predict', label: 'Investor' }
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    text-sm font-medium tracking-tight
                    transition-colors duration-200
                    ${location.pathname.includes(item.path) 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-blue-600'
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth Links */}
            <div className="flex items-center gap-6">
              <Link
                to="/signup"
                className="
                  text-sm font-medium tracking-tight
                  bg-gray-900 text-white
                  px-4 py-1.5 rounded-full
                  hover:bg-gray-800
                  transition-all duration-200
                "
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="h-12"></div>
    </>
  )
}

export default Navbar