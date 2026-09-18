'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { Check, Send, Plus } from 'lucide-react';

export default function ImamDashboard() {
  const [unpaidFees, setUnpaidFees] = useState<any[]>([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase.from('fees').select('*, families(head_name, phone)').eq('status', 'unpaid');
    if (data) setUnpaidFees(data);
  }

  async function markAsPaid(fee: any) {
    const receipt = `REC-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from('fees').update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      receipt_no: receipt
    }).eq('id', fee.id);

    if (!error) {
      const msg = `আসসালামু আলাইকুম ${fee.families.head_name} সাহেব। আপনার ${fee.month_name} মাসের ইমাম ফি ₹${fee.amount} গৃহীত হয়েছে। রসিদ নম্বর: ${receipt}। ধন্যবাদ।`;
      const url = getWhatsAppUrl(fee.families.phone, msg);
      window.open(url, '_blank');
      loadData();
    }
  }

  async function publishNotice() {
    if (!newNotice.title || !newNotice.content) return;
    await supabase.from('notices').insert([newNotice]);
    setNewNotice({ title: '', content: '' });
    alert('নোটিস প্রকাশিত হয়েছে!');
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">ইমাম ড্যাশবোর্ড</h1>

      {/* নতুন নোটিস প্রকাশ */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h2 className="font-bold mb-2">নতুন নোটিস বা ওয়াজের খবর তৈরি করুন</h2>
        <input
          type="text"
          placeholder="শিরোনাম"
          value={newNotice.title}
          onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
          className="w-full border p-2 rounded mb-2 text-sm"
        />
        <textarea
          placeholder="বিস্তারিত বিবরণ..."
          value={newNotice.content}
          onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
          className="w-full border p-2 rounded mb-2 text-sm"
        />
        <button onClick={publishNotice} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-1">
          <Plus size={16} /> নোটিস প্রকাশ করুন
        </button>
      </div>

      {/* ফি পরিশোধ তালিকা */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h2 className="font-bold mb-3">বকেয়া ইমাম ফি তালিকা</h2>
        <div className="grid gap-2">
          {unpaidFees.map((fee) => (
            <div key={fee.id} className="p-3 border rounded-lg flex justify-between items-center">
              <div>
                <div className="font-bold">{fee.families?.head_name}</div>
                <div className="text-xs text-slate-500">{fee.month_name} - ₹{fee.amount} | {fee.families?.phone}</div>
              </div>
              <button
                onClick={() => markAsPaid(fee)}
                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                <Check size={14} /> Paid & WhatsApp
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}