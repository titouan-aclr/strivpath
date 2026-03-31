'use client';

import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TopoGlowSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function TopoGlowSection({ children, className }: TopoGlowSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    containerRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    containerRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty('--mouse-x', '-1000px');
    containerRef.current.style.setProperty('--mouse-y', '-1000px');
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('topo-glow-container', className)}
    >
      <div className="topo-base-layer" aria-hidden="true" />
      <div className="topo-glow-overlay" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
