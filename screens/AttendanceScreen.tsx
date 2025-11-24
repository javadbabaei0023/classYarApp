import React, { useState, useEffect } from 'react';
import { Calendar, Save, Check, Clock, X, FileText, ChevronLeft } from 'lucide-react';
import { getSupabase } from '../services/supabase';
import { SchoolClass, Student, AttendanceStatus } from '../types';
import { getTodayJalali, getWeekday } from '../utils/jalali';

// Component definition outside to prevent re-renders
const StatusButton = ({ current, type, icon, onClick, colorClass, activeClass, inactiveClass }: { 
  current: string, 
  type: string, 
  icon: React.ReactElement, 
  onClick: () => void, 
  colorClass: string,
  activeClass: string,
  inactiveClass: string 
}) => {
  const isActive = current === type;
  return (
      <button 
          onClick={onClick}
          className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isActive 
                  ? `${activeClass} shadow-md scale-110 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ${colorClass}` 
                  : `${inactiveClass} hover:bg-slate-200 dark:hover:bg-slate-700 scale-100`
          }`}
      >
          {React.cloneElement(icon, { 
            size: 20, 
            strokeWidth: isActive ? 3 : 2 
          } as any)}
      </button>
  );
};

const AttendanceScreen: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [date, setDate] = useState(getTodayJalali());
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
        const supabase = getSupabase();
        if(!supabase) return;
        const {data} = await supabase.from('classes').select('*');
        if(data && data.length > 0) {
            setClasses(data);
            setSelectedClass(data[0].id);
        }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    if(selectedClass && date) {
        loadAttendanceData();
    }
  }, [selectedClass, date]);

  const loadAttendanceData = async () => {
    const supabase = getSupabase();
    if(!supabase) return;
    setLoading(true);

    // 1. Get Students
    const {data: studentsData} = await supabase.from('students').select('*').eq('class_id', selectedClass).order('last_name');
    
    // 2. Get Existing Attendance
    const {data: attendanceData} = await supabase.from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', date);

    setStudents(studentsData || []);
    
    // Map existing records
    const newRecords: Record<string, AttendanceStatus> = {};
    if(studentsData) {
        studentsData.forEach(s => {
            const record = attendanceData?.find(a => a.student_id === s.id);
            newRecords[s.id] = record ? (record.status as AttendanceStatus) : 'present';
        });
    }
    setRecords(newRecords);
    setLoading(false);
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({...prev, [studentId]: status}));
  };

  const saveAttendance = async () => {
    const supabase = getSupabase();
    if(!supabase) return;
    setSaving(true);

    const weekday = getWeekday(date);
    
    const upsertData = students.map(s => ({
        class_id: selectedClass,
        student_id: s.id,
        date: date,
        weekday: weekday,
        status: records[s.id]
    }));

    await supabase.from('attendance').delete().eq('class_id', selectedClass).eq('date', date);
    const { error } = await supabase.from('attendance').insert(upsertData);

    setSaving(false);
    if(!error) alert('لیست حضور و غیاب با موفقیت ذخیره شد.');
    else alert('خطا در ذخیره سازی اطلاعات');
  };

  return (
    <div className="p-4 space-y-4 min-h-full pb-24">
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <div className="flex gap-3 mb-3">
             <div className="relative flex-1">
               <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full appearance-none p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pr-8"
              >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronLeft size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
             </div>
            
            <div className="flex-1 relative">
                <input 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    placeholder="1403/01/01"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 text-sm text-center ltr outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <Calendar size={18} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
            </div>
        </div>
        
        <div className="flex justify-between items-center px-2">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full">{getWeekday(date)}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{students.length} دانش‌آموز</span>
        </div>
      </div>

      {loading ? (
          <div className="flex flex-col items-center justify-center mt-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400 text-sm">در حال دریافت لیست...</span>
          </div>
      ) : (
          <div className="space-y-3">
              {students.map(student => {
                  const status = records[student.id] || 'present';
                  
                  // Determine styles based on current status for the card border
                  let cardBorderClass = "border-slate-100 dark:border-slate-800";
                  if (status === 'absent_unjustified') cardBorderClass = "border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/10";
                  else if (status === 'late') cardBorderClass = "border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10";

                  return (
                    <div 
                        key={student.id} 
                        className={`p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border transition-all duration-300 ${cardBorderClass}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{student.first_name} {student.last_name}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 tracking-wider">{student.code || '---'}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-2xl">
                            <StatusButton 
                                current={status} type="present" 
                                colorClass="ring-emerald-500 dark:ring-emerald-400"
                                activeClass="bg-emerald-500 text-white"
                                inactiveClass="text-slate-400 dark:text-slate-600"
                                icon={<Check />} 
                                onClick={() => setStatus(student.id, 'present')} 
                            />
                            <StatusButton 
                                current={status} type="late" 
                                colorClass="ring-amber-500 dark:ring-amber-400"
                                activeClass="bg-amber-500 text-white"
                                inactiveClass="text-slate-400 dark:text-slate-600"
                                icon={<Clock />} 
                                onClick={() => setStatus(student.id, 'late')} 
                            />
                            <StatusButton 
                                current={status} type="absent_justified" 
                                colorClass="ring-blue-500 dark:ring-blue-400"
                                activeClass="bg-blue-500 text-white"
                                inactiveClass="text-slate-400 dark:text-slate-600"
                                icon={<FileText />} 
                                onClick={() => setStatus(student.id, 'absent_justified')} 
                            />
                            <StatusButton 
                                current={status} type="absent_unjustified" 
                                colorClass="ring-rose-500 dark:ring-rose-400"
                                activeClass="bg-rose-500 text-white"
                                inactiveClass="text-slate-400 dark:text-slate-600"
                                icon={<X />} 
                                onClick={() => setStatus(student.id, 'absent_unjustified')} 
                            />
                        </div>
                    </div>
                  )
              })}
          </div>
      )}

      <button 
        onClick={saveAttendance}
        disabled={saving || loading}
        className="fixed bottom-20 left-4 right-4 max-w-[calc(28rem-2rem)] mx-auto bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-[0_8px_20px_-4px_rgba(5,150,105,0.4)] font-bold flex justify-center items-center gap-2 z-30 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
      >
          {saving ? (
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
              <>
                <Save size={20} />
                ثبت نهایی لیست
              </>
          )}
      </button>
    </div>
  );
};

export default AttendanceScreen;