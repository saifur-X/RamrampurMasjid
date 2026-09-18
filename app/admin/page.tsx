'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, LogOut, Shield, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [families, setFamilies] = useState<any[]>([]);
  const [headName, setHeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    checkAdmin();
    loadFamilies();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/login');
    }
  }

  async function loadFamilies() {
    const { data } = await supabase.from('families').select('*').order('created_at', { ascending: false });
    if (data) setFamilies(data);
  }

  async function handleAddFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // পরিবার যুক্ত করা
    const { data: newFamily, error } = await supabase.from('families').insert([
      {
        head_name: headName,
        phone: cleanPhone,
        aadhaar_masked: aadhaar,
      }
    ]).select().single();

    if (error) {
      setMsg('পরিবার যোগ করতে সমস্যা হয়েছে বা মোবাইল নম্বরটি আগে থেকেই রয়েছে।');
      setLoading(false);
      return;
    }

    // ১২ মাসের ডিফল্ট ফি রেকর্ড তৈরি করা (ভাদ্র থেকে শ্রাবণ)
    const bengaliMonths = [
      'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ',
      'ফাল্গুন', 'চৈত্র', 'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ'
    ];

    const feeEntries = bengaliMonths.map((m) => ({
      family_id: newFamily.id,
      year_cycle: '১৪৩১-১৪৩২',
      month_name: m,
      amount: 100.00, // ডিফল্ট ফি
      status: 'unpaid'
    }));

    await supabase.from('fees').insert(feeEntries);

    setHeadName('');
    setPhone('');
    setAadhaar('');
    setMsg('নতুন পরিবার এবং ১২ মাসের ফি তালিকা সফলভাবে তৈরি হয়েছে!');
    setLoading(false);
    loadFamilies();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12">
      {/* অ্যাডমিন হেডার */}
      <header className="bg-emerald-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-amber-400" size={24} />
            <h1 className="text-lg md:text-xl font-black">অ্যাডমিন কন্ট্রোল প্যানেল</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <LogOut size={16} /> লগআউট
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        {/* নতুন পরিবার যোগ করার ফর্ম */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
            <UserPlus size={20} className="text-emerald-600" />
            নতুন পরিবার রেজিস্টার করুন
          </h2>

          {msg && (
            <div className={`p-3 rounded-xl text-xs font-semibold mb-4 text-center ${
              msg.includes('সমস্যা') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleAddFamily} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">পরিবারের প্রধানের নাম</label>
              <input
                type="text"
                required
                placeholder="যেমন: আব্দুর রহমান"
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">মোবাইল নম্বর</label>
              <input
                type="tel"
                required
                placeholder="১০ ডিজিটের মোবাইল নম্বর"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">আধার / পরিচয় নম্বর</label>
              <input
                type="text"
                placeholder="পরিচয় নম্বর"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
              />
            </div>

            <div className="md:col-span-3 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition">
                {loading ? 'সংরক্ষণ হচ্ছে...' : 'পরিবার ও ফি রেকর্ড সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </section>

        {/* রেজিস্টার্ড পরিবারের তালিকা */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
            <Users size={20} className="text-emerald-600" />
            নিবন্ধিত পরিবারসমূহ ({families.length})
          </h2>

          <div className="grid gap-3">
            {families.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">কোনো পরিবার পাওয়া যায়নি।</p>
            ) : (
              families.map((fam) => (
                <div key={fam.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{fam.head_name}</div>
                    <div className="text-xs text-slate-500">ফোন: {fam.phone} | আইডি: {fam.aadhaar_masked || 'দেওয়া নেই'}</div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded">
                    সক্রিয়
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
