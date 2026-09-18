'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserPlus, LogOut, Shield, Wallet, 
  Settings, CheckCircle, AlertCircle, Plus, Building2, Edit2, X
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
    bank_details: '',
    imam_name: '',
    imam_phone: '',
    secretary_name: '',
    cashier_name: ''
  });

  // পরিবার ফর্ম স্টেটসমূহ (নতুন যোগ ও এডিট)
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [headName, setHeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [feeAmount, setFeeAmount] = useState('100');

  // ফান্ড ফর্ম স্টেটসমূহ
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

    // মসজিদ প্রোফাইল লোড
    const { data: mProfile } = await supabase.from('mosque_profile').select('*').limit(1).maybeSingle();
    if (mProfile) {
      setMosqueProfile({
        id: mProfile.id,
        name: mProfile.name || '',
        address: mProfile.address || '',
        upi_id: mProfile.upi_id || '',
        bank_details: mProfile.bank_details || '',
        imam_name: mProfile.imam_name || '',
        imam_phone: mProfile.imam_phone || '',
        secretary_name: mProfile.secretary_name || '',
        cashier_name: mProfile.cashier_name || ''
      });
    }
  }

  // পরিবার সেভ অথবা এডিট
  async function handleFamilySubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (editingFamilyId) {
      // এডিট মোড
      const { error } = await supabase
        .from('families')
        .update({
          head_name: headName,
          phone: cleanPhone,
          aadhaar_masked: aadhaar,
        })
        .eq('id', editingFamilyId);

      if (error) {
        setMsg('পরিবারের তথ্য সংশোধন করতে সমস্যা হয়েছে।');
      } else {
        setMsg('পরিবারের তথ্য সফলভাবে সংশোধন করা হয়েছে!');
        resetFamilyForm();
        loadAllData();
      }
    } else {
      // নতুন যোগ করার মোড
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

      // ১২ মাসের ফি তালিকা
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

      resetFamilyForm();
      setMsg('নতুন পরিবার এবং ১২ মাসের ইমাম ফি সফলভাবে তৈরি হয়েছে!');
      loadAllData();
    }
    setLoading(false);
  }

  function startEditFamily(fam: any) {
    setEditingFamilyId(fam.id);
    setHeadName(fam.head_name);
    setPhone(fam.phone);
    setAadhaar(fam.aadhaar_masked || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetFamilyForm() {
    setEditingFamilyId(null);
    setHeadName('');
    setPhone('');
    setAadhaar('');
    setFeeAmount('100');
  }

  // আয় / ব্যয় ফান্ড যোগ
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

  // মসজিদ প্রোফাইল সেভ
  async function handleSaveMosqueProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const payload = {
      name: mosqueProfile.name,
      address: mosqueProfile.address,
      upi_id: mosqueProfile.upi_id,
      bank_details: mosqueProfile.bank_details,
      imam_name: mosqueProfile.imam_name,
      imam_phone: mosqueProfile.imam_phone,
      secretary_name: mosqueProfile.secretary_name,
      cashier_name: mosqueProfile.cashier_name,
      updated_at: new Date().toISOString()
    };

    let res;
    if (mosqueProfile.id) {
      res = await supabase.from('mosque_profile').update(payload).eq('id', mosqueProfile.id);
    } else {
      res = await supabase.from('mosque_profile').insert([payload]);
    }

    if (!res.error) {
      setMsg('মসজিদের তথ্য সফলভাবে সংরক্ষণ ও আপডেট করা হয়েছে!');
      loadAllData();
    } else {
      setMsg('মসজিদ তথ্য আপডেট করতে সমস্যা হয়েছে। SQL পারমিশন চেক করুন।');
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

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
            <Users size={16} /> পরিবারসমূহ ও এডিট
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
            <Building2 size={16} /> মসজিদ প্রোফাইল ও কমিটি
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

        {/* ট্যাব ১: পরিবার ম্যানেজমেন্ট ও এডিট */}
        {activeTab === 'families' && (
          <>
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
                  {editingFamilyId ? <Edit2 size={20} className="text-amber-500" /> : <UserPlus size={20} className="text-emerald-600" />}
                  {editingFamilyId ? 'পরিবারের তথ্য সংশোধন (Edit)' : 'নতুন পরিবার রেজিস্টার করুন'}
                </h2>
                {editingFamilyId && (
                  <button 
                    onClick={resetFamilyForm} 
                    className="text-xs bg-slate-200 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                    <X size={14} /> বাতিল করুন
                  </button>
                )}
              </div>

              <form onSubmit={handleFamilySubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                {!editingFamilyId && (
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
                )}
                <div className="md:col-span-4 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white font-bold py-2.5 rounded-lg text-sm transition ${
                      editingFamilyId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}>
                    {loading ? 'সংরক্ষণ হচ্ছে...' : editingFamilyId ? 'পরিবর্তনগুলো সংরক্ষণ করুন' : 'পরিবার ও বাৎসরিক ১২ মাসের ফি রেকর্ড সংরক্ষণ করুন'}
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
                    <div key={fam.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{fam.head_name}</div>
                        <div className="text-xs text-slate-500">ফোন: {fam.phone} | পরিচয়: {fam.aadhaar_masked ? `${fam.aadhaar_masked.slice(0, 4)}...` : 'দেওয়া নেই'}</div>
                      </div>
                      <button
                        onClick={() => startEditFamily(fam)}
                        className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Edit2 size={14} /> এডিট
                      </button>
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
              সকল পরিবারের বাৎসরিক ইমাম ফি হিসাব
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

        {/* ট্যাব ৩: ফান্ড ও আয়-ব্যয় */}
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

        {/* ট্যাব ৪: মসজিদ প্রোফাইল ও কমিটি তথ্য */}
        {activeTab === 'settings' && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
              <Building2 size={20} className="text-emerald-600" />
              মসজিদের প্রোফাইল, কমিটি ও অনুদান সেটআপ
            </h2>
            <form onSubmit={handleSaveMosqueProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
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
                <label className="text-xs font-semibold text-slate-600 block mb-1">ইমাম সাহেবের নাম</label>
                <input
                  type="text"
                  placeholder="ইমাম সাহেবের নাম"
                  value={mosqueProfile.imam_name || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, imam_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">ইমাম সাহেবের মোবাইল নম্বর</label>
                <input
                  type="tel"
                  placeholder="ইমাম সাহেবের ফোন নম্বর"
                  value={mosqueProfile.imam_phone || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, imam_phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">সেক্রেটারির নাম</label>
                <input
                  type="text"
                  placeholder="কমিটির সেক্রেটারির নাম"
                  value={mosqueProfile.secretary_name || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, secretary_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">ক্যাশিয়ারের নাম</label>
                <input
                  type="text"
                  placeholder="কমিটির ক্যাশিয়ারের নাম"
                  value={mosqueProfile.cashier_name || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, cashier_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">অফিসিয়াল UPI ID (Google Pay / PhonePe)</label>
                <input
                  type="text"
                  placeholder="যেমন: mosque@upi"
                  value={mosqueProfile.upi_id || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, upi_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">ব্যাংক একাউন্ট বিবরণী</label>
                <textarea
                  placeholder="অ্যাকাউন্ট নম্বর, IFSC কোড, ব্যাংকের নাম ইত্যাদি..."
                  value={mosqueProfile.bank_details || ''}
                  onChange={(e) => setMosqueProfile({ ...mosqueProfile, bank_details: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                  rows={2}
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition mt-1">
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'মসজিদের তথ্য ও কমিটি সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}