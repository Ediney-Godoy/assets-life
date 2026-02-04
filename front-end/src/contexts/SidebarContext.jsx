import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('assetlife_sidebar_collapsed');
      if (stored !== null) return stored === '1';
      
      // Default behavior: collapse on small screens
      const w = window.innerWidth || 0;
      return w < 1024;
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('assetlife_sidebar_collapsed', next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  // Sync with window resize if needed, but the user prefers explicit toggle
  // We'll keep the initial detection in the initializer.

  return (
    <SidebarContext.Provider value={{ sidebarCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
