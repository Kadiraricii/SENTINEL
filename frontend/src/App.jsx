import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import SearchPage from './pages/Search';
import HistoryPage from './pages/History';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="upload" element={<UploadPage />} />
                    <Route path="search" element={<SearchPage />} />
                    <Route path="history" element={<HistoryPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
