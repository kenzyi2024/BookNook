import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { applyTheme, DEFAULT_THEME, THEMES } from '../lib/themes';

const ThemeContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

const KEY = 'booknook_theme';
const DARK_KEY = 'booknook_dark';
const HIDE_REFLECT_KEY = 'booknook_hide_reflect';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(KEY) || DEFAULT_THEME);
  const [dark, setDarkState] = useState(() => localStorage.getItem(DARK_KEY) === '1');
  const [hideReflections, setHideReflectionsState] = useState(() => localStorage.getItem(HIDE_REFLECT_KEY) === '1');

  useEffect(() => {
    applyTheme(theme, dark);
  }, [theme, dark]);

  const setTheme = useCallback((id) => {
    if (!THEMES[id]) return;
    localStorage.setItem(KEY, id);
    setThemeState(id);
  }, []);

  const toggleDark = useCallback(() => {
    setDarkState((d) => {
      const next = !d;
      localStorage.setItem(DARK_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const setHideReflections = useCallback((hide) => {
    localStorage.setItem(HIDE_REFLECT_KEY, hide ? '1' : '0');
    setHideReflectionsState(hide);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, dark, toggleDark, hideReflections, setHideReflections }}>
      {children}
    </ThemeContext.Provider>
  );
}
