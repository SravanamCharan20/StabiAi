import React from "react";
import { Link } from "react-router-dom";
import { RiRobot2Line } from "react-icons/ri";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-[#070d14] text-slate-200">
      <div className="pointer-events-none absolute inset-x-0 bottom-[-0.28em] text-center font-display text-[34vw] font-semibold leading-none text-slate-400/20 sm:text-[26vw] lg:text-[18rem]">
        STABI <span className="text-purple-200/40">AI</span>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-white shadow-sm">
            <RiRobot2Line className="text-2xl" />
          </div>
          <p className="max-w-lg text-center text-sm leading-relaxed text-slate-400">
            
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800/80 pt-5 text-xs text-slate-400 sm:flex-row">
          <p>© {year} StabiAI</p>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
