import React from 'react';

interface SpotterLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const SpotterLogo: React.FC<SpotterLogoProps> = ({ size = 'md', animated = true }) => {
  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  // Animation classes
  const animationClass = animated ? 'animate-pulse-spotter' : '';

  return (
    <div className={`${sizeClasses[size]} relative ${animationClass} bg-[#E8EDF0] rounded-full flex items-center justify-center`}>
      {/* Red dot */}
      <div className={`absolute ${size === 'sm' ? 'w-2 h-2 top-2 left-1' : size === 'md' ? 'w-3 h-3 top-2 left-2' : 'w-4 h-4 top-3 left-2'} bg-[#FF3B4E] rounded-full ${animated ? 'animate-pulse' : ''}`}></div>
      
      {/* White dots */}
      <div className={`absolute ${size === 'sm' ? 'w-2 h-2 top-2 left-4' : size === 'md' ? 'w-2 h-2 top-3 left-5' : 'w-3 h-3 top-4 left-7'} bg-[#E8EDF0] border border-[#1A4D63] rounded-full`}></div>
      <div className={`absolute ${size === 'sm' ? 'w-2 h-2 top-2 left-6' : size === 'md' ? 'w-2 h-2 top-3 left-8' : 'w-3 h-3 top-4 left-11'} bg-[#E8EDF0] border border-[#1A4D63] rounded-full`}></div>
      
      {/* If large, add the text */}
      {size === 'lg' && (
        <div className="absolute bottom-0 transform translate-y-1/2 bg-[#0A2233] px-3 py-1 rounded-full">
          <span className="text-xs font-bold text-[#E8EDF0]">Spotter</span>
        </div>
      )}
    </div>
  );
};

export default SpotterLogo;