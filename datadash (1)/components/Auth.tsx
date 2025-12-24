import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { Lock, Mail, User, AlertCircle, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

interface AuthProps {
  language: Language;
}

export const Auth: React.FC<AuthProps> = ({ language }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const t = translations[language].auth;

  // 1. Developer Alert: If key is missing in code
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md w-full bg-slate-800 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6">
              <AlertTriangle className="w-8 h-8" />
           </div>
           <h2 className="text-xl font-bold text-white mb-2">Configuração Pendente</h2>
           <p className="text-slate-400 mb-4 text-sm">
             O desenvolvedor ainda não configurou a chave de API no código fonte.
           </p>
           <div className="bg-slate-950 p-4 rounded text-left text-xs font-mono text-slate-300 border border-slate-700">
             Abra <code>services/supabaseClient.ts</code> e substitua <br/>
             <code>'COLE_SUA_CHAVE_ANON_PUBLIC_AQUI'</code> <br/>
             pela sua chave real do Supabase.
           </div>
        </div>
      </div>
    );
  }

  // 2. Normal Auth Flow
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        setMessage(t.magicLinkSent);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message;
      if (msg === "Failed to fetch") msg = "Erro de conexão. Verifique sua internet.";
      if (msg === "Invalid login credentials") msg = "E-mail ou senha incorretos.";
      setError(msg || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 mb-6 shadow-lg shadow-blue-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {isSignUp ? t.signupTitle : t.loginTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            DataDash Analytics Platform
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-xl">
          <form className="space-y-6" onSubmit={handleAuth}>
            
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-3 text-emerald-400 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.nameLabel}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.emailLabel}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.passwordLabel}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/30"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? t.signupBtn : t.loginBtn}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isSignUp ? t.switchToLogin : t.switchToSignup}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
