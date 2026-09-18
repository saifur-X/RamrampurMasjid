'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateReceiptPDF } from '@/lib/whatsapp';
import { Download, AlertCircle, LogOut, CheckCircle, User, Calendar, ShieldCheck } from 'lucide-react';

export default function MemberDashboard() {
  const router = useRouter();
  const [fees, setFees] = useState<any[]>([]);
  const [mosqueProfile, setMosqueProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState<{ id: string; name: string; phone: string } | null>(null);

  useEffect(() => {
    const familyId = localStorage.getItem('member_family_id');
    const headName = localStorage.getItem('member_family_name') || '';
    const phone = localStorage.getItem('member_family_phone') || '';

    if (!familyId) {
      router.push('/login');
      return;
    }

    setFamilyData({ id: familyId, name: headName, phone });
    loadData(familyId);
  }, []);

  async function loadData(familyId: string) {
    setLoading(true);
    const { data: feeList } = await supabase.from('fees').select('*').eq('family_id', familyId).order('created_at', { ascending: true });
    if (feeList) setFees(feeList);

    const { data: mProf } = await supabase.from('mosque_profile').select('*').limit(1).maybeSingle();
    if (mProf) setMosqueProfile(mProf);

    setLoading(false);
  }

  function handleDownloadReceipt() {
    if (!familyData) return;
    const paidList = fees.filter(f => f.status === 'paid');
    const total = paidList.reduce((acc, c) => acc + Number(c.amount), 0);
    const rNo = paidList[0]?.receipt_no || `REC-${familyData.id.slice(0, 6)}`;
    const pDate = paidList[0]?.paid_date ? new Date(paidList[0].paid_date).toLocaleDateString() : 'Paid';

    generateReceiptPDF({
      receiptNo: rNo,
      headName: familyData.name,
      phone: familyData.phone,
      yearCycle: '১৪৩১-১৪৩২ বঙ্গাব্দ',
      monthlyRate: Number(paidList[0]?.amount || 0),
      totalAmount: total,
      paidDate: pDate,
      mosqueName: mosqueProfile?.name,
      mosqueAddress: mosqueProfile?.address,
      imamName: mosqueProfile?.imam_name,
      secretaryName: mosqueProfile?.secretary_name
    });
  }

  function handleLogout() {
    localStorage.clear();
    router.push('/login');
  }

  const unpaidList = fees.filter(f => f.status === 'unpaid');
  const isFullyPaid = fees.length > 0 && unpaidList.length === 0;
  const monthlyRate = fees[0]?.amount || 100;
  const totalYearly = fees.reduce((acc, c) => acc + Number(c.amount), 0);
  const totalDue = unpaidList.reduce((acc, c) => acc + Number(c.amount), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12">
      <header className="bg-emerald-800 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User size={20} className="text-amber-400" />
            <div>
              <h1 className="text-base font-bold">{familyData?.name}</h1>
              <p className="text-[11px] text-emerald-200">ফোন: {familyData?.phone}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <LogOut size={14} /> বের হন
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-10 text-xs font-bold text-slate-500">তথ্য লোড হচ্ছে...</div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase">বাৎসরিক ইমাম ফি হিসাব</span>
                <h2 className="text-lg font-black text-slate-800">১৪৩১-১৪৩২ বঙ্গাব্দ</h2>
              </div>
              <Calendar className="text-emerald-600" size={24} />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">বাৎসরিক সময়সীমা:</span>
                <span className="font-bold text-slate-800">ভাদ্র হতে শ্রাবণ (১২ মাস)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ধার্যকৃত মাসিক ফি:</span>
                <span className="font-bold text-slate-800">₹{monthlyRate}/- প্রতি মাস</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-slate-700 font-bold">মোট বাৎসরিক ফি:</span>
                <span className="font-black text-slate-900 text-sm">₹{totalYearly}/-</span>
              </div>
            </div>

            <div className="pt-2">
              {isFullyPaid ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <ShieldCheck size={20} className="text-emerald-600" />
                    আপনার পরিবারের সম্পূর্ণ বাৎসরিক ফি পরিশোধিত হয়েছে।
                  </div>
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30">
                    <Download size={16} /> অফিসিয়াল লেটারহেড রসিদ ডাউনলোড (PDF)
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-900">বাৎসরিক ফি বকেয়া রয়েছে</div>
                    <div className="text-xs text-amber-700 mt-0.5">বকেয়া পরিমাণ: ₹{totalDue}/-</div>
                  </div>
                  <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-full">
                    অপরিশোধিত
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
