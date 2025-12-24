import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Calendar, Filter, BarChart3, TrendingUp, AlertCircle, FileSpreadsheet, Download } from 'lucide-react';
import { DataSet, ColumnType, Language } from '../types';
import { translations } from '../utils/translations';
import * as XLSX from 'xlsx';

interface DashboardProps {
  dataset: DataSet;
  language: Language;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const formatCurrency = (value: number, lang: Language) => {
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
  const currency = lang === 'pt' ? 'BRL' : 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCurrencyCompact = (value: number, lang: Language) => {
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
  const currency = lang === 'pt' ? 'BRL' : 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

export const Dashboard: React.FC<DashboardProps> = ({ dataset, language }) => {
  const [selectedMeasure, setSelectedMeasure] = useState<string>(dataset.primaryMeasureColumn || '');
  const [selectedDimension, setSelectedDimension] = useState<string>(dataset.dimensions[0] || '');
  const [timeFilter, setTimeFilter] = useState<'All' | 'Year' | 'Month'>('All');
  
  const t = translations[language];

  // Memoized Data Processing for Charts
  const processedData = useMemo(() => {
    if (!dataset) return null;

    let filteredRows = dataset.rows;

    // 1. Time Series Data
    let timeSeriesData: any[] = [];
    if (dataset.primaryDateColumn && selectedMeasure) {
      const grouped = new Map();
      filteredRows.forEach(row => {
        const rawDate = row[dataset.primaryDateColumn!];
        if (!rawDate) return;

        // Skip boolean values to avoid TypeScript overload error and invalid dates
        if (typeof rawDate === 'boolean') return;

        const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
        if (isNaN(date.getTime())) return;

        // Simple aggregation by formatted date string based on granularity could go here
        const key = date.toISOString().split('T')[0]; // Daily resolution
        grouped.set(key, (grouped.get(key) || 0) + (Number(row[selectedMeasure]) || 0));
      });
      
      timeSeriesData = Array.from(grouped.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // 2. Categorical Aggregation
    let categoryData: any[] = [];
    if (selectedDimension) {
      const grouped = new Map();
      filteredRows.forEach(row => {
        const key = String(row[selectedDimension] || 'Unknown');
        // Count or Sum
        const val = selectedMeasure ? (Number(row[selectedMeasure]) || 0) : 1;
        grouped.set(key, (grouped.get(key) || 0) + val);
      });

      categoryData = Array.from(grouped.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10
    }

    // 3. Distribution (Histogram-like bucket logic simplified for speed)
    let distributionData: any[] = [];
    if (selectedMeasure) {
      const values = filteredRows.map(r => Number(r[selectedMeasure])).filter(n => !isNaN(n));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const bucketCount = 10;
      const step = (max - min) / bucketCount;
      
      const buckets = new Array(bucketCount).fill(0);
      values.forEach(v => {
        const idx = Math.min(Math.floor((v - min) / step), bucketCount - 1);
        buckets[idx]++;
      });

      distributionData = buckets.map((count, i) => ({
        range: `${formatCurrencyCompact(min + i * step, language)} - ${formatCurrencyCompact(min + (i + 1) * step, language)}`,
        count
      }));
    }

    // 4. Calculate KPIs
    const totalRows = filteredRows.length;
    let measureTotal = 0;
    let measureAvg = 0;
    
    if (selectedMeasure) {
      const validValues = filteredRows.map(r => Number(r[selectedMeasure])).filter(n => !isNaN(n));
      measureTotal = validValues.reduce((a, b) => a + b, 0);
      measureAvg = validValues.length ? measureTotal / validValues.length : 0;
    }

    return { timeSeriesData, categoryData, distributionData, totalRows, measureTotal, measureAvg };
  }, [dataset, selectedMeasure, selectedDimension, timeFilter, language]);

  if (!processedData) return <div>Loading...</div>;

  const downloadCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataset.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "datadash_export.csv");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls Bar */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap gap-4 items-center justify-between shadow-lg">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">{t.dashboard.measure}:</span>
            <select 
              value={selectedMeasure} 
              onChange={(e) => setSelectedMeasure(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">{t.dashboard.countRows}</option>
              {dataset.columns.filter(c => c.type === ColumnType.NUMBER).map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">{t.dashboard.dimension}:</span>
            <select 
              value={selectedDimension} 
              onChange={(e) => setSelectedDimension(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {dataset.dimensions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> {t.dashboard.export}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title={t.dashboard.kpiRecords} value={processedData.totalRows.toLocaleString()} icon={<FileSpreadsheet className="text-blue-400" />} />
        {selectedMeasure && (
          <>
            <KPICard title={`${t.dashboard.kpiTotal} ${selectedMeasure}`} value={formatCurrencyCompact(processedData.measureTotal, language)} icon={<TrendingUp className="text-emerald-400" />} />
            <KPICard title={`${t.dashboard.kpiAvg} ${selectedMeasure}`} value={formatCurrency(processedData.measureAvg, language)} icon={<TrendingUp className="text-purple-400" />} />
          </>
        )}
        <KPICard title={t.dashboard.kpiCols} value={dataset.columns.length.toString()} icon={<AlertCircle className="text-orange-400" />} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Time Series */}
        {dataset.primaryDateColumn && processedData.timeSeriesData.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">{t.dashboard.chartTimeline}</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedData.timeSeriesData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tickFormatter={(str) => new Date(str).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')} 
                    minTickGap={50}
                  />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => formatCurrencyCompact(v, language)} />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value, language)}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" name={selectedMeasure || 'Value'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Categories Bar Chart */}
        {selectedDimension && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">{t.dashboard.chartTop} {selectedDimension}</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData.categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => formatCurrencyCompact(v, language)} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={140} tick={{fontSize: 12}} />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value, language)}
                    cursor={{fill: '#334155'}} 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} 
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name={selectedMeasure || 'Count'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Distribution / Donut */}
        {selectedDimension && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">{t.dashboard.chartShare} {selectedDimension}</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {processedData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value, language)}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Histogram (if measure exists) */}
        {selectedMeasure && (
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">{selectedMeasure} {t.dashboard.chartDist}</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData.distributionData} margin={{bottom: 20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="range" 
                    stroke="#94a3b8" 
                    tick={{fontSize: 11}} 
                    interval={0} 
                    angle={-45} 
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#94a3b8" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} 
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={t.dashboard.frequency} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      
      {/* Detailed Data Table Preview */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
         <div className="p-4 border-b border-slate-700 bg-slate-800/50">
             <h3 className="font-semibold text-slate-200">{t.dashboard.tablePreview}</h3>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-400">
                 <thead className="bg-slate-900 text-slate-200 uppercase font-medium">
                     <tr>
                         {dataset.columns.map(col => (
                             <th key={col.name} className="px-6 py-3 whitespace-nowrap">{col.name}</th>
                         ))}
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700">
                     {dataset.rows.slice(0, 50).map((row, idx) => (
                         <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                             {dataset.columns.map(col => (
                                 <td key={col.name} className="px-6 py-3 whitespace-nowrap">
                                     {typeof row[col.name] === 'object' && row[col.name] instanceof Date 
                                        ? (row[col.name] as Date).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
                                        : String(row[col.name] ?? '')}
                                 </td>
                             ))}
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center gap-4 hover:bg-slate-750 transition-colors">
    <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
    </div>
  </div>
);
