'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getWhatsAppUrl, generateReceiptPDF } from '@/lib/whatsapp';
import { 
  Users, UserPlus, LogOut, Shield, Wallet, 
  CheckCircle, AlertCircle, Plus, Building2, 
  Edit2, X, Bell, TrendingUp, Download,
  Check, Trash2, HelpCircle, Search
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'fees' | 'families' | 'notices' | 'funds' | 'settings'>('fees');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Data States
  const [families, setFamilies] = useState<any[]>([]);
  const [allFees, setAllFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Mosque Profile State
  const [mosqueProfile, setMosqueProfile] = useState<any>({
    name: '', address: '', upi_id: '', bank_details: '',
    imam_name: '', imam_phone: '', secretary_name: '', cashier_name: ''
  });

  // Custom Animated Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
  });

  // Family Form States
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [headName, setHeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('100');

  // Universal Fee Increment States
  const [incType, setIncType] = useState<'fixed' | 'percent'>('fixed');
  const [incValue, setIncValue] = useState('');

  // Notice & Fund States
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
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
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') router.push('/login');
  }

  async function loadAllData() {
    const { data: famData } = await supabase.from('families').select('*').order('created_at', { ascending: false });
    if (famData) setFamilies(famData);

    const { data: feeData } = await supabase.from('fees').select('*, families(head_name, phone)').order('created_at', { ascending: true });
    if (feeData) setAllFees(feeData);

    const { data: transData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (transData) setTransactions(transData);

    const { data: noticeData } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (noticeData) setNotices(noticeData);

    const { data: mProfile } = await supabase.from('mosque_profile').select('*').limit(1).maybeSingle();
    if (mProfile) setMosqueProfile(mProfile);
  }

  // Real-time Family Search (Name, Phone, Aadhaar)
  const filteredFamilies = useMemo(() => {
    if (!searchQuery.trim()) return families;
    const q = searchQuery.toLowerCase().trim();
    return families.filter((fam) => {
      const nameMatch = (fam.head_name || '').toLowerCase().includes(q);
      const phoneMatch = (fam.phone || '').includes(q);
      const aadhaarMatch = (fam.aadhaar_masked || '').toLowerCase().includes(q);
      return nameMatch || phoneMatch || aadhaarMatch;
    });
  }, [families, searchQuery]);

  // Family Save or Edit
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

      const bengaliMonths = [
        'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ',
        'ফাল্গুন', 'চৈত্র', 'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ'
      ];

      const feeEntries = bengaliMonths.map((m) => ({
        family_id: newFamily.id,
        year_cycle: '১৪৩১-১৪৩২',
        month_name: m,
        amount: parseFloat(monthlyFee) || 100.00,
        status: 'unpaid'
      }));

      await supabase.from('fees').insert(feeEntries);
      resetFamilyForm();
      setMsg('নতুন পরিবার এবং বাৎসরিক ১২ মাসের ফি তৈরি হয়েছে!');
      loadAllData();
    }
    setLoading(false);
  }

  function resetFamilyForm() {
    setEditingFamilyId(null);
    setHeadName('');
    setPhone('');
    setAadhaar('');
    setMonthlyFee('100');
  }

  // Delete Family
  function handleDeleteFamily(fam: any) {
    setConfirmModal({
      isOpen: true,
      title: 'পরিবার ডিলিট নিশ্চিতকরণ',
      description: `আপনি কি নিশ্চিত যে ${fam.head_name} সাহেবের পরিবার এবং তাদের সকল ফি রেকর্ড মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।`,
      action: async () => {
        setLoading(true);
        const { error } = await supabase.from('families').delete().eq('id', fam.id);
        setLoading(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        if (!error) {
          setMsg(`${fam.head_name} সাহেবের পরিবার সফলভাবে ডিলিট করা হয়েছে!`);
          loadAllData();
        } else {
          setMsg('পরিবার ডিলিট করতে সমস্যা হয়েছে।');
        }
      }
    });
  }

  // Edit Family Monthly Fee
  async function handleEditFamilyFee(fam: any, currentFee: number) {
    const newAmountStr = prompt(`${fam.head_name} সাহেবের জন্য নতুন মাসিক ফি পরিমাণ লিখুন:`, currentFee.toString());
    if (!newAmountStr || isNaN(Number(newAmountStr))) return;

    const newAmount = parseFloat(newAmountStr);
    setLoading(true);

    const { error } = await supabase
      .from('fees')
      .update({ amount: newAmount })
      .eq('family_id', fam.id)
      .eq('status', 'unpaid');

    setLoading(false);

    if (!error) {
      setMsg(`${fam.head_name} সাহেবের বকেয়া ফি সফলভাবে প্রতি মাসে ₹${newAmount} করা হয়েছে!`);
      loadAllData();
    } else {
      setMsg('ফি সংশোধন করতে সমস্যা হয়েছে।');
    }
  }

  // Full Yearly Paid in Bulk
  function triggerYearlyPaidModal(fam: any, unpaidList: any[]) {
    const totalDue = unpaidList.reduce((acc, c) => acc + Number(c.amount), 0);
    const mRate = Number(unpaidList[0]?.amount || 0);

    setConfirmModal({
      isOpen: true,
      title: 'বাৎসরিক ফি পরিশোধ নিশ্চিতকরণ',
      description: `${fam.head_name} সাহেবের সম্পূর্ণ বাৎসরিক বকেয়া ফি (₹${totalDue}) পরিশোধিত হিসেবে গ্রহণ ও WhatsApp রসিদ পাঠাতে চান?`,
      action: async () => {
        setLoading(true);
        const receipt = `REC-${Date.now().toString().slice(-6)}`;
        const paidTime = new Date().toISOString();
        const unpaidIds = unpaidList.map(item => item.id);

        const { error } = await supabase
          .from('fees')
          .update({
            status: 'paid',
            paid_date: paidTime,
            receipt_no: receipt
          })
          .in('id', unpaidIds);

        if (error) {
          setMsg('ফি আপডেট করতে সমস্যা হয়েছে।');
          setLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          return;
        }

        const msgText = `আসসালামু আলাইকুম ${fam.head_name} সাহেব। আপনার পরিবারের সম্পূর্ণ বাৎসরিক ইমাম ফি বাবদ মোট ₹${totalDue}/- গৃহীত হয়েছে। অফিসিয়াল রসিদ নং: ${receipt}। জাযাকাল্লাহু খাইরান। - ${mosqueProfile.name || 'মসজিদ কমিটি'}`;
        const url = getWhatsAppUrl(fam.phone, msgText);
        window.open(url, '_blank');

        setLoading(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setMsg(`${fam.head_name} সাহেবের বাৎসরিক ফি পরিশোধ সম্পন্ন হয়েছে!`);
        loadAllData();
      }
    });
  }

  // Download Receipt
  function downloadYearlyReceipt(fam: any, famFees: any[]) {
    const paidList = famFees.filter(f => f.status === 'paid');
    const total = paidList.reduce((acc, c) => acc + Number(c.amount), 0);
    const rNo = paidList[0]?.receipt_no || `REC-${fam.id.slice(0, 6)}`;
    const pDate = paidList[0]?.paid_date ? new Date(paidList[0].paid_date).toLocaleDateString('en-GB') : 'Paid';

    generateReceiptPDF({
      receiptNo: rNo,
      headName: fam.head_name,
      phone: fam.phone,
      yearCycle: '1431-1432 BS',
      monthlyRate: Number(paidList[0]?.amount || 0),
      totalAmount: total,
      paidDate: pDate,
      mosqueName: mosqueProfile.name,
      mosqueAddress: mosqueProfile.address,
      imamName: mosqueProfile.imam_name,
      secretaryName: mosqueProfile.secretary_name
    });
  }

  // Universal Fee Increment
  function handleUniversalFeeIncrease(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(incValue);
    if (!val || val <= 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'সকলের ফি বৃদ্ধি নিশ্চিতকরণ',
      description: `আপনি কি নিশ্চিত যে সকল পরিবারের (কারো ৫০, কারো ১০০ বা ৫০০ যাই থাকুক না কেন) বকেয়া মাসিক ফি ${incType === 'fixed' ? `₹${val} টাকা` : `${val}%`} বৃদ্ধি করতে চান?`,
      action: async () => {
        setLoading(true);
        const { error } = await supabase.rpc('increase_all_fees', {
          inc_type: incType,
          inc_val: val
        });

        setLoading(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        if (error) {
          setMsg('ফি বৃদ্ধি করতে সমস্যা হয়েছে। SQL ফাংশন চেক করুন।');
        } else {
          setIncValue('');
          setMsg(`সফলভাবে সকল পরিবারের ফিতে ${incType === 'fixed' ? `₹${val} টাকা` : `${val}%`} বাড়ানো হয়েছে!`);
          loadAllData();
        }
      }
    });
  }

  // Notice, Fund & Profile functions
  async function handlePublishNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;
    setLoading(true);
    await supabase.from('notices').insert([{ title: noticeTitle, content: noticeContent }]);
    setMsg('নোটিস প্রকাশিত হয়েছে!');
    setNoticeTitle('');
    setNoticeContent('');
    setLoading(false);
    loadAllData();
  }

  async function handleDeleteNotice(id: string) {
    if (!confirm('নোটিস মুছে ফেলতে চান?')) return;
    await supabase.from('notices').delete().eq('id', id);
    loadAllData();
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from('transactions').insert([
      { type: transType, category: transCategory, amount: parseFloat(transAmount), description: transDesc }
    ]);
    setMsg('ফান্ড হিসাব সংরক্ষিত হয়েছে!');
    setTransCategory('');
    setTransAmount('');
    setTransDesc('');
    setLoading(false);
    loadAllData();
  }

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
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 relative">
      {/* Animated Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900 text-center mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-600 text-center leading-relaxed mb-6">{confirmModal.description}</p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                বাতিল
              </button>
              <button
                type="button"
                onClick={confirmModal.action}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30">
                {loading ? 'অপেক্ষা করুন...' : 'হ্যাঁ, নিশ্চিত'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-emerald-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-amber-400" size={24} />
            <div>
              <h1 className="text-lg md:text-xl font-black">{mosqueProfile.name || 'অ্যাডমিন সুপার কন্ট্রোল'}</h1>
              <p className="text-[11px] text-emerald-200">বাৎসরিক এককালীন ফি, অনুসন্ধান ও লেটারহেড রসিদ</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
            <LogOut size={16} /> লগআউট
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto flex gap-2 mt-4 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('fees'); setMsg(''); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'fees' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <CheckCircle size={16} /> বাৎসরিক ফি
          </button>
          <button
            onClick={() => { setActiveTab('families'); setMsg(''); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'families' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <Users size={16} /> পরিবারসমূহ ও অনুসন্ধান
          </button>
          <button
            onClick={() => { setActiveTab('notices'); setMsg(''); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 ${
              activeTab === 'notices' ? 'bg-amber-400 text-slate-900 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}>
            <Bell size={16} /> নোটিস ও খবর
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
            <Building2 size={16} /> মসজিদ প্রোফাইল ও লেটারহেড
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        {msg && (
          <div className={`p-3 rounded-xl text-xs font-semibold text-center border ${
            msg.includes('সমস্যা') ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {msg}
          </div>
        )}

        {/* Tab 1: Yearly Fees */}
        {activeTab === 'fees' && (
          <div className="flex flex-col gap-5">
            {/* Universal Fee Increase */}
            <section className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
                <TrendingUp size={18} className="text-amber-400" />
                ইউনিভার্সাল ফি বৃদ্ধি (সবার ব্যক্তিগত ফি একসাথে বাড়ান)
              </h2>
              <p className="text-xs text-emerald-200 mb-3">
                যার ৫০ তার সাথে যোগ হবে, যার ২০০ তার সাথে যোগ হবে। ১ ক্লিকে ১ সেকেন্ডে সম্পূর্ণ ডেটাবেস আপডেট হবে।
              </p>

              <form onSubmit={handleUniversalFeeIncrease} className="flex flex-wrap items-center gap-2">
                <div className="flex bg-emerald-950/50 p-1 rounded-xl border border-white/20 text-xs">
                  <button
                    type="button"
                    onClick={() => setIncType('fixed')}
                    className={`px-3 py-1.5 rounded-lg font-bold ${incType === 'fixed' ? 'bg-amber-400 text-slate-900' : 'text-emerald-200'}`}>
                    + ফিক্সড টাকা (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncType('percent')}
                    className={`px-3 py-1.5 rounded-lg font-bold ${incType === 'percent' ? 'bg-amber-400 text-slate-900' : 'text-emerald-200'}`}>
                    + শতাংশ (%)
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
                  সবার ফিতে প্রয়োগ করুন
                </button>
              </form>
            </section>

            {/* Quick Search on Fees Tab */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
              <Search size={18} className="text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="নাম, ফোন বা পরিচয়পত্র নম্বর দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold outline-none bg-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 mr-1 font-bold">
                  ক্লিয়ার
                </button>
              )}
            </div>

            {/* Yearly Fee Cards */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
                  <CheckCircle size={20} className="text-emerald-600" />
                  বাৎসরিক ফি হিসাব ও রসিদ ({filteredFamilies.length})
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {filteredFamilies.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">কোনো পরিবার পাওয়া যায়নি।</p>
                ) : (
                  filteredFamilies.map((fam) => {
                    const famFees = allFees.filter(f => f.family_id === fam.id);
                    const unpaidList = famFees.filter(f => f.status === 'unpaid');
                    const isFullyPaid = famFees.length > 0 && unpaidList.length === 0;
                    
                    const monthlyRate = famFees[0]?.amount || fam.base_monthly_fee || 100;
                    const totalYearlyAmount = famFees.reduce((acc, c) => acc + Number(c.amount), 0);
                    const totalDue = unpaidList.reduce((acc, c) => acc + Number(c.amount), 0);

                    return (
                      <div key={fam.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-base text-slate-900">{fam.head_name}</h3>
                            <span className="text-xs text-slate-500 font-medium">({fam.phone})</span>
                          </div>

                          <div className="text-xs text-slate-600 mt-1">
                            📅 বাৎসরিক চক্র: <b>১৪৩১-১৪৩২ বঙ্গাব্দ</b> (ভাদ্র হতে শ্রাবণ)
                          </div>
                          
                          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                            <span>মাসিক ফি: <b>₹{monthlyRate}/-</b> (১২ মাস মোট = <b>₹{totalYearlyAmount}/-</b>)</span>
                            {!isFullyPaid && (
                              <button
                                onClick={() => handleEditFamilyFee(fam, monthlyRate)}
                                className="text-[11px] text-blue-600 underline font-bold">
                                ফি সংশোধন
                              </button>
                            )}
                          </div>

                          <div className="mt-1.5">
                            {isFullyPaid ? (
                              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                ✅ সম্পূর্ণ বাৎসরিক ফি পরিশোধিত
                              </span>
                            ) : (
                              <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                ⚠️ বকেয়া বাৎসরিক ফি: ₹{totalDue}/-
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isFullyPaid ? (
                            <button
                              onClick={() => triggerYearlyPaidModal(fam, unpaidList)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow">
                              <Check size={16} /> বাৎসরিক ফি Paid & WhatsApp
                            </button>
                          ) : (
                            <button
                              onClick={() => downloadYearlyReceipt(fam, famFees)}
                              className="bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow">
                              <Download size={14} /> লেটারহেড রসিদ (PDF)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: Families, Add, Edit, Delete, Instant Search */}
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
                    <X size={14} /> বাতিল
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
                    <label className="text-xs font-semibold text-slate-600 block mb-1">মাসিক ফি হার (₹)</label>
                    <input
                      type="number"
                      required
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(e.target.value)}
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
                    {loading ? 'সংরক্ষণ হচ্ছে...' : editingFamilyId ? 'পরিবর্তন সংরক্ষণ করুন' : 'পরিবার ও বাৎসরিক ১২ মাসের ফি তৈরি করুন'}
                  </button>
                </div>
              </form>
            </section>

            {/* Instant Search Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
              <Search size={20} className="text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="পরিবারের প্রধানের নাম, মোবাইল নম্বর বা আধার দিয়ে সার্চ করুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm font-semibold outline-none bg-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 mr-2 font-bold">
                  ক্লিয়ার
                </button>
              )}
            </div>

            {/* Filtered Family List */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
                <Users size={20} className="text-emerald-600" />
                নিবন্ধিত পরিবারসমূহ ({filteredFamilies.length})
              </h2>

              <div className="grid gap-3">
                {filteredFamilies.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">কোনো পরিবার পাওয়া যায়নি।</p>
                ) : (
                  filteredFamilies.map((fam) => (
                    <div key={fam.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{fam.head_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ফোন: {fam.phone} | পরিচয়: {fam.aadhaar_masked ? 'নিবন্ধিত' : 'নেই'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
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
                        <button
                          onClick={() => handleDeleteFamily(fam)}
                          className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Trash2 size={14} /> মুছুন
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* Tab 3: Notices */}
        {activeTab === 'notices' && (
          <div className="flex flex-col gap-6">
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold mb-3 text-slate-800">নতুন নোটিস বা খবর পাবলিশ করুন</h2>
              <form onSubmit={handlePublishNotice} className="flex flex-col gap-3">
                <input
                  type="text"
                  required
                  placeholder="নোটিসের শিরোনাম"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                />
                <textarea
                  required
                  placeholder="বিস্তারিত বিবরণ..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50"
                  rows={3}
                />
                <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm">
                  {loading ? 'প্রকাশ হচ্ছে...' : 'নোটিস প্রকাশ করুন'}
                </button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold mb-3 text-slate-800">প্রকাশিত নোটিসসমূহ</h2>
              <div className="grid gap-3">
                {notices.map((n) => (
                  <div key={n.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{n.title}</div>
                      <div className="text-xs text-slate-600 mt-1">{n.content}</div>
                    </div>
                    <button onClick={() => handleDeleteNotice(n.id)} className="text-rose-600 hover:text-rose-800 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Tab 4: Funds */}
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
              <h2 className="text-base font-bold mb-4 text-slate-800">নতুন আয় বা খরচের হিসাব যোগ করুন</h2>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">লেনদেনের ধরণ</label>
                  <select value={transType} onChange={(e: any) => setTransType(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50">
                    <option value="income">অনুদান / আয়</option>
                    <option value="expense">মসজিদ খরচ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">খাত / ক্যাটাগরি</label>
                  <input type="text" required placeholder="যেমন: জুমার কালেকশন" value={transCategory} onChange={(e) => setTransCategory(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">টাকার পরিমাণ (₹)</label>
                  <input type="number" required placeholder="টাকা" value={transAmount} onChange={(e) => setTransAmount(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
                </div>
                <div className="md:col-span-3">
                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm">
                    হিসাব সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </section>
          </>
        )}

        {/* Tab 5: Mosque Profile & Letterhead Settings */}
        {activeTab === 'settings' && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-800">
              <Building2 size={20} className="text-emerald-600" />
              মসজিদ প্রোফাইল, লেটারহেড ও কমিটি সেটআপ
            </h2>
            <form onSubmit={handleSaveMosqueProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">মসজিদের পূর্ণ নাম (রসিদের লেটারহেডে থাকবে)</label>
                <input type="text" required value={mosqueProfile.name || ''} onChange={(e) => setMosqueProfile({ ...mosqueProfile, name: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">ঠিকানা (রসিদের ব্যানারে থাকবে)</label>
                <input type="text" value={mosqueProfile.address || ''} onChange={(e) => setMosqueProfile({ ...mosqueProfile, address: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">ইমাম সাহেবের নাম</label>
                <input type="text" value={mosqueProfile.imam_name || ''} onChange={(e) => setMosqueProfile({ ...mosqueProfile, imam_name: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">ইমাম সাহেবের মোবাইল নম্বর</label>
                <input type="tel" value={mosqueProfile.imam_phone || ''} onChange={(e) => setMosqueProfile({ ...mosqueProfile, imam_phone: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">সেক্রেটারির নাম</label>
                <input type="text" value={mosqueProfile.secretary_name || ''} onChange={(e) => setMosqueProfile({ ...mosqueProfile, secretary_name: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">ক্যাশিয়ারের নাম</label>
                <input type="text" value={mosqueProfile.cashier_name || ''} onChange={(e) => setMosqueProfile({ ...mosqueProfile, cashier_name: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">অফিসিয়াল UPI ID (Google Pay / PhonePe)</label>
                <input type="text" placeholder="যেমন: mosque@upi" value={mosqueProfile.upi_id || ''} onChange={(e) => setMosqueProfile({ ...mosqueProfile, upi_id: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">ব্যাংক একাউন্ট বিবরণী</label>
                <textarea placeholder="অ্যাকাউন্ট নম্বর, IFSC কোড, ব্যাংক নাম..." value={mosqueProfile.bank_details || ''} onChange={(e) => setMosqueProfile({ ...mosqueProfile, bank_details: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" rows={2} />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm">
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল ও লেটারহেড সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
