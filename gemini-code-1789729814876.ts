'use client';
import { useState, useEffect } from 'react';
import { getFormattedCalendars } from '@/lib/calendars';
import { supabase } from '@/lib/supabase';
import { Bell, Wallet, Users, Clock, Globe } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [dates, setDates] = useState({ englishIST: '', hijriDate: '', bengaliDate: '' });
  const [notices, setNotices] = useState<any[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });

  useEffect(() => {
    setDates(getFormattedCalendars());
    const interval = setInterval(() => setDates(getFormattedCalendars()), 1000);

    async function loadData() {
      const { data: noticeData } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5);
      if (noticeData) setNotices(noticeData);

      const { data: trans } = await supabase.from('transactions').select('type, amount');
      if (trans) {
        const inc = trans.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const exp = trans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
        setSummary({ income: inc, expense: exp });
      }
    }
    loadData();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* হেডার ও ঘড়ি */}
      <header className="bg-emerald-700 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold flex items-center gap-2">
              🕌 {lang === 'bn' ? 'মসজিদ ম্যানেজমেন্ট' : 'Mosque Dashboard'}
            </h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
                className="bg-emerald-800 px-3 py-1 rounded text-sm font-semibold flex items-center gap-1">
                <Globe size={16} /> {lang === 'bn' ? 'English' : 'বাংলা'}
              </button>
              <Link href="/login" className="bg-white text-emerald-800 px-3 py-1 rounded text-sm font-bold">
                {lang === 'bn' ? 'লগইন' : 'Login'}
              </Link>
            </div>
          </div>
          
          <div className="bg-emerald-800/60 p-2 rounded text-xs grid grid-cols-1 md:grid-cols-3 gap-1 text-center">
            <div>⏰ {dates.englishIST || 'লোড হচ্ছে...'}</div>
            <div>🌙 {dates.hijriDate}</div>
            <div>🌾 {dates.bengaliDate}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        {/* ফান্ড সামারি কার্ড */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-1">
              <Wallet size={20} /> {lang === 'bn' ? 'মোট অনুদান' : 'Total Income'}
            </div>
            <div className="text-2xl font-bold text-slate-800">₹ {summary.income}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-rose-600 font-semibold mb-1">
              <Wallet size={20} /> {lang === 'bn' ? 'মোট খরচ' : 'Total Expense'}
            </div>
            <div className="text-2xl font-bold text-slate-800">₹ {summary.expense}</div>
          </div>
        </section>

        {/* জরুরি নোটিস ও খবর */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3 text-slate-800">
            <Bell size={20} className="text-emerald-600" />
            {lang === 'bn' ? 'জরুরি নোটিস ও ওয়াজের খবর' : 'Notices & Announcements'}
          </h2>
          <div className="flex flex-col gap-3">
            {notices.length === 0 ? (
              <p className="text-sm text-slate-500">{lang === 'bn' ? 'কোনো নোটিস নেই।' : 'No notices found.'}</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="p-3 bg-slate-50 rounded-lg border-l-4 border-emerald-600">
                  <div className="font-bold text-slate-800">{n.title}</div>
                  <div className="text-sm text-slate-600 mt-1">{n.content}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}