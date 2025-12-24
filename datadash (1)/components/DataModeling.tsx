import React, { useState, useEffect, useMemo } from 'react';
import { TableCollection, DataModel, JoinConfig, Table, DataSet } from '../types';
import { suggestJoins } from '../services/dataProcessor';
import { executeDataModel } from '../services/joinEngine';
import { Database, Plus, Trash2, ArrowRight, AlertTriangle, Table as TableIcon, Play, AlertCircle } from 'lucide-react';
import { translations } from '../utils/translations';

interface DataModelingProps {
  tables: TableCollection;
  language: 'en' | 'pt';
  onModelComplete: (unifiedDataset: DataSet) => void;
}

export const DataModeling: React.FC<DataModelingProps> = ({ tables, language, onModelComplete }) => {
  const tableIds = Object.keys(tables);
  const t = translations[language];
  
  // State
  const [baseTableId, setBaseTableId] = useState<string>(tableIds[0]);
  const [joins, setJoins] = useState<JoinConfig[]>([]);
  const [previewData, setPreviewData] = useState<DataSet | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-suggest joins when base table changes
  useEffect(() => {
    const suggestions = suggestJoins(baseTableId, tables);
    setJoins(suggestions);
  }, [baseTableId, tables]);

  // Generate Preview Effect
  useEffect(() => {
    try {
        const model: DataModel = { baseTableId, joins };
        // We do a "light" execution for preview? 
        // Currently executeDataModel is fast enough for small/medium data (<50k rows).
        // For larger data, we might want to debounce this.
        const unified = executeDataModel(tables, model);
        setPreviewData(unified);
    } catch (e) {
        console.error("Modeling error", e);
    }
  }, [baseTableId, joins, tables]);

  const addJoin = () => {
    const potentialTables = tableIds.filter(id => id !== baseTableId && !joins.find(j => j.rightTableId === id));
    if (potentialTables.length === 0) return;

    const rightId = potentialTables[0];
    const rightTable = tables[rightId];
    const leftTable = tables[baseTableId];

    setJoins([...joins, {
        id: crypto.randomUUID(),
        rightTableId: rightId,
        leftColumn: leftTable.columns[0].name,
        rightColumn: rightTable.columns[0].name,
        joinType: 'LEFT'
    }]);
  };

  const removeJoin = (id: string) => {
      setJoins(joins.filter(j => j.id !== id));
  };

  const updateJoin = (id: string, updates: Partial<JoinConfig>) => {
      setJoins(joins.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const handleConfirm = () => {
      if (previewData) {
          setLoading(true);
          // Small timeout to allow UI to show loading state
          setTimeout(() => {
              onModelComplete(previewData);
          }, 100);
      }
  };

  // Helper to check uniqueness of right-side join keys
  const getUniquenessWarning = (join: JoinConfig) => {
      const table = tables[join.rightTableId];
      const col = table.columns.find(c => c.name === join.rightColumn);
      if (col && col.uniqueCount < table.rowCount) {
          return `${t.modeling.duplicateKeyWarning} (${col.uniqueCount}/${table.rowCount} unique)`;
      }
      return null;
  };

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <div className="text-center mb-8">
         <h2 className="text-3xl font-bold text-white mb-2">{t.modeling.title}</h2>
         <p className="text-slate-400">{t.modeling.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
         
         {/* Configuration Panel */}
         <div className="lg:col-span-1 space-y-6">
             
             {/* Base Table Selector */}
             <div className="bg-slate-800 p-5 rounded-xl border border-blue-500/30 shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                     <Database className="text-blue-400" size={20}/> {t.modeling.factTable}
                 </h3>
                 <select 
                    value={baseTableId}
                    onChange={(e) => setBaseTableId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 >
                    {tableIds.map(id => (
                        <option key={id} value={id}>{tables[id].tableName} ({tables[id].rowCount} rows)</option>
                    ))}
                 </select>
                 <p className="text-xs text-slate-400 mt-2">
                    {t.modeling.factHelp}
                 </p>
             </div>

             {/* Joins List */}
             <div className="space-y-4">
                 <div className="flex items-center justify-between">
                     <h3 className="text-lg font-semibold text-white">{t.modeling.joins}</h3>
                     <button 
                        onClick={addJoin}
                        className="flex items-center gap-1 text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                     >
                         <Plus size={16}/> {t.modeling.addJoin}
                     </button>
                 </div>

                 {joins.length === 0 && (
                     <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-500">
                         {t.modeling.noJoins}
                     </div>
                 )}

                 {joins.map((join, index) => (
                     <div key={join.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md relative group">
                         <div className="flex items-center gap-2 mb-3">
                             <span className="bg-slate-700 text-xs font-bold px-2 py-1 rounded text-slate-300">JOIN #{index + 1}</span>
                             <div className="flex-1"></div>
                             <button onClick={() => removeJoin(join.id)} className="text-slate-500 hover:text-red-400">
                                 <Trash2 size={16}/>
                             </button>
                         </div>
                         
                         <div className="flex flex-col gap-3">
                             {/* Join Type & Table */}
                             <div className="flex gap-2">
                                 <select 
                                    className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-blue-300 font-bold"
                                    value={join.joinType}
                                    onChange={(e) => updateJoin(join.id, { joinType: e.target.value as any })}
                                 >
                                     <option value="LEFT">LEFT JOIN</option>
                                     <option value="INNER">INNER JOIN</option>
                                 </select>
                                 <select 
                                    className="flex-1 bg-slate-900 border border-slate-700 text-sm rounded px-2 py-1 text-white"
                                    value={join.rightTableId}
                                    onChange={(e) => updateJoin(join.id, { rightTableId: e.target.value })}
                                 >
                                    {tableIds.filter(id => id !== baseTableId).map(id => (
                                        <option key={id} value={id}>{tables[id].tableName}</option>
                                    ))}
                                 </select>
                             </div>

                             {/* ON Clause */}
                             <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                 <div className="flex-1 min-w-0">
                                     <label className="text-[10px] text-slate-500 block mb-0.5">{tables[baseTableId].tableName}</label>
                                     <select 
                                        className="w-full bg-transparent text-sm text-slate-300 outline-none truncate"
                                        value={join.leftColumn}
                                        onChange={(e) => updateJoin(join.id, { leftColumn: e.target.value })}
                                     >
                                         {tables[baseTableId].columns.map(c => (
                                             <option key={c.name} value={c.name}>{c.name}</option>
                                         ))}
                                     </select>
                                 </div>
                                 <div className="text-slate-500">=</div>
                                 <div className="flex-1 min-w-0">
                                     <label className="text-[10px] text-slate-500 block mb-0.5">{tables[join.rightTableId].tableName}</label>
                                     <select 
                                        className="w-full bg-transparent text-sm text-slate-300 outline-none truncate"
                                        value={join.rightColumn}
                                        onChange={(e) => updateJoin(join.id, { rightColumn: e.target.value })}
                                     >
                                         {tables[join.rightTableId].columns.map(c => (
                                             <option key={c.name} value={c.name}>{c.name}</option>
                                         ))}
                                     </select>
                                 </div>
                             </div>
                             
                             {/* Warnings */}
                             {getUniquenessWarning(join) && (
                                 <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-900/10 p-1.5 rounded">
                                     <AlertTriangle size={12} />
                                     <span>{getUniquenessWarning(join)}</span>
                                 </div>
                             )}
                         </div>
                     </div>
                 ))}
             </div>
         </div>

         {/* Preview Area */}
         <div className="lg:col-span-2 flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
             <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                 <h3 className="font-semibold text-white flex items-center gap-2">
                     <TableIcon size={18} className="text-emerald-400"/>
                     {t.modeling.previewTitle}
                     {previewData && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{previewData.columns.length} cols x {previewData.rowCount} rows</span>}
                 </h3>
                 <button 
                    onClick={handleConfirm}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                 >
                     {loading ? t.auth.loading : (
                         <>
                            <Play size={18} fill="currentColor" /> {t.modeling.analyze}
                         </>
                     )}
                 </button>
             </div>
             
             <div className="flex-1 overflow-auto bg-slate-900 relative">
                 {previewData ? (
                     <table className="w-full text-left text-sm text-slate-400 border-collapse">
                        <thead className="bg-slate-950 text-slate-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                {previewData.columns.map(col => (
                                    <th key={col.name} className="px-4 py-3 whitespace-nowrap border-b border-slate-800 font-mono text-xs">
                                        {col.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {previewData.rows.slice(0, 50).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/50">
                                    {previewData.columns.map(col => (
                                        <td key={col.name} className="px-4 py-2 whitespace-nowrap border-r border-slate-800/50 last:border-r-0">
                                            {typeof row[col.name] === 'object' && row[col.name] instanceof Date 
                                            ? (row[col.name] as Date).toLocaleDateString()
                                            : String(row[col.name] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                     </table>
                 ) : (
                     <div className="flex items-center justify-center h-full text-slate-500">
                         {t.auth.loading}
                     </div>
                 )}
             </div>
             <div className="p-2 bg-slate-800 border-t border-slate-700 text-xs text-center text-slate-500">
                 {t.modeling.previewNote}
             </div>
         </div>
      </div>
    </div>
  );
};