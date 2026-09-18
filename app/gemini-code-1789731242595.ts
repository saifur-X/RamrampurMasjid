'use client';
import { useState, useEffect } from 'react';
import { getFormattedCalendars } from '@/lib/calendars';
import { supabase } from '@/lib/supabase';
import { Bell, Wallet, LogIn, Globe, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* টপ হেডার ব্যানার */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🕌</span>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  {lang === 'bn' ? 'মসজিদ ম্যানেজমেন্ট' : 'Mosque Dashboard'}
                </h1>
                <p className="text-[11px] text-emerald-200 font-medium">ডিজিটাল ট্র্যাকিং ও হিসাব পোর্টাল</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1">
                <Globe size={14} /> {lang === 'bn' ? 'EN' : 'বাং'}
              </button>
              <Link
                href="/login"
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-1.5 rounded-full text-xs font-black shadow-md transition flex items-center gap-1">
                <LogIn size={14} /> {lang === 'bn' ? 'লগইন' : 'Login'}
              </Link>
            </div>
          </div>

          {/* ক্যালেন্ডার ও সময়ের রিয়েল-টাইম বার */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/25 backdrop-blur-sm p-3 rounded-2xl border border-white/10 text-xs font-medium">
            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-100">
              <span className="text-amber-400">⏰</span> {dates.englishIST || 'লোড হচ্ছে...'}
            </div>
            <div className="flex items-center justify-center gap-2 text-emerald-100">
              <span className="text-amber-400">🌙</span> {dates.hijriDate}
            </div>
            <div className="flex items-center justify-center md:justify-end gap-2 text-emerald-100">
              <span className="text-amber-400">🌾</span> {dates.bengaliDate}
            </div>
          </div>
        </div>
      </header>

      {/* মূল কনটেন্ট */}
      <main className="max-w-4xl mx-auto px-4 mt-6 flex flex-col gap-6">
        {/* ফান্ড সামারি কার্ড */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
              <TrendingUp size={18} className="text-emerald-500" />
              {lang === 'bn' ? 'মোট অনুদান / জমা' : 'Total Income'}
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900">₹ {summary.income}</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-2">
              <TrendingDown size={18} className="text-rose-500" />
              {lang === 'bn' ? 'মোট খরচ' : 'Total Expense'}
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900">₹ {summary.expense}</div>
          </div>
        </section>

        {/* জরুরি নোটিস ও খবর */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
              <Bell size={20} className="text-amber-500" />
              {lang === 'bn' ? 'জরুরি নোটিস ও ওয়াজের খবর' : 'Notices & Announcements'}
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">লাইভ</span>
          </div>

          <div className="flex flex-col gap-3">
            {notices.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm font-medium">
                {lang === 'bn' ? 'বর্তমানে কোনো নতুন নোটিস নেই।' : 'No announcements available.'}
              </div>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-600 hover:bg-slate-100/70 transition">
                  <div className="font-bold text-slate-900 text-base">{n.title}</div>
                  <div className="text-sm text-slate-600 mt-1 leading-relaxed">{n.content}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}