'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Phone, LogIn } from 'lucide-react';

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

    // মোবাইল নম্বরকে ব্যাকএন্ড আইডেন্টিফায়ারে রূপান্তর
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const authEmail = `${cleanPhone}@mosque.local`;

    // Supabase Auth লগইন রিকোয়েস্ট
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: password,
    });

    if (authError || !authData.user) {
      setErrorMsg('ভুল মোবাইল নম্বর অথবা পাসওয়ার্ড!');
      setLoading(false);
      return;
    }

    // প্রোফাইল থেকে ইউজার রোল চেক করা
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    setLoading(false);

    if (profileError || !profile) {
      setErrorMsg('প্রোফাইল লোড করতে সমস্যা হয়েছে।');
      return;
    }

    // রোল অনুযায়ী পেজ রিডাইরেক্ট
    if (profile.role === 'admin') {
      router.push('/admin');
    } else if (profile.role === 'imam') {
      router.push('/imam');
    } else {
      router.push('/member');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
            <LogIn size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">লগইন করুন</h1>
          <p className="text-xs text-slate-500 mt-1">মেম্বার, ইমাম ও অ্যাডমিন প্যানেল</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-600 p-2 rounded text-xs mb-4 text-center border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">মোবাইল নম্বর</label>
            <div className="flex items-center border rounded-lg p-2 bg-slate-50">
              <Phone size={18} className="text-slate-400 mr-2" />
              <input
                type="tel"
                required
                placeholder="যেমন: 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">পাসওয়ার্ড</label>
            <div className="flex items-center border rounded-lg p-2 bg-slate-50">
              <Lock size={18} className="text-slate-400 mr-2" />
              <input
                type="password"
                required
                placeholder="আপনার গোপন পাসওয়ার্ড"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-emerald-700 transition disabled:opacity-50 mt-2">
            {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}