'use client';
import { useState, useEffect } from 'react';
import { getFormattedCalendars } from '@/lib/calendars';
import { supabase } from '@/lib/supabase';
import { Bell, TrendingUp, TrendingDown, LogIn, Globe, Sparkles, Moon, Sun } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [dates, setDates] = useState({
    englishFull: '',
    hijriDate: '',
    bengaliDate: '',
    isFriday: false,
    dayName: ''
  });
  const [notices, setNotices] = useState<any[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [mosqueProfile, setMosqueProfile] = useState<any>(null);

  useEffect(() => {
    setDates(getFormattedCalendars());
    const interval = setInterval(() => setDates(getFormattedCalendars()), 1000);

    async function loadData() {
      // নোটিস লোড
      const { data: noticeData } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5);
      if (noticeData) setNotices(noticeData);

      // আয় ও ব্যয় লোড
      const { data: trans } = await supabase.from('transactions').select('type, amount');
      if (trans) {
        const inc = trans.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const exp = trans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
        setSummary({ income: inc, expense: exp });
      }

      // মসজিদ লেটারহেড প্রোফাইল লোড
      const { data: mProf } = await supabase.from('mosque_profile').select('*').limit(1).maybeSingle();
      if (mProf) setMosqueProfile(mProf);
    }
    loadData();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* মসজিদের লেটারহেড হেডার ব্যানার */}
      <header className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-xl sticky top-0 z-50 border-b-2 border-amber-500/80">
        <div className="max-w-4xl mx-auto px-4 py-3">
          
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl">🕌</span>
              <div>
                <h1 className="text-lg md:text-2xl font-black tracking-wide uppercase text-amber-300">
                  {mosqueProfile?.name || (lang === 'bn' ? 'রামরামপুর জামে মসজিদ' : 'Ramrampur Jame Masjid')}
                </h1>
                <p className="text-[11px] text-emerald-200">
                  {mosqueProfile?.address || (lang === 'bn' ? 'ডিজিটাল ট্র্যাকিং ও হিসাব পোর্টাল' : 'Digital Tracking & Account Portal')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1">
                <Globe size={13} /> {lang === 'bn' ? 'EN' : 'বাং'}
              </button>
              <Link
                href="/login"
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-1.5 rounded-full text-xs font-black shadow transition flex items-center gap-1">
                <LogIn size={14} /> {lang === 'bn' ? 'লগইন' : 'Login'}
              </Link>
            </div>
          </div>

          {/* ইংরেজি সময়, আরবি সন ও বাংলা সাল বার */}
          <div className="bg-black/35 backdrop-blur-sm p-2.5 rounded-2xl border border-white/10 text-xs font-semibold grid grid-cols-1 md:grid-cols-3 gap-1.5 text-center">
            <div className="text-amber-300 font-mono flex items-center justify-center md:justify-start gap-1">
              <span>⏰</span> {dates.englishFull || 'Loading time...'}
            </div>
            <div className="text-emerald-100 flex items-center justify-center gap-1">
              <Moon size={13} className="text-amber-300" /> {dates.hijriDate}
            </div>
            <div className="text-emerald-100 flex items-center justify-center md:justify-end gap-1">
              <span>🌾</span> {dates.bengaliDate}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-4 flex flex-col gap-4">
        
        {/* জুমার দিন স্বয়ংক্রিয় মোবারকবাদ ব্যানার */}
        {dates.isFriday && (
          <section className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 text-white p-4 rounded-3xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">
                ✨
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide">
                  {lang === 'bn' ? 'পবিত্র জুম্মা মুবারক!' : 'Jumma Mubarak!'}
                </h3>
                <p className="text-xs text-amber-100 font-medium">
                  {lang === 'bn' ? 'আজকের এই বরকতময় দিনে আপনার ও আপনার পরিবারের উপর আল্লাহর রহমত বর্ষিত হোক।' : 'May Allah bless you and your family on this blessed Friday.'}
                </p>
              </div>
            </div>
            <Sparkles className="text-amber-200 hidden md:block" size={24} />
          </section>
        )}

        {/* ফান্ড সামারি */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase mb-1">
              <TrendingUp size={16} className="text-emerald-500" />
              {lang === 'bn' ? 'মোট অনুদান / জমা' : 'Total Income'}
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900">₹ {summary.income}</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase mb-1">
              <TrendingDown size={16} className="text-rose-500" />
              {lang === 'bn' ? 'মোট খরচ' : 'Total Expense'}
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900">₹ {summary.expense}</div>
          </div>
        </section>

        {/* জরুরি নোটিস ও ওয়াজের খবর */}
        <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h2 className="text-base font-black flex items-center gap-2 text-slate-800">
              <Bell size={18} className="text-amber-500" />
              {lang === 'bn' ? 'জরুরি নোটিস ও ওয়াজের খবর' : 'Notices & Announcements'}
            </h2>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">লাইভ</span>
          </div>

          <div className="flex flex-col gap-3">
            {notices.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                {lang === 'bn' ? 'বর্তমানে কোনো নতুন নোটিস নেই।' : 'No announcements available.'}
              </div>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-600">
                  <div className="font-bold text-slate-900 text-sm">{n.title}</div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">{n.content}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}