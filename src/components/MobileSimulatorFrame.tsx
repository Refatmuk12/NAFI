import React from 'react';
import { Wifi, Battery, Signal, Maximize2, Minimize2 } from 'lucide-react';

interface MobileSimulatorFrameProps {
  children: React.ReactNode;
  isWideView: boolean;
  setIsWideView: (val: boolean) => void;
}

export default function MobileSimulatorFrame({ 
  children, 
  isWideView, 
  setIsWideView 
}: MobileSimulatorFrameProps) {
  
  if (isWideView) {
    return (
      <div className="w-full min-h-screen bg-[#FFFDEB] p-0 transition-all duration-300">
        {/* Float Control Button to switch back to phone mode */}
        <button
          onClick={() => setIsWideView(false)}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#346739] text-[#FFFDEB] shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold border border-[#346739]/20"
          title="Switch to Mobile View Simulator"
        >
          <Minimize2 className="h-4 w-4" />
          <span>Mode Simulator HP</span>
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FFFDEB] text-[#091413] flex flex-col items-center justify-center p-4 md:py-8 transition-all duration-300 relative overflow-hidden">
      
      {/* Background decoration glows */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-glow-organic rounded-full -z-10" />
      
      {/* Control panel & info beside the phone simulator on desktop */}
      <div className="hidden lg:flex flex-col items-center mb-6 max-w-md text-center">
        <h2 className="text-xl font-extrabold text-[#091413]">
          Navigator Financial (NaFi)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Simulasi Aplikasi Mobile. Klik tombol di bawah untuk melihat tampilan penuh halaman web (wide-screen).
        </p>
        <button
          onClick={() => setIsWideView(true)}
          className="mt-3 px-4 py-1.5 rounded-lg bg-[#346739]/10 text-[#346739] border border-[#346739]/20 text-3xs font-black tracking-wider uppercase hover:bg-[#346739]/25 transition-all flex items-center gap-1.5"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Mode Penuh (Wide Screen)
        </button>
      </div>

      {/* MOBILE DEVICE CONTAINER */}
      {/* On mobile screens, it is w-full h-screen (no bezels). On desktop screens, it is bounded as a phone. */}
      <div className="w-full max-w-[400px] h-[840px] md:h-[820px] rounded-[48px] bg-[#091413] p-3 shadow-2xl relative border-4 border-[#346739]/20 flex flex-col shrink-0 select-none scale-95 sm:scale-100 transition-transform duration-300">
        
        {/* Physical Button elements on phone sides */}
        <div className="absolute top-28 -left-1.5 w-1 h-12 bg-[#091413] rounded-r border-r border-[#346739]/30" />
        <div className="absolute top-44 -left-1.5 w-1 h-12 bg-[#091413] rounded-r border-r border-[#346739]/30" />
        <div className="absolute top-36 -right-1.5 w-1 h-16 bg-[#091413] rounded-l border-l border-[#346739]/30" />

        {/* INNER SCREEN */}
        <div className="w-full h-full bg-[#FFFDEB] rounded-[40px] overflow-hidden flex flex-col relative border border-[#FFFDEB]/20">
          
          {/* Top Notch / Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#091413] rounded-full z-50 flex items-center justify-center">
            {/* Small camera dot */}
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800 ml-16" />
          </div>

          {/* Status Bar */}
          <div className="h-10 px-6 pt-2 flex items-center justify-between text-2xs font-extrabold text-[#091413] bg-[#FFFDEB] z-40 select-none">
            {/* Time */}
            <div>17:57</div>
            
            {/* Icons */}
            <div className="flex items-center gap-1">
              <Signal className="h-3.5 w-3.5" />
              <Wifi className="h-3.5 w-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-3xs font-semibold mr-0.5">98%</span>
                <Battery className="h-4 w-4 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* SCREEN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative select-none">
            {children}
          </div>

          {/* HOME INDICATOR */}
          <div className="h-6 bg-[#FFFDEB] flex items-center justify-center pb-2 z-40">
            <div className="w-28 h-1 bg-[#091413] rounded-full opacity-60" />
          </div>

        </div>
      </div>
      
      {/* Toggler button for small mobile screens - invisible on desktop */}
      <button 
        onClick={() => setIsWideView(true)}
        className="mt-4 lg:hidden px-4 py-1.5 rounded-lg bg-[#346739]/10 text-[#346739] text-3xs font-extrabold uppercase border border-[#346739]/20"
      >
        Lihat Versi Full Screen
      </button>
    </div>
  );
}
