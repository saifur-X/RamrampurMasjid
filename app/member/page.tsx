'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateReceiptPDF } from '@/lib/whatsapp';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';

export default function MemberDashboard() {
  const [fees, setFees] = useState<any[]>([]);
  const [family, setFamily] = useState<any>(null);

  useEffect(() => {
    async function loadMemberData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: fam } = await supabase.from('families').select('*').eq('user_id', user.id).single();
      setFamily(fam);

      if (fam) {
        const { data: feeList } = await supabase.from('fees').select('*').eq('family_id', fam.id);
        if (feeList) setFees(feeList);
      }
    }
    loadMemberData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h1 className="text-xl font-bold">পরিবার: {family?.head_name || 'লোড হচ্ছে...'}</h1>
          <p className="text-sm text-slate-500">ফোন: {family?.phone}</p>
        </div>

        <h2 className="text-lg font-bold">ইমাম ফি বিবরণী (ভাদ্র - আশ্বিন চক্র)</h2>
        <div className="grid gap-3">
          {fees.map((fee) => (
            <div key={fee.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-800">{fee.month_name} ({fee.year_cycle})</div>
                <div className="text-sm text-slate-600">ধার্যকৃত অর্থ: ₹{fee.amount}</div>
              </div>
              <div>
                {fee.status === 'paid' ? (
                  <button
                    onClick={() => generateReceiptPDF({
                      receiptNo: fee.receipt_no,
                      headName: family.head_name,
                      month: fee.month_name,
                      amount: fee.amount,
                      date: new Date(fee.paid_date).toLocaleDateString()
                    })}
                    className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 font-semibold">
                    <Download size={16} /> রসিদ ডাউনলোড
                  </button>
                ) : (
                  <span className="text-amber-600 text-sm font-semibold flex items-center gap-1">
                    <AlertCircle size={16} /> অপরিশোধিত
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
