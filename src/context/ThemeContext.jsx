import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { applyTheme, DEFAULT_THEME, THEMES } from '../lib/themes';

const ThemeContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

const KEY = 'booknook_theme';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(KEY) || DEFAULT_THEME);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id) => {
    if (!THEMES[id]) return;
    localStorage.setItem(KEY, id);
    setThemeState(id);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
