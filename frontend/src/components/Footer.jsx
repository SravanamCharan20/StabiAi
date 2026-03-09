import React from "react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden pt-20">

      <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center font-semibold leading-none text-slate-600 text-[10vw] sm:text-[8vw] lg:text-[7rem]">
      CAREER{" "}
<span className="bg-[linear-gradient(90deg,#1f2937,#6b7280,#111827)] bg-clip-text text-transparent">
  SHIELD
</span>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-600 sm:flex-row">
        </div>
      </div>

    </footer>
  );
};

export default Footer;