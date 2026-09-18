'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Phone, ArrowRight, ShieldCheck, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'member' | 'staff'>('member');
  const [phone, setPhone] = useState('');
  const [aadhaarFirst6, setAadhaarFirst6] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // ১. সাধারণ মেম্বার লগইন (মোবাইল নম্বর + আধারের প্রথম ৬ ডিজিট)
    if (loginType === 'member') {
      if (aadhaarFirst6.length < 6) {
        setErrorMsg('আধারের প্রথম ৬টি সংখ্যা সঠিকভাবে লিখুন।');
        setLoading(false);
        return;
      }

      // ডেটাবেস থেকে পরিবার খোঁজা
      const { data: family, error } = await supabase
        .from('families')
        .select('*')
        .eq('phone', cleanPhone)
        .single();

      if (error || !family) {
        setErrorMsg('এই মোবাইল নম্বরে কোনো পরিবার নিবন্ধিত পাওয়া যায়নি।');
        setLoading(false);
        return;
      }

      // আধারের প্রথম ৬ ডিজিট ম্যাচ করানো
      const storedAadhaar = (family.aadhaar_masked || '').replace(/[^0-9]/g, '');
      if (storedAadhaar.slice(0, 6) !== aadhaarFirst6) {
        setErrorMsg('মোবাইল নম্বর অথবা আধারের প্রথম ৬ ডিজিট মেলেনি!');
        setLoading(false);
        return;
      }

      // সেশনে পরিবারের তথ্য সংরক্ষণ করে ড্যাশবোর্ডে রিডাইরেক্ট
      localStorage.setItem('member_family_id', family.id);
      localStorage.setItem('member_family_name', family.head_name);
      localStorage.setItem('member_family_phone', family.phone);

      setLoading(false);
      router.push('/member');
    } 
    // ২. ইমাম ও অ্যাডমিন লগইন (Supabase Auth)
    else {
      const authEmail = `${cleanPhone}@mosque.local`;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password,
      });

      if (authError || !authData.user) {
        setErrorMsg('ভুল মোবাইল নম্বর অথবা পাসওয়ার্ড!');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      setLoading(false);

      if (profile?.role === 'admin') {
        router.push('/admin');
      } else if (profile?.role === 'imam') {
        router.push('/imam');
      } else {
        setErrorMsg('অননুমোদিত অ্যাক্সেস।');
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
        
        {/* লোগো ও শিরোনাম */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-800">লগইন প্যানেল</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">মসজিদ সেবা পোর্টাল</p>
        </div>

        {/* ট্যাব সিলেকশন (মেম্বার বনাম ইমাম/অ্যাডমিন) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => { setLoginType('member'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              loginType === 'member' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
            }`}>
            <Users size={16} /> সদস্য / পরিবার লগইন
          </button>
          <button
            type="button"
            onClick={() => { setLoginType('staff'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              loginType === 'staff' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
            }`}>
            <Shield size={16} /> ইমাম / অ্যাডমিন
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-3 py-2 rounded-xl text-xs font-semibold mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">নিবন্ধিত মোবাইল নম্বর</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
              <Phone size={18} className="text-slate-400 mr-2" />
              <input
                type="tel"
                required
                placeholder="১০ ডিজিটের ফোন নম্বর"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent w-full outline-none text-sm font-semibold text-slate-800"
              />
            </div>
          </div>

          {loginType === 'member' ? (
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">আধারের প্রথম ৬ ডিজিট</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
                <Lock size={18} className="text-slate-400 mr-2" />
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="প্রথম ৬টি সংখ্যা"
                  value={aadhaarFirst6}
                  onChange={(e) => setAadhaarFirst6(e.target.value.replace(/[^0-9]/g, ''))}
                  className="bg-transparent w-full outline-none text-sm font-semibold text-slate-800"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">পাসওয়ার্ড মনে রাখার প্রয়োজন নেই, আধার কার্ড দেখে প্রথম ৬টি সংখ্যা দিন।</p>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">অফিসিয়াল পাসওয়ার্ড</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
                <Lock size={18} className="text-slate-400 mr-2" />
                <input
                  type="password"
                  required
                  placeholder="গোপন পাসওয়ার্ড"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent w-full outline-none text-sm font-semibold text-slate-800"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-2">
            {loading ? 'যাচাই করা হচ্ছে...' : <>লগইন করুন <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs font-bold text-emerald-700 hover:underline">
            ← মূল পেজে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
