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
    // মেম্বারের সকল ফি লোড
    const { data: feeList } = await supabase
      .from('fees')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });
    
    if (feeList) setFees(feeList);

    // মসজিদের লেটারহেড প্রোফাইল লোড
    const { data: mProf } = await supabase
      .from('mosque_profile')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (mProf) setMosqueProfile(mProf);

    setLoading(false);
  }

  function handleDownloadReceipt() {
    if (!familyData) return;
    const paidList = fees.filter(f => f.status === 'paid');
    const total = paidList.reduce((acc, c) => acc + Number(c.amount), 0);
    const rNo = paidList[0]?.receipt_no || `REC-${familyData.id.slice(0, 6)}`;
    const pDate = paidList[0]?.paid_date ? new Date(paidList[0].paid_date).toLocaleDateString('en-GB') : 'Paid';

    generateReceiptPDF({
      receiptNo: rNo,
      headName: familyData.name,
      phone: familyData.phone,
      yearCycle: '1431-1432 BS',
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

  // হিসাব নিকাশ
  const unpaidList = fees.filter(f => f.status === 'unpaid');
  const paidList = fees.filter(f => f.status === 'paid');
  const isFullyPaid = fees.length > 0 && unpaidList.length === 0;
  
  // বর্তমান মাসিক রেট ও মোট বাৎসরিক হিসাব
  const currentMonthlyRate = fees[fees.length - 1]?.amount || 100;
  const totalYearlyAmount = fees.reduce((acc, c) => acc + Number(c.amount), 0);
  const totalDue = unpaidList.reduce((acc, c) => acc + Number(c.amount), 0);
  const totalPaid = paidList.reduce((acc, c) => acc + Number(c.amount), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* হেডার */}
      <header className="bg-emerald-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User size={20} className="text-amber-400" />
            <div>
              <h1 className="text-base font-black">{familyData?.name}</h1>
              <p className="text-[11px] text-emerald-200">মোবাইল: {familyData?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1">
            <LogOut size={14} /> লগআউট
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-slate-500">
            হিসাব বিবরণী লোড হচ্ছে...
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  ইমাম বাৎসরিক ফি বিবরণী
                </span>
                <h2 className="text-lg font-black text-slate-900">১৪৩১-১৪৩২ বঙ্গাব্দ</h2>
              </div>
              <Calendar className="text-emerald-600" size={26} />
            </div>

            {/* হিসাব সামারি বক্স */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">বাৎসরিক চক্র:</span>
                <span className="font-bold text-slate-800">ভাদ্র হতে শ্রাবণ (১২ মাস)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">বর্তমান মাসিক ফি হার:</span>
                <span className="font-black text-slate-800">₹{currentMonthlyRate}/- প্রতি মাস</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">মোট বাৎসরিক ধার্যকৃত ফি:</span>
                <span className="font-bold text-slate-900">₹{totalYearlyAmount}/-</span>
              </div>
              {totalPaid > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>পরিশোধিত অর্থ:</span>
                  <span>₹{totalPaid}/-</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-800 font-black">অবশিষ্ট বকেয়া ফি:</span>
                <span className={`font-black text-base ${totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ₹{totalDue}/-
                </span>
              </div>
            </div>

            {/* স্ট্যাটাস ও রসিদ বাটন */}
            <div>
              {isFullyPaid ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
                    <ShieldCheck size={22} className="text-emerald-600 shrink-0" />
                    <div>
                      <div>সম্পূর্ণ বাৎসরিক ফি পরিশোধিত</div>
                      <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        আপনার পরিবারের জন্য অফিশিয়াল ডিজিটাল রসিদ প্রস্তুত রয়েছে।
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition">
                    <Download size={16} /> অফিসিয়াল লেটারহেড রসিদ ডাউনলোড (PDF)
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={18} className="text-amber-600 shrink-0" />
                      <div className="text-xs font-black text-amber-900">ফি বকেয়া রয়েছে</div>
                    </div>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-black px-2.5 py-1 rounded-full">
                      বকেয়া
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    আপনার পরিবারের মোট <b>₹{totalDue}/-</b> টাকা বকেয়া রয়েছে। মসজিদ কমিটির কাছে ফি পরিশোধ করলে স্বয়ংক্রিয়ভাবে ডিজিটাল লেটারহেড রসিদ আনলক হয়ে যাবে।
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
