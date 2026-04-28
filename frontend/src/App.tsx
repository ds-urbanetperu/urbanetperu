import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenHome from './pages/CitizenHome';
import ReportPothole from './pages/ReportPothole';
import Processing from './pages/Processing';
import Confirmation from './pages/Confirmation';
import MyReports from './pages/MyReports';
import MunicipalDashboard from './pages/MunicipalDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        
        {/* Citizen Flow */}
        <Route path="/inicio" element={<CitizenHome />} />
        <Route path="/reportar-baches" element={<ReportPothole />} />
        <Route path="/procesando" element={<Processing />} />
        <Route path="/confirmacion" element={<Confirmation />} />
        <Route path="/mis-reportes" element={<MyReports />} />
        
        {/* Municipal Flow */}
        <Route path="/municipal" element={<MunicipalDashboard />} />
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
