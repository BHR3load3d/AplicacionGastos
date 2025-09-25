import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import ExpensesPage from '../pages/ExpensesPage';
import CategoriesPage from '../pages/CategoriesPage';
import FamiliesPage from '../pages/FamiliesPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/families" element={<FamiliesPage />} />
      <Route path="/members" element={<div>Members Page</div>} />
      <Route path="/reports" element={<div>Reports Page</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;