import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import EmployeePred from './pages/employee/employeePred';
import Home from './pages/Home';
import Navbar from './components/Navbar';

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/employee/predict" element={<EmployeePred />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
