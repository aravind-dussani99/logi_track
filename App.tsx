import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyTrips from './pages/DailyTrips';
import Accounting from './pages/Accounting';
import Royalty from './pages/Royalty';
import Customers from './pages/Customers';
import Quarries from './pages/Quarries';
import Transport from './pages/Transport';
import Login from './pages/Login';
import Users from './pages/Users';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Role } from './types';
import Financials from './pages/Financials';
import { DataProvider } from './contexts/DataContext';
import { UIProvider } from './contexts/UIContext';
import Ledger from './pages/Ledger';
import RoyaltyStock from './pages/RoyaltyStock';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import Capital from './pages/Capital';
import DailyExpenses from './pages/DailyExpenses';
import ReceivedTrips from './pages/ReceivedTrips';
import Advances from './pages/Advances';
import Reports from './pages/Reports';

const ProtectedLayout: React.FC = () => (
  <ProtectedRoute roles={[Role.ADMIN, Role.MANAGER, Role.DRIVER, Role.SUPERVISOR]}>
    <Layout>
      <Outlet />
    </Layout>
  </ProtectedRoute>
);

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    
    <Route element={<ProtectedLayout />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/financials" element={<Financials />} />
      <Route path="/trips" element={
        <ProtectedRoute roles={[Role.ADMIN, Role.MANAGER]}>
            <DailyTrips />
        </ProtectedRoute>
       } />
      <Route path="/received" element={
        <ProtectedRoute roles={[Role.SUPERVISOR, Role.ADMIN, Role.MANAGER]}>
          <ReceivedTrips />
        </ProtectedRoute>
      } />
      <Route path="/advances" element={
        <ProtectedRoute roles={[Role.SUPERVISOR, Role.ADMIN, Role.MANAGER]}>
          <Advances />
        </ProtectedRoute>
      } />
       <Route path="/reports" element={
        <ProtectedRoute roles={[Role.SUPERVISOR, Role.ADMIN, Role.MANAGER]}>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/accounting" element={<Accounting />} />
      <Route path="/ledger" element={<Ledger />} />
      <Route path="/capital" element={<Capital />} />
      <Route path="/royalty" element={<Royalty />} />
      <Route path="/royalty-stock" element={<RoyaltyStock />} />
      <Route path="/daily-expenses" element={
        <ProtectedRoute roles={[Role.SUPERVISOR, Role.ADMIN, Role.MANAGER]}>
          <DailyExpenses />
        </ProtectedRoute>
      } />
      <Route path="/customers" element={<ProtectedRoute roles={[Role.ADMIN, Role.MANAGER]}><Customers /></ProtectedRoute>} />
      <Route path="/quarries" element={<ProtectedRoute roles={[Role.ADMIN, Role.MANAGER]}><Quarries /></ProtectedRoute>} />
      <Route path="/transport" element={<ProtectedRoute roles={[Role.ADMIN, Role.MANAGER]}><Transport /></ProtectedRoute>} />
      <Route path="/accounts" element={<ProtectedRoute roles={[Role.ADMIN, Role.MANAGER]}><Accounts /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute roles={[Role.ADMIN, Role.MANAGER]}><Categories /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={[Role.ADMIN]}><Users /></ProtectedRoute>} />
    </Route>
  </Routes>
);


const App: React.FC = () => (
  <UIProvider>
    <HashRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  </UIProvider>
);

export default App;