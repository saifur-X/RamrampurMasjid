'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateReceiptPDF } from '@/lib/whatsapp';
import { Download, AlertCircle, LogOut, CheckCircle, User } from 'lucide-react';

export default function MemberDashboard() {
  const router = useRouter();
  const [fees, setFees] = useState<any[]>([]);
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
    loadFamilyFees(familyId);
  }, []);

  async function loadFamilyFees(familyId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('fees')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (data) {
      setFees(data);
    }
    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem('member_family_id');
    localStorage.removeItem('member_family_name');
    localStorage.removeItem('member_family_phone');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User size={20} className="text-amber-400" />
            <div>
              <h1 className="text-base font-bold">{familyData?.name}</h1>
              <p className="text-[11px] text-emerald-200">ফোন: {familyData?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <LogOut size={14} /> বের হন
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-black text-slate-800 mb-1">বাৎসরিক ইমাম ফি বিবরণী</h2>
          <p className="text-xs text-slate-500">ভাদ্র থেকে শ্রাবণ চক্রের ১২ মাসের হিসাব</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs font-semibold text-slate-500">
            ফি রেকর্ড লোড হচ্ছে...
          </div>
        ) : fees.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            এই পরিবারের জন্য এখনো কোনো ফি এন্ট্রি তৈরি করা হয়নি। অ্যাডমিন প্যানেল থেকে তৈরি করতে হবে।
          </div>
        ) : (
          <div className="grid gap-2.5">
            {fees.map((fee) => (
              <div key={fee.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-bold text-sm text-slate-800">{fee.month_name} ({fee.year_cycle})</div>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">নির্ধারিত ফি: ₹{fee.amount}</div>
                </div>

                <div>
                  {fee.status === 'paid' ? (
                    <button
                      onClick={() => generateReceiptPDF({
                        receiptNo: fee.receipt_no || `REC-${fee.id.slice(0, 6)}`,
                        headName: familyData?.name || '',
                        month: fee.month_name,
                        amount: fee.amount,
                        date: fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : 'Paid'
                      })}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs flex items-center gap-1 font-bold shadow-sm">
                      <Download size={14} /> রসিদ
                    </button>
                  ) : (
                    <span className="text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                      <AlertCircle size={14} /> অপরিশোধিত
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}