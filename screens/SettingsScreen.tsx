import React, { useState, useEffect } from 'react';
import { Save, Database, AlertCircle, Copy, Check, Github } from 'lucide-react';
import { getStoredConfig, saveConfig, testConnection, resetSupabase } from '../services/supabase';
import { SupabaseConfig } from '../types';

const SettingsScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    const config = getStoredConfig();
    if (config) {
      setUrl(config.url);
      setKey(config.anonKey);
    }
  }, []);

  const handleSave = async () => {
    if (!url || !key) {
      setMsg('لطفاً آدرس و کلید را وارد کنید');
      setStatus('error');
      return;
    }

    setStatus('testing');
    const isConnected = await testConnection(url, key);

    if (isConnected) {
      const config: SupabaseConfig = { url, anonKey: key };
      saveConfig(config);
      resetSupabase();
      setStatus('success');
      setMsg('اتصال موفقیت‌آمیز بود و تنظیمات ذخیره شد.');
    } else {
      setStatus('error');
      setMsg('خطا در اتصال. لطفاً مقادیر را بررسی کنید.');
    }
  };

  const sqlQuery = `
-- Create Classes Table
create table public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Students Table
create table public.students (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Attendance Table
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  date text not null,
  weekday text,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Optional for public anon access but recommended)
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;

-- Create Policies (Allow all for demo purposes)
create policy "Enable all access for all users" on public.classes for all using (true) with check (true);
create policy "Enable all access for all users" on public.students for all using (true) with check (true);
create policy "Enable all access for all users" on public.attendance for all using (true) with check (true);
  `;

  const githubWorkflow = `
name: Build Android APK
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install Dependencies
        run: npm install
      - name: Build Android
        run: cd android && ./gradlew assembleRelease
      - name: Upload Artifact
        uses: actions/upload-artifact@v2
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/app-release.apk
  `;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
             <Database size={20} />
          </div>
          تنظیمات سرور Supabase
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 px-1">Supabase URL</label>
            <input 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-left ltr transition-all text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 px-1">Supabase Anon Key</label>
            <input 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-left ltr transition-all text-sm font-mono"
            />
          </div>

          {status !== 'idle' && (
            <div className={`p-4 rounded-2xl text-sm flex items-start gap-3 ${
              status === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' : 
              status === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
            }`}>
              {status === 'testing' ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mt-0.5"></div> : 
               status === 'success' ? <Check size={18} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />}
              <span className="leading-relaxed">{msg}</span>
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={status === 'testing'}
            className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
          >
            <Save size={20} />
            بررسی و ذخیره
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-white mb-2">راهنمای دیتابیس</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          اگر جداول را نساخته‌اید، کد SQL زیر را در بخش SQL Editor داشبورد Supabase اجرا کنید.
        </p>
        <button 
          onClick={() => setShowSql(!showSql)}
          className="text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl mb-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          {showSql ? 'پنهان کردن کد SQL' : 'نمایش کد SQL ساخت جداول'}
        </button>
        
        {showSql && (
          <div className="relative mt-3">
            <pre className="bg-slate-950 text-slate-300 p-4 rounded-2xl text-[10px] overflow-x-auto text-left font-mono border border-slate-800" dir="ltr">
              {sqlQuery}
            </pre>
            <button 
               onClick={() => navigator.clipboard.writeText(sqlQuery)}
               className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
               title="Copy"
            >
              <Copy size={14} className="text-white" />
            </button>
          </div>
        )}
      </div>

       <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm">
            <Github size={18}/>
            GitHub Action Workflow
        </h3>
        <div className="relative">
             <pre className="bg-slate-950 text-slate-300 p-4 rounded-2xl text-[10px] overflow-x-auto text-left font-mono border border-slate-800" dir="ltr">
              {githubWorkflow}
            </pre>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;