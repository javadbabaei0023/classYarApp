import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getSupabase } from '../services/supabase';
import { SchoolClass, ATTENDANCE_STATUS_LABELS } from '../types';
import { getLast7Days } from '../utils/jalali';

// Updated colors to match the theme logic (Emerald, Amber, Blue, Rose)
const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e'];

const ReportsScreen: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [stats, setStats] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
        const supabase = getSupabase();
        if(!supabase) return;
        const { data } = await supabase.from('classes').select('*');
        if(data) {
            setClasses(data);
            if(data.length > 0) setSelectedClass(data[0].id);
        }
    };
    init();
  }, []);

  useEffect(() => {
      if(selectedClass) generateReport();
  }, [selectedClass]);

  const generateReport = async () => {
      const supabase = getSupabase();
      if(!supabase) return;
      setLoading(true);

      // 1. Overall Stats for Pie Chart
      const { data: allData } = await supabase
        .from('attendance')
        .select('status')
        .eq('class_id', selectedClass);
      
      if(allData) {
          const counts = {
              present: 0,
              late: 0,
              absent_justified: 0,
              absent_unjustified: 0
          };
          allData.forEach((r: any) => {
              if(counts[r.status as keyof typeof counts] !== undefined) {
                  counts[r.status as keyof typeof counts]++;
              }
          });

          setStats([
              { name: 'حاضر', value: counts.present },
              { name: 'تأخیر', value: counts.late },
              { name: 'غیبت موجه', value: counts.absent_justified },
              { name: 'غیرموجه', value: counts.absent_unjustified },
          ]);
      }

      // 2. Weekly Bar Chart
      const days = getLast7Days();
      const chartData = [];
      for (const day of days) {
           const { count } = await supabase.from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', selectedClass)
            .eq('date', day)
            .eq('status', 'present');
           
           chartData.push({
               name: day.split('/')[2], // Just the day number
               date: day,
               حاضرین: count || 0
           });
      }
      setWeeklyStats(chartData.reverse());
      setLoading(false);
  };

  const exportExcel = async () => {
      const supabase = getSupabase();
      if(!supabase) return;
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
            date,
            weekday,
            status,
            students (first_name, last_name, code),
            classes (name)
        `)
        .eq('class_id', selectedClass);

      if (error || !data) {
          alert('خطا در دریافت داده');
          return;
      }

      const rows = data.map((r: any) => ({
          'کلاس': r.classes?.name,
          'نام': r.students?.first_name,
          'نام خانوادگی': r.students?.last_name,
          'کد ملی': r.students?.code,
          'تاریخ': r.date,
          'روز': r.weekday,
          'وضعیت': ATTENDANCE_STATUS_LABELS[r.status as keyof typeof ATTENDANCE_STATUS_LABELS]
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
      XLSX.writeFile(wb, "gozaresh_hozor.xlsx");
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">گزارشات آماری</h2>
          <div className="relative">
             <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="appearance-none pl-8 pr-4 py-2 bg-white dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-emerald-500 shadow-sm"
            >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute left-2 top-2.5 text-slate-400 pointer-events-none"/>
          </div>
      </div>

      {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 text-sm">در حال محاسبه آمار...</span>
          </div>
      ) : (
          <>
            {/* Pie Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold mb-6 text-center text-slate-700 dark:text-slate-200 text-sm">وضعیت کلی کلاس</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    fontFamily: 'Vazirmatn'
                                }} 
                                itemStyle={{ color: '#334155' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {stats.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                            <span>{entry.name} ({entry.value})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold mb-6 text-center text-slate-700 dark:text-slate-200 text-sm">روند حضور (۷ روز اخیر)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9', opacity: 0.4}} 
                                contentStyle={{
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    fontFamily: 'Vazirmatn'
                                }}
                            />
                            <Bar dataKey="حاضرین" fill="#10b981" radius={[8, 8, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <button 
                onClick={exportExcel}
                className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white p-4 rounded-2xl shadow-lg shadow-slate-800/20 font-bold flex justify-center items-center gap-2 transition-all active:scale-95"
            >
                <Download size={20} />
                دانلود فایل اکسل گزارش
            </button>
          </>
      )}
    </div>
  );
};

export default ReportsScreen;