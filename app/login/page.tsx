'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Building2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [phone, setPhone] = useState('');
  const [identityKey, setIdentityKey] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Handle Member Login (Phone + Identity Verification)
  async function handleMemberLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const { data: family, error } = await supabase
        .from('families')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error || !family) {
        setErrorMsg('No registered family found with this mobile number. Please contact the mosque committee.');
        setLoading(false);
        return;
      }

      // Check identity verification if registered
      if (family.aadhaar_masked && identityKey.trim()) {
        const storedClean = String(family.aadhaar_masked).replace(/[^a-zA-Z0-9]/g, '');
        const inputClean = identityKey.trim().replace(/[^a-zA-Z0-9]/g, '');
        if (!storedClean.startsWith(inputClean) && storedClean !== inputClean) {
          setErrorMsg('Verification credential does not match our records.');
          setLoading(false);
          return;
        }
      }

      // Store member session details in localStorage
      localStorage.setItem('member_family_id', family.id);
      localStorage.setItem('member_family_name', family.head_name);
      localStorage.setItem('member_family_phone', family.phone);

      router.push('/member');
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Admin & Imam Login (Supabase Auth)
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const emailToUse = adminEmail.includes('@') ? adminEmail.trim() : `${adminEmail.trim()}@ramrampurmasjid.org`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: adminPassword,
      });

      if (error) {
        setErrorMsg('Invalid login credentials. Please verify your email/ID and password.');
        setLoading(false);
        return;
      }

      // Fetch user profile role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin' || profile?.role === 'imam') {
        router.push('/admin');
      } else {
        setErrorMsg('Access denied. Administrator privileges required.');
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Background Animated Gradient Mesh & Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-600/30 via-teal-500/20 to-transparent blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tl from-amber-500/20 via-emerald-700/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-teal-500/15 blur-2xl pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 z-10">
        
        {/* Floating Top Badge */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <Sparkles size={13} className="text-amber-400" />
            <span>Official Portal Access</span>
          </div>
        </div>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 mb-3 group">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center transition group-hover:bg-slate-900">
              <Building2 size={30} className="text-emerald-400" />
            </div>
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-2xl border-2 border-emerald-400/40 animate-ping opacity-30 pointer-events-none" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            Ramrampur Jame Masjid
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Digital Management & Tracking System
          </p>
        </div>

        {/* Tab Switcher (Member vs Admin) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/70 rounded-2xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { setRole('member'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              role === 'member'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/30 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}>
            <Users size={15} />
            <span>Member Portal</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('admin'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              role === 'admin'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/30 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}>
            <ShieldCheck size={15} />
            <span>Staff / Admin</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={17} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Member Login Form */}
        {role === 'member' && (
          <form onSubmit={handleMemberLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                <span>Identity Code / Passcode</span>
                <span className="text-[11px] text-slate-400">Optional</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="text"
                  placeholder="First 6 digits or passcode"
                  value={identityKey}
                  onChange={(e) => setIdentityKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition disabled:opacity-50">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                <>
                  <span>Sign In as Family Member</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Admin Login Form */}
        {role === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email or User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin@ramrampurmasjid.org"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Secret Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your administrative password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition disabled:opacity-50">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>Access Admin Control Panel</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Home Link */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition">
            <ArrowLeft size={14} />
            <span>Return to Public Homepage</span>
          </Link>
        </div>

        {/* Security Footer Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Secured with 256-bit encrypted authentication</span>
        </div>
      </div>
    </div>
  );
}
