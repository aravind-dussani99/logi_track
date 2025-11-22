import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Modal from './Modal';
import { useUI } from '../contexts/UIContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isModalOpen, modalContent, closeModal } = useUI();

  return (
    <div className="flex h-screen bg-light dark:bg-dark text-gray-800 dark:text-gray-200">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light dark:bg-dark">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      
      {modalContent && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          title={modalContent.title}>
            {modalContent.content}
        </Modal>
      )}
    </div>
  );
};

export default Layout;