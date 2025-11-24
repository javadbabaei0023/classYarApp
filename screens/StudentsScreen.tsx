import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileSpreadsheet, User, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getSupabase } from '../services/supabase';
import { SchoolClass, Student } from '../types';

const StudentsScreen: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
        setStudents([]);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.from('classes').select('*');
    if (data && data.length > 0) {
        setClasses(data);
        setSelectedClass(data[0].id);
    }
  };

  const fetchStudents = async (classId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('students').select('*').eq('class_id', classId).order('last_name');
    if (data) setStudents(data);
    setLoading(false);
  };

  const handleAddStudent = async () => {
    const supabase = getSupabase();
    if (!supabase || !selectedClass) return;

    await supabase.from('students').insert([{
      class_id: selectedClass,
      first_name: firstName,
      last_name: lastName,
      code: code
    }]);

    setFirstName(''); setLastName(''); setCode('');
    setShowModal(false);
    fetchStudents(selectedClass);
  };

  const handleDelete = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (window.confirm('دانش‌آموز حذف شود؟')) {
      await supabase.from('students').delete().eq('id', id);
      fetchStudents(selectedClass);
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClass) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const formattedData = data.map(row => ({
        class_id: selectedClass,
        first_name: row.first_name || row['نام'] || 'Unknown',
        last_name: row.last_name || row['نام خانوادگی'] || 'Unknown',
        code: row.code || row['کد ملی'] || ''
      }));

      const supabase = getSupabase();
      if(supabase) {
          const { error } = await supabase.from('students').insert(formattedData);
          if(!error) {
              alert(`${formattedData.length} دانش‌آموز با موفقیت اضافه شدند.`);
              fetchStudents(selectedClass);
          } else {
              alert('خطا در بارگذاری اکسل');
              console.error(error);
          }
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6 relative">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-1">انتخاب کلاس</label>
        <div className="relative">
            <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full appearance-none p-4 bg-white dark:bg-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
            >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            {classes.length === 0 && <option>کلاسی یافت نشد</option>}
            </select>
            <ChevronDown className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20} />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button 
          onClick={() => setShowModal(true)}
          disabled={!selectedClass}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 font-bold disabled:opacity-50 transition-all active:scale-95"
        >
          <Plus size={20} />
          دانش‌آموز جدید
        </button>
        <label className={`flex-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white p-3.5 rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 font-bold cursor-pointer transition-all active:scale-95 ${!selectedClass ? 'opacity-50 pointer-events-none' : ''}`}>
          <FileSpreadsheet size={20} />
          ورود اکسل
          <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center mt-10">
             <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-2 mb-1">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">لیست دانش‌آموزان</span>
                <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">{students.length} نفر</span>
            </div>
          
          {students.map((student) => (
            <div key={student.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  <User size={24} />
                </div>
                <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-base">{student.first_name} {student.last_name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono tracking-wide">{student.code || '---'}</div>
                </div>
              </div>
              <button onClick={() => handleDelete(student.id)} className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 p-2 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">افزودن دانش‌آموز</h3>
            </div>
            
            <div className="space-y-3">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="نام" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="نام خانوادگی" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="کد ملی / شماره دانش‌آموزی" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 p-3.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">لغو</button>
              <button onClick={handleAddStudent} className="flex-1 p-3.5 text-white bg-emerald-600 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-colors">ثبت</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsScreen;