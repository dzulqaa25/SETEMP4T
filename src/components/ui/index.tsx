'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn, getInitials } from '@/lib/utils';
import { X } from 'lucide-react';

export function Card({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card-elevated rounded-2xl transition-all duration-200',
        onClick &&
          'cursor-pointer hover:-translate-y-0.5 active:translate-y-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'px-4 sm:px-6 py-4 border-b border-stone-200/70',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      className={cn(
        'text-sm sm:text-base font-extrabold text-stone-900 tracking-tight',
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn('text-xs text-stone-500 mt-0.5 leading-relaxed', className)}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('p-4 sm:p-6', className)}>{children}</div>;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variantClasses = {
    primary: 'brown-shade-btn text-white active:scale-[0.98]',
    secondary:
      'bg-[#f5ebe1] hover:bg-[#ead8c7] text-[#4e2e1d] border border-[#d8be9f] font-semibold shadow-2xs',
    outline:
      'bg-white hover:bg-[#faf5ef] text-stone-700 border border-stone-200/90 shadow-2xs hover:border-[#b08968]',
    ghost:
      'bg-transparent hover:bg-stone-200/50 text-stone-600 hover:text-stone-900',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-sm',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold rounded-xl gap-2',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shrink-0',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  variant = 'neutral',
  className,
  children,
}: {
  variant?: 'ipb' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  className?: string;
  children: React.ReactNode;
}) {
  const styles = {
    ipb: 'bg-gradient-to-r from-[#f5ebe1] to-[#efe0d0] text-[#4e2e1d] border-[#d5b895] font-semibold shadow-2xs',
    success: 'bg-[#f4ebe1] text-[#5c3724] border-[#d6b899] font-semibold',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    info: 'bg-orange-50/80 text-[#7c4d34] border-orange-200/80 font-semibold',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200/80 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border whitespace-nowrap',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#6e422b] focus:outline-none focus:ring-3 focus:ring-[#6e422b]/15 transition-all',
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-[#6e422b] focus:outline-none focus:ring-3 focus:ring-[#6e422b]/15 transition-all',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#6e422b] focus:outline-none focus:ring-3 focus:ring-[#6e422b]/15 transition-all',
        className
      )}
      {...props}
    />
  );
}

const AVATAR_GRADIENTS = [
  'from-[#3b2216] via-[#5c3724] to-[#8b5a2b]',
  'from-[#4e2e1d] via-[#7c4d34] to-[#a46c44]',
  'from-[#5c3724] to-[#9c6644]',
  'from-[#2d180e] via-[#52301e] to-[#7d4c32]',
  'from-[#6e422b] via-[#8c583a] to-[#b07d56]',
];

export function AvatarInitials({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg',
  };

  const hash = (name || 'ST')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const gradient = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];

  return (
    <div
      className={cn(
        `rounded-full bg-gradient-to-br ${gradient} text-white font-extrabold flex items-center justify-center shrink-0 select-none shadow-sm shadow-amber-950/20`,
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-950/60 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'bg-white rounded-2xl border border-stone-200 shadow-2xl w-full overflow-hidden max-h-[90vh] flex flex-col animate-sheet',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200/70 bg-[#faf5ef]">
          <div className="pr-3">
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function ProgressBar({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div
      className={cn(
        'w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60',
        className
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-[#3b2216] via-[#6e422b] to-[#b07d56] rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
