import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import NotificationsPanel from './NotificationsPanel';
import EditProfileForm from './EditProfileForm';
import HelpGuide from './HelpGuide';


interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { currentUser } = useAuth();
  const { openModal, closeModal } = useUI();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleEditProfile = () => {
    setProfileOpen(false);
    if(currentUser) {
      openModal('Edit Profile', <EditProfileForm user={currentUser} onClose={closeModal} />);
    }
  };

  const handleShowHelp = () => {
    setProfileOpen(false);
    openModal('How to Use LogiTrack', <HelpGuide />);
  };

  return (
    <header className="flex justify-between items-center py-4 px-6 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-300 focus:outline-none lg:hidden">
            <ion-icon name="menu-outline" className="text-2xl"></ion-icon>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <NotificationsPanel />
        <div className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} className="relative flex items-center space-x-2 focus:outline-none">
            <img className="h-8 w-8 rounded-full object-cover" src={currentUser?.avatar} alt="Your avatar" />
            <div className="hidden md:block text-left">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{currentUser?.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.role}</div>
            </div>
          </button>
          
          {profileOpen && (
              <div onMouseLeave={() => setProfileOpen(false)} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md overflow-hidden shadow-xl z-10">
                  <ul>
                    <li>
                      <button onClick={handleEditProfile} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                        Edit Profile
                      </button>
                    </li>
                    <li>
                      <button onClick={handleShowHelp} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                        How to Use
                      </button>
                    </li>
                  </ul>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;