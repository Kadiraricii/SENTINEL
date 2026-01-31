import React, { useEffect, useRef, useState } from 'react';
import { cn } from "../../lib/utils";

// Helper for random colors
const randomColors = (count) => {
    return new Array(count)
        .fill(0)
        .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
};

export function TubesBackground({
    children,
    className,
    enableClickInteraction = true,
    sidebarOffset = 0
}) {
    const canvasRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const tubesRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        let cleanup;

        const initTubes = async () => {
            if (!canvasRef.current) return;

            try {
                // Load the threejs-components tubes effect from CDN
                const module = await import(
                    /* @vite-ignore */
                    'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js'
                );
                const TubesCursor = module.default;

                if (!mounted) return;

                const app = TubesCursor(canvasRef.current, {
                    tubes: {
                        colors: ["#f967fb", "#53bc28", "#6958d5"],
                        lights: {
                            intensity: 200,
                            colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
                        }
                    }
                });

                tubesRef.current = app;
                setIsLoaded(true);

                cleanup = () => {
                    // Cleanup if needed
                };

            } catch (error) {
                console.error("Failed to load TubesCursor:", error);
            }
        };

        initTubes();

        return () => {
            mounted = false;
            if (cleanup) cleanup();
        };
    }, []);

    const handleClick = () => {
        if (!enableClickInteraction || !tubesRef.current) return;

        const colors = randomColors(3);
        const lightsColors = randomColors(4);

        tubesRef.current.tubes.setColors(colors);
        tubesRef.current.tubes.setLightsColors(lightsColors);
    };

    return (
        <div
            className={cn("fixed inset-0 w-full h-full bg-black select-none overflow-auto z-0", className)}
            style={{ left: `${sidebarOffset}px` }}
            onClick={handleClick}
        >
            <canvas
                ref={canvasRef}
                className="fixed inset-0 block pointer-events-none z-0"
                style={{
                    touchAction: 'none',
                    left: `${sidebarOffset}px`,
                    width: `calc(100% - ${sidebarOffset}px)`
                }}
            />

            {/* Content Overlay */}
            <div className="relative z-10 w-full min-h-full pointer-events-none">
                {children}
            </div>
        </div>
    );
}

export default TubesBackground;
