import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { SparklesCore } from './ui/sparkles';
import { ChevronDown } from 'lucide-react';

function LandingPage({ onComplete }) {
    const [isExiting, setIsExiting] = useState(false);
    const scrollProgress = useMotionValue(0);
    const y = useTransform(scrollProgress, [0, 1], ['0%', '-100%']);

    const scrollAccumulator = useRef(0);
    const touchStartY = useRef(0);
    const isAnimating = useRef(false);

    useEffect(() => {
        const SCROLL_DISTANCE = 150; // Total scroll needed
        const SNAP_THRESHOLD = 0.5; // 50% to commit

        const handleWheel = (e) => {
            if (isExiting || isAnimating.current) return;

            // Accumulate scroll
            scrollAccumulator.current += e.deltaY;
            scrollAccumulator.current = Math.max(0, Math.min(scrollAccumulator.current, SCROLL_DISTANCE * 1.5));

            // Update progress (0 to 1)
            const progress = scrollAccumulator.current / SCROLL_DISTANCE;
            scrollProgress.set(Math.min(progress, 1));
        };

        const handleWheelEnd = () => {
            if (isExiting || isAnimating.current) return;

            const currentProgress = scrollProgress.get();

            if (currentProgress >= SNAP_THRESHOLD) {
                // Snap to complete
                isAnimating.current = true;
                animate(scrollProgress, 1, {
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1]
                }).then(() => {
                    setIsExiting(true);
                    setTimeout(onComplete, 600);
                });
            } else if (currentProgress > 0) {
                // Snap back
                isAnimating.current = true;
                animate(scrollProgress, 0, {
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1]
                }).then(() => {
                    scrollAccumulator.current = 0;
                    isAnimating.current = false;
                });
            }
        };

        // Debounce wheel end detection
        let wheelTimeout;
        const handleWheelWithDebounce = (e) => {
            handleWheel(e);
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(handleWheelEnd, 150);
        };

        const handleTouchStart = (e) => {
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            if (isExiting || isAnimating.current) return;

            const currentY = e.touches[0].clientY;
            const diff = touchStartY.current - currentY;

            // Update progress based on drag
            const progress = Math.max(0, Math.min(diff / SCROLL_DISTANCE, 1));
            scrollProgress.set(progress);
        };

        const handleTouchEnd = () => {
            handleWheelEnd(); // Same snap logic
        };

        window.addEventListener('wheel', handleWheelWithDebounce, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            clearTimeout(wheelTimeout);
            window.removeEventListener('wheel', handleWheelWithDebounce);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isExiting, onComplete, scrollProgress]);

    return (
        <motion.div
            style={{
                y,
                willChange: 'transform'
            }}
            className="h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden fixed inset-0 z-[100]"
        >
            {/* Sparkles Background */}
            <div className="w-full absolute inset-0 h-screen">
                <SparklesCore
                    id="tsparticlesfullpage"
                    background="transparent"
                    minSize={0.6}
                    maxSize={1.4}
                    particleDensity={100}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                    speed={1}
                />
            </div>

            {/* Content */}
            <div className="relative z-20 flex flex-col items-center justify-center gap-6 px-4">
                {/* Main Title - Solid White */}
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-extrabold text-center text-white drop-shadow-[0_0_80px_rgba(255,255,255,0.3)] tracking-tighter">
                    SENTINEL
                </h1>

                {/* Subtitle - Detailed Acronym */}
                <p className="text-gray-400 text-sm md:text-base lg:text-lg font-mono text-center max-w-4xl tracking-wide uppercase">
                    Sentinel Extraction Network Technology Intelligence Node Engine Logic
                </p>
            </div>

            {/* Scroll Indicator - Bottom Center (Responsive) */}
            {!isExiting && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 10, 0] }}
                    transition={{ delay: 1, duration: 2, repeat: Infinity }}
                    className="absolute bottom-6 md:bottom-8 lg:bottom-12 left-0 right-0 flex flex-col items-center gap-1.5 md:gap-2 lg:gap-3 text-white z-30"
                >
                    <span className="text-[10px] md:text-xs lg:text-sm uppercase tracking-[0.2em] md:tracking-[0.25em] font-medium">
                        Scroll to Enter
                    </span>
                    <ChevronDown size={20} className="animate-bounce md:w-6 md:h-6 lg:w-7 lg:h-7" />
                </motion.div>
            )}

            {/* Gradient Overlay for Fade Out Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none opacity-50" />
        </motion.div>
    );
}

export default LandingPage;
