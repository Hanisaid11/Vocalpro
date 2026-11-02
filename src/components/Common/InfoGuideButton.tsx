import React from 'react';
import { haptics } from '../../utils/haptics';

interface InfoGuideButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InfoGuideButton: React.FC<InfoGuideButtonProps> = ({
  onClick,
  title = 'معلومات وتفاصيل فسيولوجية',
  size = 'md',
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.tap();
    onClick(e);
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-[11px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`relative inline-flex items-center justify-center rounded-full bg-slate-900/90 hover:bg-cyan-950 border border-slate-700/80 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 shadow-sm hover:shadow-[0_0_10px_rgba(34,211,238,0.25)] transition-all duration-200 active:scale-90 cursor-pointer shrink-0 font-serif font-black italic select-none ${sizeClasses[size]} ${className}`}
      title={title}
      aria-label={title}
    >
      <span className="leading-none select-none">i</span>
    </button>
  );
};
