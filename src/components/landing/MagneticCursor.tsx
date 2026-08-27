'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

export function MagneticCursor() {
  const prefersReducedMotion = useReducedMotion();
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const trailX = useMotionValue(-100);
  const trailY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300 };
  const trailConfig = { damping: 40, stiffness: 150 };

  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const trailXSpring = useSpring(trailX, trailConfig);
  const trailYSpring = useSpring(trailY, trailConfig);

  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 8);
      cursorY.set(e.clientY - 8);
      trailX.set(e.clientX - 20);
      trailY.set(e.clientY - 20);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // Magnetic effect on interactive elements
    const attachListeners = () => {
      const magneticEls = document.querySelectorAll(
        'button, a, [data-magnetic], [data-cursor-text]'
      );

      magneticEls.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          setIsHovering(true);
          const text = el.getAttribute('data-cursor-text');
          if (text) setCursorText(text);
        });
        el.addEventListener('mouseleave', () => {
          setIsHovering(false);
          setCursorText('');
        });
      });
    };

    attachListeners();
    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cursorX, cursorY, trailX, trailY]);

  if (!mounted || prefersReducedMotion) return null;

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        style={{ x: cursorXSpring, y: cursorYSpring }}
        animate={{
          scale: isClicking ? 0.8 : isHovering ? 0 : 1,
          opacity: 1,
        }}
        className="fixed top-0 left-0 w-4 h-4 rounded-full bg-white z-[9999] pointer-events-none mix-blend-difference"
      />

      {/* Trailing ring */}
      <motion.div
        style={{ x: trailXSpring, y: trailYSpring }}
        animate={{
          scale: isClicking ? 0.8 : isHovering ? 2.5 : 1,
          opacity: isHovering ? 0.8 : 0.4,
          borderColor: isHovering ? '#06B6D4' : 'rgba(255,255,255,0.7)',
        }}
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-white z-[9998] pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.3)]"
      />

      {/* Cursor text label */}
      {cursorText && (
        <motion.div
          style={{ x: trailXSpring, y: trailYSpring }}
          className="fixed top-0 left-0 z-[9997] pointer-events-none"
        >
          <div className="-translate-x-1/2 -translate-y-1/2 translate-x-8 translate-y-8">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="block bg-white text-slate-950 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg border border-white/20"
            >
              {cursorText}
            </motion.span>
          </div>
        </motion.div>
      )}
    </>
  );
}
