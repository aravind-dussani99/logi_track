
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface ModalState {
  title: string;
  content: React.ReactNode;
}

interface UIContextType {
  isModalOpen: boolean;
  modalContent: ModalState | null;
  openModal: (title: string, content: React.ReactNode) => void;
  closeModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const openModal = useCallback((title: string, content: React.ReactNode) => {
    setModalState({ title, content });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  const value = {
    isModalOpen: !!modalState,
    modalContent: modalState,
    openModal,
    closeModal,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
