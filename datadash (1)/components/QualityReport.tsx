import React from 'react';
import { DataSet, ColumnType, Language } from '../types';
import { translations } from '../utils/translations';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface QualityReportProps {
  dataset: DataSet;
  language: Language;
}

export const QualityReport: React.FC<QualityReportProps> = ({ dataset, language }) => {
  const t = translations[language];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-800/50">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-full">
                <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">{t.quality.title}</h2>
                <p className="text-indigo-200">{t.quality.subtitle(dataset.rowCount.toLocaleString(), dataset.columns.length)}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {dataset.columns.map((col) => (
             <div key={col.name} className="bg-slate-800 rounded-xl border border-slate-700 p-5 flex flex-col gap-3 hover:border-slate-600 transition-colors shadow-lg">
                 <div className="flex justify-between items-start">
                     <div>
                        <h3 className="font-bold text-slate-100 truncate w-40" title={col.name}>{col.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            col.type === ColumnType.NUMBER ? 'bg-blue-500/20 text-blue-300' :
                            col.type === ColumnType.DATE ? 'bg-purple-500/20 text-purple-300' :
                            'bg-slate-600/20 text-slate-300'
                        }`}>
                            {col.type}
                        </span>
                     </div>
                     <div className="text-right">
                         <span className="text-xs text-slate-500 block">{t.quality.unique}</span>
                         <span className="font-mono text-sm">{col.uniqueCount.toLocaleString()}</span>
                     </div>
                 </div>

                 {/* Null Bar */}
                 <div className="space-y-1">
                     <div className="flex justify-between text-xs">
                         <span className="text-slate-400">{t.quality.completeness}</span>
                         <span className={col.nullCount > 0 ? "text-orange-400" : "text-emerald-400"}>
                            {((1 - (col.nullCount / dataset.rowCount)) * 100).toFixed(1)}%
                         </span>
                     </div>
                     <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                         <div 
                            className={`h-full ${col.nullCount === 0 ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                            style={{ width: `${(1 - (col.nullCount / dataset.rowCount)) * 100}%` }}
                         />
                     </div>
                 </div>

                 {/* Stats */}
                 <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-3 border-t border-slate-700/50">
                     {col.type === ColumnType.NUMBER && (
                         <>
                             <div>
                                 <span className="text-slate-500 block">{t.quality.min}</span>
                                 <span className="text-slate-300 font-mono">{String(col.min ?? '-')}</span>
                             </div>
                             <div>
                                 <span className="text-slate-500 block">{t.quality.max}</span>
                                 <span className="text-slate-300 font-mono">{String(col.max ?? '-')}</span>
                             </div>
                             <div className="col-span-2">
                                 <span className="text-slate-500 block">{t.quality.average}</span>
                                 <span className="text-slate-300 font-mono">{col.mean?.toFixed(2) ?? '-'}</span>
                             </div>
                         </>
                     )}
                     {col.type === ColumnType.STRING && (
                        <div className="col-span-2">
                            <span className="text-slate-500 block">{t.quality.examples}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {col.exampleValues.slice(0,3).map((v, i) => (
                                    <span key={i} className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 truncate max-w-[100px] border border-slate-700">
                                        {String(v)}
                                    </span>
                                ))}
                            </div>
                        </div>
                     )}
                 </div>
                 
                 {/* Quality Alert */}
                 {col.nullCount > 0 && (
                     <div className="mt-auto flex items-center gap-2 text-xs text-orange-300 bg-orange-900/20 p-2 rounded">
                         <AlertTriangle className="w-3 h-3" />
                         <span>{col.nullCount} {t.quality.missing}</span>
                     </div>
                 )}
                 {col.uniqueCount === dataset.rowCount && (
                     <div className="mt-auto flex items-center gap-2 text-xs text-blue-300 bg-blue-900/20 p-2 rounded">
                         <CheckCircle2 className="w-3 h-3" />
                         <span>{t.quality.allUnique}</span>
                     </div>
                 )}
             </div>
         ))}
      </div>
    </div>
  );
};
