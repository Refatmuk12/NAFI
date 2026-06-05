import React from 'react';

interface MobileSimulatorFrameProps {
  children: React.ReactNode;
}

export default function MobileSimulatorFrame({ children }: MobileSimulatorFrameProps) {
  return (
    <div className="w-full min-h-screen bg-[#091413] flex items-center justify-center p-0 md:py-6 relative overflow-hidden">
      {/* Organic glow in the background for premium aesthetics */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-glow-organic rounded-full -z-10" />
      
      {/* Sleek, bezel-less mobile container */}
      <div className="w-full max-w-[430px] min-h-screen md:min-h-[850px] md:h-[850px] md:rounded-[36px] bg-[#FFFDEB] shadow-[0_25px_60px_-15px_rgba(9,20,19,0.5)] relative flex flex-col overflow-hidden border border-[#346739]/10">
        {children}
      </div>
    </div>
  );
}
