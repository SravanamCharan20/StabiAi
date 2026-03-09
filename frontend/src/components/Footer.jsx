import React from "react";

const Footer = () => {

  return (
    <footer className="relative overflow-hidden pt-10 min-h-[300px]">
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:132px_100%]"></div>
      
      <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center font-display text-[18vw] font-semibold leading-none tracking-tight sm:text-[14vw] lg:text-[10rem] z-10">
        <span className="text-slate-700/60">CAREER</span>
        {" "}
        <span className="text-blue-600/70">SHIELD</span>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-12 z-20">
        <div className="mt-10 flex flex-col items-center mb-2 justify-between gap-3 pt-5 text-xs text-slate-900 sm:flex-row">
         
        </div>
      </div>
    </footer>
  );
};

export default Footer;
