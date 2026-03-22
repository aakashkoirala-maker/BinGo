import React, { createContext, useContext } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children, showToast }) => {
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useAdminToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAdminToast must be used within ToastProvider');
  }
  return context;
};
