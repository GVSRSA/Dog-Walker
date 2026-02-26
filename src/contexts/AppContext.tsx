import React, { createContext, useContext } from 'react';

// Simple context for sharing minimal state between components
interface AppContextType {
  // You can add any shared state here if needed
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppContextValue = React.memo(AppProvider);
