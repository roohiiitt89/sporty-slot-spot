
import { createContext, useContext, ReactNode } from 'react';

interface DarkThemeContextType {
  isDarkMode: boolean;
}

const DarkThemeContext = createContext<DarkThemeContextType>({
  isDarkMode: true
});

export const useDarkTheme = () => useContext(DarkThemeContext);

export const DarkThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <DarkThemeContext.Provider value={{ isDarkMode: true }}>
      <div className="bg-gray-900 text-white min-h-screen">
        {children}
      </div>
    </DarkThemeContext.Provider>
  );
};
