// Hustle Board — Animated Number Component
// Rolls numbers up on mount for satisfying visual feedback

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    prevValueRef.current = value;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * eased;
      setDisplay(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
