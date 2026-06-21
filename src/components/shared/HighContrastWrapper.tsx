import React from 'react';

export const HighContrastWrapper = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`!text-[#FFFFFF] [&_h1]:!text-[#FACC15] [&_h2]:!text-[#FACC15] [&_h3]:!text-[#FACC15] [&_h4]:!text-[#FACC15] [&_h5]:!text-[#FACC15] [&_h6]:!text-[#FACC15] [&_strong]:!text-[#FACC15] drop-shadow-[0_1px_1px_rgba(0,0,0,1)] [&_p]:!text-[#FFFFFF] ${className}`}>
    {children}
  </div>
);
