import { useState, useRef, useEffect } from 'react';
import { Plus, Library, BarChart2, LogOut, KeyRound, Settings, Moon, Sun } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import AccountModal from '../auth/AccountModal';
import { useTheme } from '../../context/ThemeContext';

/**
 * Top navigation: logo, view switcher, add-book, and a simple user menu
 * (avatar initial + email + logout).
 */
export default function Navbar({ activeTab, onTab, onAdd, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const { dark, toggleDark } = useTheme();
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const label = user?.username || user?.email || 'Account';
  const initial = (user?.username || user?.email || '?').charAt(0).toUpperCase();

  const tabs = [
    { id: 'library', label: 'Library', icon: <Library size={16} /> },
    { id: 'metrics', label: 'Metrics', icon: <BarChart2 size={16} /> },
  ];

  return (
    <>
    <nav className="bg-paper/85 backdrop-blur-md border-b border-brand-900/10 sticky top-0 z-[60]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        <button
          onClick={() => onTab('library')}
          className="flex items-center shrink-0 transition-transform hover:scale-[1.03] origin-left"
          aria-label="Go to library"
        >
          <img src={logoImg} alt="BookNook" className="h-16 md:h-20 w-auto object-contain" />
        </button>

        <div className="flex items-center gap-1 bg-brand-50 p-1.5 rounded-full border border-brand-900/5 shadow-inner">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  active ? 'bg-surface shadow-sm text-brand-600' : 'text-stone-500 hover:text-brand-600'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onAdd}
            className="bg-brand-500 hover:bg-brand-600 text-white p-2.5 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden md:inline text-sm">Add Book</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center hover:opacity-90 transition-opacity overflow-hidden"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-stone-200 rounded-2xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 z-50">
                <div className="px-3 py-2 border-b border-stone-100 mb-1">
                  <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Signed in as</p>
                  <p className="text-sm font-medium text-ink truncate">{label}</p>
                </div>
                <button
                  onClick={toggleDark}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                  role="switch"
                  aria-checked={dark}
                >
                  <span className="flex items-center gap-2">
                    {dark ? <Sun size={16} /> : <Moon size={16} />} Dark mode
                  </span>
                  <span className={`relative w-9 h-5 rounded-full transition-colors ${dark ? 'bg-brand-500' : 'bg-stone-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${dark ? 'left-4' : 'left-0.5'}`} />
                  </span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowAccount(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Settings size={16} /> Account & appearance
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowChangePassword(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <KeyRound size={16} /> Change password
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-status-dnf hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>

    {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    {showAccount && <AccountModal onClose={() => setShowAccount(false)} />}
    </>
  );
}
