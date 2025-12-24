import React, { useState, useCallback, useEffect } from 'react';
import { Upload, BarChart3, Database, FileText, X, Github, LayoutDashboard, ShieldAlert, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { DataSet, Language, TableCollection } from './types';
import { processFile } from './services/dataProcessor';
import { Dashboard } from './components/Dashboard';
import { QualityReport } from './components/QualityReport';
import { DataModeling } from './components/DataModeling';
import { translations } from './utils/translations';
import { Auth } from './components/Auth';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

enum View {
  HOME = 'HOME',
  MODELING = 'MODELING',
  DASHBOARD = 'DASHBOARD',
  QUALITY = 'QUALITY'
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>(View.HOME);
  
  // New State for Multi-table
  const [rawTables, setRawTables] = useState<TableCollection | null>(null);
  
  // The final unified dataset used by dashboard
  const [dataset, setDataset] = useState<DataSet | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('pt');

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const t = translations[language];

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Process File Locally (Get all tables)
      const tables = await processFile(file);
      setRawTables(tables);

      // 2. Go to Modeling Screen
      setView(View.MODELING);

    } catch (err: any) {
      console.error(err);
      setError(t.hero.error);
    } finally {
      setLoading(false);
    }
  }, [t.hero.error]);

  const handleModelComplete = async (unifiedDataset: DataSet) => {
      // Save metadata of the generated model/result (simplified for now)
      if (session?.user) {
        const { error: dbError } = await supabase
          .from('datasets')
          .insert({
            user_id: session.user.id,
            filename: unifiedDataset.fileName, // will be 'Model: ...'
            file_size: 0, // calculated from raw file, strictly this is virtual
            row_count: unifiedDataset.rowCount,
            column_count: unifiedDataset.columns.length,
            status: 'modeled',
            storage_path: null
          });

        if (dbError) {
          console.error("Supabase Metadata Error:", dbError);
        }
      }

      setDataset(unifiedDataset);
      setView(View.DASHBOARD);
  };

  const resetAnalysis = () => {
    setDataset(null);
    setRawTables(null);
    setView(View.HOME);
    setError(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetAnalysis();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'pt' : 'en');
  };

  // If not authenticated, show Auth Screen
  if (!session) {
    return <Auth language={language} />;
  }

  // Authenticated App
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => dataset ? setView(View.DASHBOARD) : setView(View.HOME)}>
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              {t.appTitle}
            </span>
          </div>

          {dataset && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <NavBtn active={view === View.DASHBOARD} onClick={() => setView(View.DASHBOARD)} icon={<LayoutDashboard size={16}/>} label={t.nav.dashboard} />
              <NavBtn active={view === View.QUALITY} onClick={() => setView(View.QUALITY)} icon={<ShieldAlert size={16}/>} label={t.nav.quality} />
              <NavBtn active={view === View.MODELING} onClick={() => setView(View.MODELING)} icon={<Database size={16}/>} label="Model" />
            </nav>
          )}

          <div className="flex items-center gap-4">
             {/* Language Toggle */}
             <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-all text-sm font-medium"
             >
                <Globe size={14} className="text-blue-400" />
                <span className="uppercase">{language}</span>
             </button>

             {(dataset || rawTables) && (
                 <button 
                    onClick={resetAnalysis}
                    className="text-sm text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                    title={t.nav.reset}
                 >
                    <X size={16} /> 
                 </button>
             )}
             
             {/* User / Logout */}
             <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                 <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs text-slate-400">Signed in as</span>
                    <span className="text-sm font-medium text-white truncate max-w-[150px]">
                      {session.user.user_metadata.full_name || session.user.email}
                    </span>
                 </div>
                 <button 
                    onClick={handleLogout}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors"
                    title={t.nav.logout}
                 >
                    <LogOut size={18} />
                 </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        {/* View: Home / Upload */}
        {view === View.HOME && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in-up">
             <div className="space-y-4 max-w-2xl">
                 <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                    {t.hero.titleStart} <span className="text-blue-500">{t.hero.titleEnd}</span>
                 </h1>
                 <p className="text-lg text-slate-400">
                    {t.hero.subtitle}
                 </p>
             </div>

             <div className="w-full max-w-md">
                 <label 
                    className={`
                        relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                        ${loading ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-400'}
                    `}
                 >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {loading ? (
                             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                        ) : (
                             <Upload className="w-12 h-12 text-slate-400 mb-4" />
                        )}
                        <p className="mb-2 text-sm text-slate-300">
                            {loading ? t.hero.loading : <span className="font-semibold">{t.hero.clickUpload}</span>}
                        </p>
                        <p className="text-xs text-slate-500">{t.hero.dragDrop}</p>
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={handleFileUpload}
                        disabled={loading}
                    />
                 </label>
                 {error && (
                     <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                         <ShieldAlert size={16} />
                         {error}
                     </div>
                 )}
             </div>

             {/* Features Grid */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12 text-left">
                 <FeatureCard icon={<Database className="text-blue-400"/>} title={t.features.smartTitle} desc={t.features.smartDesc} />
                 <FeatureCard icon={<BarChart3 className="text-emerald-400"/>} title={t.features.chartsTitle} desc={t.features.chartsDesc} />
                 <FeatureCard icon={<FileText className="text-purple-400"/>} title={t.features.privacyTitle} desc={t.features.privacyDesc} />
             </div>
          </div>
        )}

        {/* View: Modeling */}
        {rawTables && view === View.MODELING && (
          <DataModeling 
            tables={rawTables} 
            language={language} 
            onModelComplete={handleModelComplete} 
          />
        )}

        {/* View: Dashboard */}
        {dataset && view === View.DASHBOARD && (
            <Dashboard dataset={dataset} language={language} />
        )}

        {/* View: Quality */}
        {dataset && view === View.QUALITY && (
            <QualityReport dataset={dataset} language={language} />
        )}

      </main>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
            ${active ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}
        `}
    >
        {icon}
        {label}
    </button>
);

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-6 bg-slate-800/30 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
        <div className="mb-4 bg-slate-900 w-fit p-3 rounded-lg border border-slate-800">{icon}</div>
        <h3 className="font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
);

export default App;