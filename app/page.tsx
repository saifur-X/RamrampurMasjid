'use client';
import { useState, useEffect } from 'react';
import { getFormattedCalendars } from '@/lib/calendars';
import { supabase } from '@/lib/supabase';
import { 
  Bell, TrendingUp, TrendingDown, LogIn, Globe, 
  Sparkles, Moon, Clock, Wallet, X, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import Link from 'next/link';

// সংখ্যা ধীরে ধীরে বাড়ার অ্যানিমেশন হুক (Count-up Animation)
function useCountUp(targetValue: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(targetValue) || 0;
    if (start === end) {
      setCount(end);
      return;
    }

    const stepTime = Math.max(16, Math.floor(duration / 60));
    const step = (end - start) / (duration / stepTime);

    const timer = setInterval(() => {
      start += step;
      if ((step > 0 && start >= end) || (step < 0 && start <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetValue, duration]);

  return count;
}

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [mosqueProfile, setMosqueProfile] = useState<any>(null);

  // ট্রানজ্যাকশন হিস্ট্রি মডাল স্টেট
  const [historyModal, setHistoryModal] = useState<'income' | 'expense' | null>(null);

  useEffect(() => {
    setDates(getFormattedCalendars());
    const interval = setInterval(() => setDates(getFormattedCalendars()), 1000);

    async function loadData() {
      // নোটিস লোড
      const { data: noticeData } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5);
      if (noticeData) setNotices(noticeData);

      // সব লেনদেন হিস্ট্রি লোড
      const { data: trans } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (trans) {
        setTransactions(trans);
        const inc = trans.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const exp = trans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
        setSummary({ income: inc, expense: exp });
      }

      // মসজিদ প্রোফাইল লোড
      const { data: mProf } = await supabase.from('mosque_profile').select('*').limit(1).maybeSingle();
      if (mProf) setMosqueProfile(mProf);
    }
    loadData();

    return () => clearInterval(interval);
  }, []);

  const netBalance = summary.income - summary.expense;

  // কাউন্টার অ্যানিমেশন
  const animatedIncome = useCountUp(summary.income);
  const animatedExpense = useCountUp(summary.expense);
  const animatedBalance = useCountUp(netBalance);

  // ফিল্টার করা লেনদেন
  const modalTransactions = transactions.filter(t => t.type === historyModal);

  // নামাজের সময়সূচি (গ্রামের মসজিদের আদর্শ সময়)
  const prayerTimes = [
    { name: lang === 'bn' ? 'ফজর' : 'Fajr', azan: '04:45 AM', jamat: '05:15 AM' },
    { name: lang === 'bn' ? 'যোহর' : 'Dhuhr', azan: '01:00 PM', jamat: '01:30 PM' },
    { name: lang === 'bn' ? 'আসর' : 'Asr', azan: '04:30 PM', jamat: '04:45 PM' },
    { name: lang === 'bn' ? 'মাগরিব' : 'Maghrib', azan: '06:05 PM', jamat: '06:10 PM' },
    { name: lang === 'bn' ? 'এশা' : 'Isha', azan: '07:45 PM', jamat: '08:00 PM' },
    { name: lang === 'bn' ? 'জুমা' : 'Jumma', azan: '12:45 PM', jamat: '01:30 PM' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 relative">
      {/* ট্রানজ্যাকশন হিস্ট্রি অ্যানিমেটেড পপআপ মডাল */}
      {historyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b">
              <div className="flex items-center gap-2">
                {historyModal === 'income' ? (
                  <ArrowUpRight className="text-emerald-600" size={22} />
                ) : (
                  <ArrowDownLeft className="text-rose-600" size={22} />
                )}
                <div>
                  <h3 className="font-black text-slate-900 text-sm md:text-base">
                    {historyModal === 'income' 
                      ? (lang === 'bn' ? 'সকল অনুদান ও জমার তালিকা' : 'Income & Donation History') 
                      : (lang === 'bn' ? 'মসজিদের খরচসমূহের তালিকা' : 'Expense History')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? `মোট রেকর্ড: ${modalTransactions.length} টি` : `Total entries: ${modalTransactions.length}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto mt-3 flex flex-col gap-2.5 pr-1">
              {modalTransactions.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-bold">
                  {lang === 'bn' ? 'কোনো লেনদেন রেকর্ড পাওয়া যায়নি।' : 'No records found.'}
                </div>
              ) : (
                modalTransactions.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.category}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : 'N/A'}
                      </div>
                    </div>
                    <div className={`font-black text-sm ${historyModal === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {historyModal === 'income' ? '+' : '-'} ₹{Number(item.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* হেডার ব্যানার */}
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

          {/* ইংরেজি সময়, হিজরি ও বাংলা তারিখ বার */}
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
        
        {/* জুমার দিনের ব্যানার */}
        {dates.isFriday && (
          <section className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 text-white p-4 rounded-3xl shadow-md flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">
                ✨
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide">
                  {lang === 'bn' ? 'পবিত্র জুম্মা মুবারক!' : 'Jumma Mubarak!'}
                </h3>
                <p className="text-xs text-amber-100 font-medium">
                  {lang === 'bn' ? 'আজকের বরকতময় দিনে আল্লাহ আমাদের নামাজ ও নেক আমল কবুল করুন।' : 'May Allah accept your prayers on this blessed day.'}
                </p>
              </div>
            </div>
            <Sparkles className="text-amber-200 hidden md:block" size={24} />
          </section>
        )}

        {/* নামাজের সময়সূচি (Prayer Times Table) */}
        <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b pb-2.5">
            <h2 className="text-sm md:text-base font-black flex items-center gap-2 text-slate-800">
              <Clock size={18} className="text-emerald-600" />
              {lang === 'bn' ? 'দৈনিক পাঁচ ওয়াক্ত নামাজের সময়সূচি' : 'Daily Prayer Times'}
            </h2>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              {lang === 'bn' ? 'জামাআত ও আযান' : 'Adhan & Jamat'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            {prayerTimes.map((p, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl hover:border-emerald-300 transition">
                <div className="font-black text-xs text-emerald-800 mb-1">{p.name}</div>
                <div className="text-[10px] text-slate-500">
                  {lang === 'bn' ? 'আযান:' : 'Azan:'} <span className="font-semibold text-slate-700">{p.azan}</span>
                </div>
                <div className="text-[11px] font-black text-slate-900 mt-1 bg-white rounded-lg py-1 border border-slate-100 shadow-xs">
                  {p.jamat}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* বর্তমান অবশিষ্ট ফান্ড ব্যালেন্স কার্ড */}
        <section className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-900 text-white p-5 rounded-3xl shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Wallet size={24} className="text-amber-300" />
            </div>
            <div>
              <span className="text-xs text-emerald-200 font-bold uppercase tracking-wider">
                {lang === 'bn' ? 'বর্তমানে মসজিদে অবশিষ্ট ফান্ড' : 'Current Net Fund Balance'}
              </span>
              <div className="text-2xl md:text-3xl font-black tracking-tight text-white mt-0.5">
                ₹ {animatedBalance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] bg-amber-400 text-slate-900 font-black px-2.5 py-1 rounded-full shadow-xs">
              {lang === 'bn' ? 'হিসাব লাইভ' : 'Live Balance'}
            </span>
          </div>
        </section>

        {/* মোট আয় ও ব্যয় কার্ড (ক্লিক করলে অ্যানিমেটেড হিস্ট্রি খুলবে) */}
        <section className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => setHistoryModal('income')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-500 hover:shadow-md transition active:scale-[0.98]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase">
                <TrendingUp size={16} className="text-emerald-500" />
                {lang === 'bn' ? 'মোট অনুদান' : 'Total Income'}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                {lang === 'bn' ? 'হিস্ট্রি দেখুন ↗' : 'View ↗'}
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900">
              ₹ {animatedIncome.toLocaleString('en-IN')}
            </div>
          </div>

          <div 
            onClick={() => setHistoryModal('expense')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-rose-500 hover:shadow-md transition active:scale-[0.98]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase">
                <TrendingDown size={16} className="text-rose-500" />
                {lang === 'bn' ? 'মোট খরচ' : 'Total Expense'}
              </div>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                {lang === 'bn' ? 'হিস্ট্রি দেখুন ↗' : 'View ↗'}
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900">
              ₹ {animatedExpense.toLocaleString('en-IN')}
            </div>
          </div>
        </section>

        {/* জরুরি নোটিস ও ওয়াজের খবর */}
        <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h2 className="text-sm md:text-base font-black flex items-center gap-2 text-slate-800">
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
