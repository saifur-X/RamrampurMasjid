'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getWhatsAppUrl, generateReceiptPDF } from '@/lib/whatsapp';
import { 
  Users, UserPlus, LogOut, Shield, Wallet, 
  CheckCircle, AlertCircle, Plus, Building2, 
  Edit2, X, Bell, TrendingUp, MessageCircle, 
  ChevronDown, ChevronUp, Check, Percent, DollarSign, Trash2
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'families' | 'fees' | 'funds' | 'notices' | 'settings'>('fees');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // ডেটা স্টেটসমূহ
  const [families, setFamilies] = useState<any[]>([]);
  const [allFees, setAllFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);

  // মসজিদ প্রোফাইল স্টেট
  const [mosqueProfile, setMosqueProfile] = useState<any>({
    name: '', address: '', upi_id: '', bank_details: '',
    imam_name: '', imam_phone: '', secretary_name: '', cashier_name: ''
  });

  // ফর্ম স্টেটসমূহ
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [headName, setHeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [feeAmount, setFeeAmount] = useState('100');

  // ইউনিভার্সাল ফি বাড়ানোর স্টেট
  const [incType, setIncType] = useState<'fixed' | 'percent'>('fixed');
  const [incValue, setIncValue] = useState('');

  // ফান্ড স্টেট
  const [transType, setTransType] = useState<'income' | 'expense'>('income');
  const [transCategory, setTransCategory] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transDesc, setTransDesc] = useState('');

  // নোটিস স্টেট
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

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
      .order('created_at', { ascending: true });
    if (feeData) setAllFees(feeData);

    // ফান্ড হিসাব
    const { data: transData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (transData) setTransactions(transData);

    // নোটিস তালিকা
    const { data: noticeData } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (noticeData) setNotices(noticeData);

    // মসজিদ প্রোফাইল
    const { data: mProfile } = await supabase.from('mosque_profile').select('*').limit(1).maybeSingle();
    if (mProfile) setMosqueProfile(mProfile);
  }

  // ১. পরিবার সেভ ও ১২ মাসের ভাদ্র-আশ্বিন সাইকেল ফি তৈরি
  async function handleFamilySubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (editingFamilyId) {
      const { error } = await supabase.from('families').update({
        head_name: headName,
        phone: cleanPhone,
        aadhaar_masked: aadhaar,
      }).eq('id', editingFamilyId);

      if (!error) {
        setMsg('পরিবারের তথ্য সফলভাবে সংশোধন করা হয়েছে!');
        resetFamilyForm();
        loadAllData();
      } else {
        setMsg('পরিবার সংশোধন করতে সমস্যা হয়েছে।');
      }
    } else {
      const { data: newFamily, error } = await supabase.from('families').insert([
        { head_name: headName, phone: cleanPhone, aadhaar_masked: aadhaar }
      ]).select().single();

      if (error) {
        setMsg('পরিবার যোগ করতে সমস্যা হয়েছে বা মোবাইল নম্বরটি আগে থেকেই রয়েছে।');
        setLoading(false);
        return;
      }

      // ভাদ্র থেকে শ্রাবণ চক্রের ১২ মাস (ইংরেজি সমতুল্য মাসসহ)
      const bengaliCycle = [
        { bn: 'ভাদ্র', en: 'আগস্ট-সেপ্টেম্বর' },
        { bn: 'আশ্বিন', en: 'সেপ্টেম্বর-অক্টোবর' },
        { bn: 'কার্তিক', en: 'অক্টোবর-নভেম্বর' },
        { bn: 'অগ্রহায়ণ', en: 'নভেম্বর-ডিসেম্বর' },
        { bn: 'পৌষ', en: 'ডিসেম্বর-জানুয়ারি' },
        { bn: 'মাঘ', en: 'জানুয়ারি-ফেব্রুয়ারি' },
        { bn: 'ফাল্গুন', en: 'ফেব্রুয়ারি-মার্চ' },
        { bn: 'চৈত্র', en: 'মার্চ-এপ্রিল' },
        { bn: 'বৈশাখ', en: 'এপ্রিল-মে' },
        { bn: 'জ্যৈষ্ঠ', en: 'মে-জুন' },
        { bn: 'আষাঢ়', en: 'জুন-জুলাই' },
        { bn: 'শ্রাবণ', en: 'জুলাই-আগস্ট' },
      ];

      const feeEntries = bengaliCycle.map((m) => ({
        family_id: newFamily.id,
        year_cycle: '১৪৩১-১৪৩২ বঙ্গাব্দ (2024-2025)',
        month_name: `${m.bn} (${m.en})`,
        amount: parseFloat(feeAmount) || 100.00,
        status: 'unpaid'
      }));

      await supabase.from('fees').insert(feeEntries);
      resetFamilyForm();
      setMsg('নতুন পরিবার এবং ১২ মাসের বাৎসরিক ফি রেকর্ড তৈরি হয়েছে!');
      loadAllData();
    }
    setLoading(false);
  }

  function resetFamilyForm() {
    setEditingFamilyId(null);
    setHeadName('');
    setPhone('');
    setAadhaar('');
    setFeeAmount('100');
  }

  // ২. একক মাস ফি Paid করা এবং WhatsApp পাঠানো
  async function markSingleFeePaid(fee: any) {
    const receipt = `REC-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from('fees').update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      receipt_no: receipt
    }).eq('id', fee.id);

    if (!error) {
      const msgText = `আসসালামু আলাইকুম ${fee.families.head_name} সাহেব। আপনার মসজিদের ${fee.month_name} মাসের ফি ₹${fee.amount} গৃহীত হয়েছে। রসিদ নং: ${receipt}। ধন্যবাদ।`;
      const url = getWhatsAppUrl(fee.families.phone, msgText);
      window.open(url, '_blank');
      loadAllData();
    }
  }

  // ৩. এক ক্লিকে সম্পূর্ণ বাৎসরিক ফি একসাথে পেইড করা
  async function markYearlyPaid(familyId: string, famHead: string, famPhone: string) {
    const unpaidList = allFees.filter(f => f.family_id === familyId && f.status === 'unpaid');
    if (unpaidList.length === 0) {
      alert('এই পরিবারের সকল মাসের ফি আগেই পরিশোধিত রয়েছে!');
      return;
    }

    if (!confirm(`${famHead} সাহেবের সম্পূর্ণ বছরের বকেয়া ফি একসাথে পেইড করতে চান?`)) return;

    setLoading(true);
    const receipt = `YEAR-${Date.now().toString().slice(-6)}`;
    const totalYearly = unpaidList.reduce((acc, c) => acc + Number(c.amount), 0);

    for (const f of unpaidList) {
      await supabase.from('fees').update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        receipt_no: `${receipt}-${f.month_name.slice(0, 3)}`
      }).eq('id', f.id);
    }

    const msgText = `আসসালামু আলাইকুম ${famHead} সাহেব। আপনার পরিবারের সম্পূর্ণ বাৎসরিক ইমাম ফি বাবদ মোট ₹${totalYearly}/- পরিশোধিত হিসেবে গৃহীত হয়েছে। রসিদ ভাউচার: ${receipt}। জাযাকাল্লাহু খাইরান।`;
    const url = getWhatsAppUrl(famPhone, msgText);
    window.open(url, '_blank');

    setLoading(false);
    setMsg(`${famHead} সাহেবের বাৎসরিক ফি পরিশোধ সম্পন্ন হয়েছে!`);
    loadAllData();
  }

  // ৪. ইউনিভার্সাল ফি বৃদ্ধি (সবার জন্য একসাথে টাকা বা শতকরা বাড়ানো)
  async function handleUniversalFeeIncrease(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(incValue);
    if (!val || val <= 0) {
      alert('সঠিক সংখ্যা ইনপুট দিন!');
      return;
    }

    if (!confirm(`আপনি কি নিশ্চিত যে সকল পরিবারের বকেয়া ফি ${incType === 'fixed' ? `₹${val} টাকা` : `${val}%`} বাড়াতে চান?`)) {
      return;
    }

    setLoading(true);
    const unpaidFees = allFees.filter(f => f.status === 'unpaid');

    for (const f of unpaidFees) {
      let newAmt = Number(f.amount);
      if (incType === 'fixed') {
        newAmt += val;
      } else {
        newAmt += (newAmt * (val / 100));
      }
      newAmt = Math.round(newAmt * 100) / 100;

      await supabase.from('fees').update({ amount: newAmt }).eq('id', f.id);
    }

    setLoading(false);
    setIncValue('');
    setMsg('সকল পরিবারের ফিতে সফলভাবে পরিবর্তন প্রয়োগ করা হয়েছে!');
    loadAllData();
  }

  // ৫. নির্দিষ্ট মাসের ফি ম্যানুয়ালি এডিট করা
  async function editSingleFee(feeId: string, currentAmt: number) {
    const promptVal = prompt('নতুন ফি পরিমাণ (টাকা) লিখুন:', currentAmt.toString());
    if (!promptVal || isNaN(Number(promptVal))) return;

    await supabase.from('fees').update({ amount: parseFloat(promptVal) }).eq('id', feeId);
    loadAllData();
  }

  // ৬. নোটিস পাবলিশ ও ডিলিট
  async function handlePublishNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;
    setLoading(true);

    const { error } = await supabase.from('notices').insert([
      { title: noticeTitle, content: noticeContent }
    ]);

    if (!error) {
      setMsg('জরুরি নোটিস সফলভাবে ওয়েবসাইটে প্রকাশিত হয়েছে!');
      setNoticeTitle('');
      setNoticeContent('');
      loadAllData();
    }
    setLoading(false);
  }

  async function handleDeleteNotice(id: string) {
    if (!confirm('নোটিসটি মুছে ফেলতে চান?')) return;
    await supabase.from('notices').delete().eq('id', id);
    loadAllData();
  }

  // ৭. ফান্ড হিসাব সেভ
  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('transactions').insert([
      { type: transType, category: transCategory, amount: parseFloat(transAmount), description: transDesc }
    ]);
    if (!error) {
      setMsg('ফান্ড লেনদেন সফলভাবে সংরক্ষিত হয়েছে!');
      setTransCategory('');
      setTransAmount('');
      setTransDesc('');
      loadAllData();
    }
    setLoading(false);
  }

  // ৮. মসজিদ প্রোফাইল সংরক্ষণ
  async function handleSaveMosqueProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let res;
    if (mosqueProfile.id) {
      res = await supabase.from('mosque_profile').update(mosqueProfile).eq('id', mosqueProfile.id);
    } else {
      res = await supabase.from('mosque_profile').insert([mosqueProfile]);
    }
    if (!res?.error) {
      setMsg('মসজিদ প্রোফাইল সফলভাবে আপডেট হয়েছে!');
      loadAllData();
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
              <h1 className="text-lg md:text-xl font-black">অ্যাডমিন সুপার কন্ট্রোল</h1>
              <p className="text-[11px] text-emerald-200">মসজিদ, ইমাম ফি ও ঘোষণা ব্যবস্থাপনা</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
            <LogOut size={16} /> লগআউট
          </button>
        </div>

        {/* ট্যাব নেভিগেশন */}
        <div className="max-w-4xl mx-auto flex gap-2 mt-4 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('fees'); setMsg(''); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'fees' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <CheckCircle size={16} /> বাৎসরিক ইমাম ফি ও পেমেন্ট
          </button>
          <button
            onClick={() => { setActiveTab('families'); setMsg(''); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'families' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <Users size={16} /> পরিবারসমূহ
          </button>
          <button
            onClick={() => { setActiveTab('notices'); setMsg(''); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'notices' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <Bell size={16} /> নোটিস ও ওয়াজের খবর
          </button>
          <button
            onClick={() => { setActiveTab('funds'); setMsg(''); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'funds' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <Wallet size={16} /> ফান্ড হিসাব
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setMsg(''); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
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

        {/* ট্যাব ১: বাৎসরিক ইমাম ফি ট্র্যাকার, পেমেন্ট ও ইউনিভার্সাল বৃদ্ধি */}
        {activeTab === 'fees' && (
          <div className="flex flex-col gap-5">
            {/* ইউনিভার্সাল ফি বৃদ্ধি কার্ড */}
            <section className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-amber-400" />
                ইউনিভার্সাল ফি বৃদ্ধির টুল (সকল পরিবারের ফি একসাথে পরিবর্তন করুন)
              </h2>
              <p className="text-xs text-emerald-200 mb-3">
                প্রত্যেক পরিবারের আনপেইড মাসের ফিতে নির্দিষ্ট টাকা বা নির্দিষ্ট শতাংশ স্বয়ংক্রিয়ভাবে বৃদ্ধি পাবে।
              </p>

              <form onSubmit={handleUniversalFeeIncrease} className="flex flex-wrap items-center gap-2">
                <div className="flex bg-emerald-950/50 p-1 rounded-xl border border-white/20 text-xs">
                  <button
                    type="button"
                    onClick={() => setIncType('fixed')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
                      incType === 'fixed' ? 'bg-amber-400 text-slate-900' : 'text-emerald-200'
                    }`}>
                    <DollarSign size={14} /> ফিক্সড টাকা (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncType('percent')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
                      incType === 'percent' ? 'bg-amber-400 text-slate-900' : 'text-emerald-200'
                    }`}>
                    <Percent size={14} /> শতাংশ (%)
                  </button>
                </div>

                <input
                  type="number"
                  required
                  placeholder={incType === 'fixed' ? 'যেমন: ১০ টাকা' : 'যেমন: ৫%'}
                  value={incValue}
                  onChange={(e) => setIncValue(e.target.value)}
                  className="bg-white text-slate-900 text-sm font-bold px-3 py-2 rounded-xl outline-none w-36"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs px-4 py-2.5 rounded-xl transition shadow">
                  সবার ফিতে বৃদ্ধি প্রয়োগ করুন
                </button>
              </form>
            </section>

            {/* বাৎসরিক ভিউ পরিবার তালিকা */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
                <CheckCircle size={20} className="text-emerald-600" />
                পরিবারভিত্তিক বাৎসরিক ফি হিসাব ও রসিদ
              </h2>

              <div className="flex flex-col gap-4">
                {families.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">কোনো পরিবার যুক্ত করা নেই।</p>
                ) : (
                  families.map((fam) => {
                    const famFees = allFees.filter(f => f.family_id === fam.id);
                    const totalDue = famFees.filter(f => f.status === 'unpaid').reduce((acc, c) => acc + Number(c.amount), 0);
                    const isFullyPaid = famFees.length > 0 && famFees.every(f => f.status === 'paid');
                    const isExpanded = expandedFamily === fam.id;

                    return (
                      <div key={fam.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                        {/* মূল বাৎসরিক সারাংশ কার্ড */}
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-base text-slate-900">{fam.head_name}</h3>
                              <span className="text-xs text-slate-500 font-medium">({fam.phone})</span>
                            </div>
                            <div className="text-xs text-emerald-800 font-semibold mt-1">
                              📅 বাৎসরিক চক্র: ১৪৩১-১৪৩২ বঙ্গাব্দ (আগস্ট ২০২৪ – আগস্ট ২০২৫)
                            </div>
                            <div className="text-xs font-bold mt-0.5">
                              {isFullyPaid ? (
                                <span className="text-emerald-600">✅ সম্পূর্ণ বাৎসরিক ফি পরিশোধিত</span>
                              ) : (
                                <span className="text-rose-600">⚠️ মোট বকেয়া ফি: ₹{totalDue}/-</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isFullyPaid && (
                              <button
                                onClick={() => markYearlyPaid(fam.id, fam.head_name, fam.phone)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow">
                                <Check size={14} /> বাৎসরিক পরিশোধ & WhatsApp
                              </button>
                            )}

                            <button
                              onClick={() => setExpandedFamily(isExpanded ? null : fam.id)}
                              className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                              {isExpanded ? <>মাসিক তালিকা বন্ধ করুন <ChevronUp size={14} /></> : <>মাসিক ব্রেকডাউন <ChevronDown size={14} /></>}
                            </button>
                          </div>
                        </div>

                        {/* ড্রপডাউন: ১২ মাসের বিস্তারিত ব্রেকডাউন */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {famFees.map((fee) => (
                              <div key={fee.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-bold text-slate-800">{fee.month_name}</span>
                                  <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>ফি: ₹{fee.amount}</span>
                                    {fee.status === 'unpaid' && (
                                      <button
                                        onClick={() => editSingleFee(fee.id, fee.amount)}
                                        className="text-[10px] text-blue-600 underline font-semibold">
                                        এডিট
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  {fee.status === 'paid' ? (
                                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                                      পেইড ({fee.receipt_no})
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => markSingleFeePaid(fee)}
                                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1">
                                      Paid & WhatsApp
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* ট্যাব ২: পরিবারসমূহ ও এডিট */}
        {activeTab === 'families' && (
          <>
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
                  {editingFamilyId ? <Edit2 size={20} className="text-amber-500" /> : <UserPlus size={20} className="text-emerald-600" />}
                  {editingFamilyId ? 'পরিবারের তথ্য সংশোধন (Edit)' : 'নতুন পরিবার রেজিস্টার করুন'}
                </h2>
                {editingFamilyId && (
                  <button onClick={resetFamilyForm} className="text-xs bg-slate-200 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
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
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ডিফল্ট মাসিক ফি (₹)</label>
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
                    {loading ? 'সংরক্ষণ হচ্ছে...' : editingFamilyId ? 'পরিবর্তনগুলো সংরক্ষণ করুন' : 'পরিবার ও বাৎসরিক ১২ মাসের ফি রেকর্ড তৈরি করুন'}
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
                        <div className="text-xs text-slate-500">ফোন: {fam.phone} | আধার: {fam.aadhaar_masked ? `${fam.aadhaar_masked.slice(0, 4)}...` : 'নেই'}</div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingFamilyId(fam.id);
                          setHeadName(fam.head_name);
                          setPhone(fam.phone);
                          setAadhaar(fam.aadhaar_masked || '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
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

        {/* ট্যাব ৩: নোটিস ও ওয়াজের খবর ব্যবস্থাপনা (অ্যাডমিন কন্ট্রোল) */}
        {activeTab === 'notices' && (
          <div className="flex flex-col gap-6">
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold flex items-center gap-2 mb-3 text-slate-800">
                <Bell size={20} className="text-emerald-600" />
                নতুন নোটিস বা ওয়াজের খবর পাবলিশ করুন
              </h2>
              <form onSubmit={handlePublishNotice} className="flex flex-col gap-3">
                <input
                  type="text"
                  required
                  placeholder="নোটিসের শিরোনাম (যেমন: আগামী জুমার ওয়াজ ও কালেকশন)"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
                <textarea
                  required
                  placeholder="বিস্তারিত নোটিস বিবরণ লিখুন যা হোমপেজে সবার জন্য প্রদর্শিত হবে..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition">
                  {loading ? 'প্রকাশ হচ্ছে...' : 'নোটিস প্রকাশ করুন'}
                </button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold mb-3 text-slate-800">সকল প্রকাশিত নোটিস ({notices.length})</h2>
              <div className="grid gap-3">
                {notices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">কোনো নোটিস নেই।</p>
                ) : (
                  notices.map((n) => (
                    <div key={n.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{n.title}</div>
                        <div className="text-xs text-slate-600 mt-1">{n.content}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteNotice(n.id)}
                        className="text-rose-600 hover:text-rose-800 p-1.5">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ট্যাব ৪: ফান্ড ও আয়-ব্যয় ট্র্যাকিং */}
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

        {/* ট্যাব ৫: মসজিদ প্রোফাইল ও কমিটি */}
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