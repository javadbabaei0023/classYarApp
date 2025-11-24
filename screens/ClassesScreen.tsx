import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users } from 'lucide-react';
import { getSupabase } from '../services/supabase';
import { SchoolClass } from '../types';

const ClassesScreen: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchClasses = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
    if (!error && data) setClasses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSaveClass = async () => {
    const supabase = getSupabase();
    if (!supabase || !newClassName.trim()) return;

    if (editingId) {
      await supabase.from('classes').update({ name: newClassName }).eq('id', editingId);
    } else {
      await supabase.from('classes').insert([{ name: newClassName }]);
    }
    
    setNewClassName('');
    setEditingId(null);
    setShowModal(false);
    fetchClasses();
  };

  const handleDelete = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (window.confirm('آیا از حذف این کلاس و تمام دانش‌آموزان آن اطمینان دارید؟')) {
      await supabase.from('classes').delete().eq('id', id);
      fetchClasses();
    }
  };

  const openEdit = (cls: SchoolClass) => {
    setNewClassName(cls.name);
    setEditingId(cls.id);
    setShowModal(true);
  };

  return (
    <div className="p-4 relative min-h-full pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">مدیریت کلاس‌ها</h2>
        <button 
          onClick={() => { setNewClassName(''); setEditingId(null); setShowModal(true); }}
          className="bg-emerald-600 text-white p-3 rounded-2xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:bg-emerald-700 transition-all active:scale-95 hover:-translate-y-0.5"
        >
          <Plus size={24} />
        </button>
      </div>

      {!getSupabase() ? (
        <div className="text-center text-rose-500 mt-10 p-6 bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-100 dark:border-rose-900 flex flex-col items-center gap-2">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-full text-rose-600 mb-2">
             <Trash2 size={24} /> 
          </div>
          <span>لطفاً ابتدا تنظیمات سرور را انجام دهید.</span>
        </div>
      ) : loading ? (
        <div className="flex justify-center mt-10">
             <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center text-slate-400 dark:text-slate-500 mt-10 bg-white dark:bg-slate-900 p-10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="inline-block p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-3">
                <Users size={32} className="opacity-50"/>
            </div>
            <p>هنوز کلاسی تعریف نشده است.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-emerald-100 dark:hover:border-emerald-900/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg group-hover:scale-110 transition-transform">
                  {cls.name.substring(0, 2)}
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">{cls.name}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cls)} className="p-2.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all">
                  <Edit2 size={20} />
                </button>
                <button onClick={() => handleDelete(cls.id)} className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 transform transition-all">
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white text-center">{editingId ? 'ویرایش کلاس' : 'افزودن کلاس جدید'}</h3>
            <input 
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="نام کلاس (مثلاً: دهم ریاضی)"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 p-3.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">لغو</button>
              <button onClick={handleSaveClass} className="flex-1 p-3.5 text-white bg-emerald-600 rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesScreen;