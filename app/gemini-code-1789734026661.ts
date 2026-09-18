'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserPlus, LogOut, Shield, Wallet, 
  Settings, CheckCircle, AlertCircle, Plus, Building2
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'families' | 'fees' | 'funds' | 'settings'>('families');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // ডেটা স্টেটসমূহ
  const [families, setFamilies] = useState<any[]>([]);
  const [allFees, setAllFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mosqueProfile, setMosqueProfile] = useState<any>({
    name: '',
    address: '',
    upi_id: '',
    bank_details: ''
  });

  // ফর্ম স্টেটসমূহ
  const [headName, setHeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [feeAmount, setFeeAmount] = useState('100');

  const [transType, setTransType] = useState<'income' | 'expense'>('income');
  const [transCategory, setTransCategory] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transDesc, setTransDesc] = useState('');

  useEffect(() => {
    checkAdmin();
    loadAllData();
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

  async function loadAllData() {
    // পরিবার তালিকা
    const { data: famData } = await supabase.from('families').select('*').order('created_at', { ascending: false });
    if (famData) setFamilies(famData);

    // সব ফি রেকর্ড
    const { data: feeData } = await supabase
      .from('fees')
      .select('*, families(head_name, phone)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (feeData) setAllFees(feeData);

    // ফান্ড ট্রানজ্যাকশন
    const { data: transData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (transData) setTransactions(transData);

    // মসজিদ প্রোফাইল
    const { data: mProfile } = await supabase.from('mosque_profile').select('*').limit(1).single();
    if (mProfile) setMosqueProfile(mProfile);
  }

  // ১. পরিবার যোগ এবং ১২ মাসের ফি তৈরি
  async function handleAddFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const { data: newFamily, error } = await supabase.from('families').insert([
      {
        head_name: headName,
        phone: cleanPhone,
        aadhaar_masked: aadhaar,
      }
    ]).select().single();

    if (error) {
      setMsg('পরিবার যোগ করতে সমস্যা হয়েছে বা মোবাইল নম্বরটি আগে থেকেই আছে।');
      setLoading(false);
      return;
    }

    const bengaliMonths = [
      'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ',
      'ফাল্গুন', 'চৈত্র', 'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ'
    ];

    const feeEntries = bengaliMonths.map((m) => ({
      family_id: newFamily.id,
      year_cycle: '১৪৩১-১৪৩২',
      month_name: m,
      amount: parseFloat(feeAmount) || 100.00,
      status: 'unpaid'
    }));

    await supabase.from('fees').insert(feeEntries);

    setHeadName('');
    setPhone('');
    setAadhaar('');
    setMsg('নতুন পরিবার এবং ১২ মাসের ইমাম ফি সফলভাবে তৈরি হয়েছে!');
    setLoading(false);
    loadAllData();
  }

  // ২. আয় / ব্যয় ফান্ড যোগ
  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const { error } = await supabase.from('transactions').insert([
      {
        type: transType,
        category: transCategory,
        amount: parseFloat(transAmount),
        description: transDesc
      }
    ]);

    if (!error) {
      setMsg('ফান্ড হিসাব সফলভাবে সংরক্ষিত হয়েছে!');
      setTransCategory('');
      setTransAmount('');
      setTransDesc('');
      loadAllData();
    } else {
      setMsg('হিসাব সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
    setLoading(false);
  }

  // ৩. মসজিদ প্রোফাইল সেভ
  async function handleSaveMosqueProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    let error;
    if (mosqueProfile.id) {
      const res = await supabase.from('mosque_profile').update(mosqueProfile).eq('id', mosqueProfile.id);
      error = res.error;
    } else {
      const res = await supabase.from('mosque_profile').insert([mosqueProfile]);
      error = res.error;
    }

    if (!error) {
      setMsg('মসজিদ প্রোফাইল সফলভাবে আপডেট হয়েছে!');
      loadAllData();
    } else {
      setMsg('মসজিদ তথ্য আপডেট করতে সমস্যা হয়েছে।');
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // মোট আয় ও ব্যয় ক্যালকুলেশন
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* হেডার */}
      <header className="bg-emerald-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-amber-400" size={24} />
            <div>
              <h1 className="text-lg md:text-xl font-black">অ্যাডমিন কন্ট্রোল প্যানেল</h1>
              <p className="text-[11px] text-emerald-200">মসজিদ ও আর্থিক ব্যবস্থাপনা</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <LogOut size={16} /> লগআউট
          </button>
        </div>

        {/* ট্যাব নেভিগেশন বার */}
        <div className="max-w-4xl mx-auto flex gap-2 mt-4 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('families'); setMsg(''); }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'families' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <Users size={16} /> পরিবারসমূহ
          </button>
          <button
            onClick={() => { setActiveTab('fees'); setMsg(''); }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'fees' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <CheckCircle size={16} /> ইমাম ফি ট্র্যাকার
          </button>
          <button
            onClick={() => { setActiveTab('funds'); setMsg(''); }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'funds' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <Wallet size={16} /> ফান্ড ও আয়-ব্যয়
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setMsg(''); }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <Building2 size={16} /> মসজিদ প্রোফাইল
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        {/* মেসেজ অ্যালার্ট */}
        {msg && (
          <div className={`p-3 rounded-xl text-xs font-semibold text-center border ${
            msg.includes('সমস্যা') 
              ? 'bg-rose-50 text-rose-600 border-rose-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {msg}
          </div>
        )}

        {/* ট্যাব ১: পরিবার ম্যানেজমেন্ট */}
        {activeTab === 'families' && (
          <>
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
                <UserPlus size={20} className="text-emerald-600" />
                নতুন পরিবার রেজিস্টার করুন
              </h2>
              <form onSubmit={handleAddFamily} className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                    placeholder="১০ ডিজিটের নম্বর"
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
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">মাসিক ফি (₹)</label>
                  <input
                    type="number"
                    required
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                  />
                </div>
                <div className="md:col-span-4 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition">
                    {loading ? 'সংরক্ষণ হচ্ছে...' : 'পরিবার ও বাৎসরিক ১২ মাসের ফি রেকর্ড সংরক্ষণ করুন'}
                  </button>
                </div>
              </form>
            </section>

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
                        <div className="text-xs text-slate-500">ফোন: {fam.phone} | পরিচয়: {fam.aadhaar_masked || 'দেওয়া নেই'}</div>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded">সক্রিয়</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* ট্যাব ২: ইমাম ফি ট্র্যাকার */}
        {activeTab === 'fees' && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
              <CheckCircle size={20} className="text-emerald-600" />
              সকল পরিবারের বাৎসরিক ইমাম ফি হিসাব (সর্বশেষ ৫০টি রেকর্ড)
            </h2>
            <div className="grid gap-2">
              {allFees.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">কোনো ফি রেকর্ড পাওয়া যায়নি।</p>
              ) : (
                allFees.map((fee) => (
                  <div key={fee.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
                    <div>
                      <div className="font-bold text-slate-900">{fee.families?.head_name} ({fee.families?.phone})</div>
                      <div className="text-xs text-slate-500">মাস: {fee.month_name} ({fee.year_cycle}) - ₹{fee.amount}</div>
                    </div>
                    <div>
                      {fee.status === 'paid' ? (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle size={14} /> পেইড ({fee.receipt_no})
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <AlertCircle size={14} /> অপরিশোধিত
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ট্যাব ৩: ফান্ড ও আয়-ব্যয় ট্র্যাকিং */}
        {activeTab === 'funds' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-emerald-600 uppercase mb-1">মোট ফান্ড অনুদান</div>
                <div className="text-2xl font-black text-slate-800">₹ {totalIncome}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-rose-600 uppercase mb-1">মোট ফান্ড খরচ</div>
                <div className="text-2xl font-black text-slate-800">₹ {totalExpense}</div>
              </div>
            </div>

            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
                <Plus size={20} className="text-emerald-600" />
                নতুন আয় বা খরচের হিসাব যোগ করুন
              </h2>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">লেনদেনের ধরণ</label>
                  <select
                    value={transType}
                    onChange={(e: any) => setTransType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50">
                    <option value="income">অনুদান / আয় (Income)</option>
                    <option value="expense">মসজিদ খরচ (Expense)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">খাত / ক্যাটাগরি</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: জুমার কালেকশন / বিদ্যুৎ বিল"
                    value={transCategory}
                    onChange={(e) => setTransCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">টাকার পরিমাণ (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="টাকা"
                    value={transAmount}
                    onChange={(e) => setTransAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">বিবরণ (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="বিস্তারিত বিবরণ..."
                    value={transDesc}
                    onChange={(e) => setTransDesc(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                  />
                </div>
                <div className="md:col-span-3 mt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition">
                    হিসাব সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </section>
          </>
        )}

        {/* ট্যাব ৪: মসজিদ প্রোফাইল ও UPI সেটআপ */}
        {activeTab === 'settings' && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
              <Building2 size={20} className="text-emerald-600" />
              মসজিদের তথ্য ও অনলাইন অনুদান (UPI / ব্যাংক) সেটআপ
            </h2>
            <form onSubmit={handleSaveMosqueProfile} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">মসজিদের পূর্ণ নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রামরামপুর জামে মসজিদ"
                  value={mosqueProfile.name || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">মসজিদের ঠিকানা</label>
                <input
                  type="text"
                  placeholder="গ্রাম, পোস্ট, জেলা"
                  value={mosqueProfile.address || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, address: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">মসজিদের অফিসিয়াল UPI ID (Google Pay / PhonePe)</label>
                <input
                  type="text"
                  placeholder="যেমন: mosque@upi"
                  value={mosqueProfile.upi_id || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, upi_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">ব্যাংক একাউন্ট বিবরণী</label>
                <textarea
                  placeholder="অ্যাকাউন্ট নম্বর, IFSC কোড, ব্যাংকের নাম ইত্যাদি..."
                  value={mosqueProfile.bank_details || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, bank_details: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition mt-2">
                মসজিদের তথ্য সংরক্ষণ করুন
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}