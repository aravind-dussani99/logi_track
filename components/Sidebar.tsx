import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const isSupervisor = currentUser?.role === Role.SUPERVISOR;
  
  const allNavItems = [
    // Core Operations
    { to: '/dashboard', icon: isSupervisor ? 'enter-outline' : 'speedometer-outline', name: isSupervisor ? 'Enter Trips' : 'Dashboard', roles: [Role.ADMIN, Role.MANAGER, Role.DRIVER, Role.SUPERVISOR] },
    { to: '/received', icon: 'checkbox-outline', name: 'Received Trips', roles: [Role.SUPERVISOR, Role.ADMIN, Role.MANAGER] },
    { to: '/advances', icon: 'document-attach-outline', name: 'Advances', roles: [Role.SUPERVISOR, Role.ADMIN, Role.MANAGER] },
    { to: '/daily-expenses', icon: 'wallet-outline', name: 'Daily Expenses', roles: [Role.SUPERVISOR, Role.ADMIN, Role.MANAGER] },
    { to: '/trips', icon: 'bus-outline', name: 'Daily Trips', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/accounting', icon: 'calculator-outline', name: 'Accounting', roles: [Role.ADMIN, Role.MANAGER] },
    
    // Financials
    { to: '/financials', icon: 'analytics-outline', name: 'Financials', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/ledger', icon: 'book-outline', name: 'Main Ledger', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/capital', icon: 'wallet-outline', name: 'Capital & Loans', roles: [Role.ADMIN, Role.MANAGER] },
    
    // Inventory & Reporting
    { to: '/royalty-stock', icon: 'layers-outline', name: 'Royalty Stock', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/reports', icon: 'document-text-outline', name: 'Reports', roles: [Role.SUPERVISOR, Role.ADMIN, Role.MANAGER] },
    
    // Master Data Management
    { to: '/customers', icon: 'people-circle-outline', name: 'Customers', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/quarries', icon: 'server-outline', name: 'Quarries', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/transport', icon: 'boat-outline', name: 'Transport', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/royalty', icon: 'document-text-outline', name: 'Royalty', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/accounts', icon: 'card-outline', name: 'Accounts', roles: [Role.ADMIN, Role.MANAGER] },
    { to: '/categories', icon: 'copy-outline', name: 'Categories', roles: [Role.ADMIN, Role.MANAGER] },
    
    // System
    { to: '/users', icon: 'people-outline', name: 'Users', roles: [Role.ADMIN] },
  ];

  const navItems = allNavItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  const NavItem: React.FC<{ to: string; icon: string; name: string; }> = ({ to, icon, name }) => {
    return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-2 mt-5 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-primary text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`
      }
      onClick={() => setSidebarOpen(false)}
    >
      <ion-icon name={icon} className="text-2xl"></ion-icon>
      <span className="mx-4 font-medium">{name}</span>
    </NavLink>
  );
    }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center">
            <ion-icon name="server-outline" className="text-3xl text-primary"></ion-icon>
            <span className="text-gray-800 dark:text-white text-2xl mx-2 font-semibold">LogiTrack</span>
          </div>
        </div>
        <nav className="flex-grow mt-10 px-2">
          {navItems.map(item => <NavItem key={item.name} {...item} />)}
        </nav>
        <div className="px-4 pb-4">
           <button
              onClick={logout}
              className="w-full flex items-center px-4 py-2 mt-5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-700/50 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
            >
              <ion-icon name="log-out-outline" className="text-2xl"></ion-icon>
              <span className="mx-4 font-medium">Logout</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;