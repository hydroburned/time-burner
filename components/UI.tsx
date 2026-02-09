
import React from 'react';

// --- Card ---
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => {
  return (
    <div 
      className={`bg-zinc-900/40 border border-white/5 backdrop-blur-xl rounded-[3rem] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'secondary', 
  size = 'md', 
  className = '', 
  children, 
  icon,
  ...props 
}) => {
  // Base: gap-3 (12px), rounded-[1.5rem] (12px radius visual)
  // type-label (12px) used for buttons generally, or type-body for larger ones
  const baseStyle = "type-label tracking-normal rounded-[1.5rem] transition-all flex items-center justify-center gap-3 active:scale-95 border";
  
  const variants = {
    primary: "bg-white text-black border-white hover:bg-cyan-400 hover:border-cyan-400 shadow-[0_4px_20px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-zinc-900 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800 hover:border-white/20",
    ghost: "bg-transparent text-zinc-500 border-transparent hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50",
    icon: "bg-zinc-900 border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white"
  };

  // SCALED SIZES FOR 8px REM to achieve standard pixels
  // sm: 32px height -> h-16
  // md: 40px height -> h-20 
  // lg: 48px height -> h-24
  // icon: 40px square -> w-20 h-20
  const sizes = {
    sm: "px-4 h-16",
    md: "px-6 h-20", 
    lg: "px-8 h-24",
    icon: "p-0 w-20 h-20"
  };

  // Clone icon to enforce size: 20px (2.5rem -> w-10)
  const iconElement = React.isValidElement(icon) 
    ? React.cloneElement(icon as React.ReactElement, { 
        // @ts-ignore
        className: `w-10 h-10 ${icon.props.className || ''}` 
      }) 
    : null;

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {iconElement}
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="space-y-2 w-full"> 
      {label && <label className="type-label text-zinc-500 ml-2">{label}</label>}
      <input 
        // h-20 = 40px height
        // px-8 = 16px padding (16px = 2rem = 8 * 2)
        // type-h3 (20px) for input text
        className={`w-full bg-zinc-950/50 border border-white/10 rounded-[1.5rem] px-8 h-20 type-h3 font-medium text-white focus:outline-none focus:border-cyan-500/50 focus:bg-zinc-900 transition-all placeholder-white/10 ${className}`}
        {...props}
      />
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'bg-zinc-800 text-zinc-500' }) => (
  <span className={`type-caption px-3 py-1 rounded-full border border-white/5 ${color}`}>
    {children}
  </span>
);
