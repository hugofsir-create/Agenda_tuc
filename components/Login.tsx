import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  darkMode: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, darkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Get users from localStorage
    const savedUsers = localStorage.getItem('logicon_users');
    let users: User[] = [];
    
    if (savedUsers) {
      try {
        users = JSON.parse(savedUsers);
      } catch (err) {
        console.error('Error parsing users', err);
      }
    }

    // Ensure default admin exists if no users or if admin is missing
    if (users.length === 0 || !users.find(u => u.username.toLowerCase() === 'admin')) {
      const defaultAdmin: User = {
        id: 'admin-1',
        username: 'admin',
        password: '1234',
        role: 'admin',
        name: 'Administrador Sistema'
      };
      // Only add if not already there (though we checked length/find)
      if (!users.find(u => u.username.toLowerCase() === 'admin')) {
        users = [defaultAdmin, ...users];
        localStorage.setItem('logicon_users', JSON.stringify(users));
      }
    }

    const user = users.find(u => u.username.toLowerCase() === trimmedUsername && u.password === trimmedPassword);

    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales incorrectas. Intente con admin / 1234');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-[#0f1110]' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white mb-4 shadow-lg shadow-emerald-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 17h4V2H10v15z"/><path d="M22 17v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/>
            </svg>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-emerald-500">Logi</span>Track Pro
          </h1>
          <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Gestión Logística • Tucumán
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Usuario
            </label>
            <input
              type="text"
              required
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Contraseña
            </label>
            <input
              type="password"
              required
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
              placeholder="••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-dashed border-slate-800 text-center space-y-4">
          <p className={`text-[10px] uppercase font-bold tracking-widest ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}>
            Acceso Restringido • Personal Autorizado
          </p>
          <button 
            type="button"
            onClick={() => {
              if (window.confirm('¿Restablecer sistema? Esto borrará todos los usuarios y contactos locales.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-[9px] uppercase font-bold tracking-widest text-slate-600 hover:text-emerald-500 transition-colors"
          >
            Restablecer Sistema
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
