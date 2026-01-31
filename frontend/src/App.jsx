import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import SearchPage from './pages/Search';
import HistoryPage from './pages/History';
import LandingPage from './components/LandingPage';
import { Toaster } from './components/ui/sonner';
import CommandMenu from './components/CommandMenu';

function App() {
    // Show landing only if starting at root path
    const [showLanding, setShowLanding] = useState(() => {
        return window.location.pathname === '/';
    });
    const [appOpacity, setAppOpacity] = useState(showLanding ? 0 : 1);

    const handleLandingComplete = () => {
        setShowLanding(false);
        // Delay fade-in slightly to ensure landing is fully removed
        setTimeout(() => {
            setAppOpacity(1);
        }, 200);
    };

    return (
        <BrowserRouter>
            {/* Main App Content - Fades in after landing */}
            <motion.div
                className="relative z-0"
                animate={{ opacity: appOpacity }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Navigate to="/upload" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="upload" element={<UploadPage />} />
                        <Route path="search" element={<SearchPage />} />
                        <Route path="history" element={<HistoryPage />} />
                    </Route>
                </Routes>
            </motion.div>

            {/* Landing Page Overlay - Fixed on top */}
            {showLanding && (
                <LandingPage onComplete={handleLandingComplete} />
            )}
            <Toaster />
            <CommandMenu />
        </BrowserRouter>
    );
}

export default App;
