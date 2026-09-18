'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
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
      router.push('/member');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">লগইন প্যানেল</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">মেম্বার, ইমাম ও অ্যাডমিন ম্যানেজমেন্ট</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">মোবাইল নম্বর</label>
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
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

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">পাসওয়ার্ড</label>
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
              <Lock size={18} className="text-slate-400 mr-2" />
              <input
                type="password"
                required
                placeholder="আপনার পাসওয়ার্ড"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent w-full outline-none text-sm font-semibold text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 mt-2">
            {loading ? 'লগইন হচ্ছে...' : <>লগইন করুন <ArrowRight size={16} /></>}
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