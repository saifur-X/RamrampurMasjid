import jsPDF from 'jspdf';

interface ReceiptParams {
  receiptNo: string;
  headName: string;
  phone: string;
  yearCycle: string;
  monthlyRate: number;
  totalAmount: number;
  paidDate: string;
  mosqueName?: string;
  mosqueAddress?: string;
  imamName?: string;
  secretaryName?: string;
}

export function generateReceiptPDF(data: ReceiptParams) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const mName = data.mosqueName || 'রামরামপুর জামে মসজিদ';
  const mAddress = data.mosqueAddress || 'রামরামপুর, কুলি কান্দি, বড়ঞা, মুর্শিদাবাদ';

  // ১. প্রিমিয়াম লেটারহেড ব্যাকগ্রাউন্ড হেডার
  doc.setFillColor(6, 78, 59); // ডিপ এমারেল্ড গ্রিন
  doc.rect(0, 0, 210, 42, 'F');

  // গোল্ডেন ডিভাইডার স্ট্রিপ
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 42, 210, 2.5, 'F');

  // লেটারহেড টেক্সট
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(mName, 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(mAddress, 105, 26, { align: 'center' });
  doc.text('অফিসিয়াল বাৎসরিক ইমাম ফি প্রাপ্তি রসিদ (Official Yearly Receipt)', 105, 34, { align: 'center' });

  // ২. রসিদ মেটা ইনফো বার
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, 52, 180, 18, 2, 2, 'F');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`রসিদ ভাউচার নং: ${data.receiptNo}`, 20, 63);
  doc.text(`পরিশোধের তারিখ: ${data.paidDate}`, 135, 63);

  // ৩. মেম্বার ও বাৎসরিক বিবরণী টেবিল
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 76, 180, 78, 3, 3, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('পরিবার ও বাৎসরিক হিসাব বিবরণী:', 22, 86);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // বিবরণী তালিকা
  doc.text(`পরিবারের প্রধানের নাম`, 22, 98);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${data.headName}`, 75, 98);
  doc.setFont('helvetica', 'normal');

  doc.text(`নিবন্ধিত মোবাইল নম্বর`, 22, 108);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${data.phone}`, 75, 108);
  doc.setFont('helvetica', 'normal');

  doc.text(`বাৎসরিক চক্র (১২ মাস)`, 22, 118);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${data.yearCycle} (ভাদ্র হতে শ্রাবণ)`, 75, 118);
  doc.setFont('helvetica', 'normal');

  doc.text(`ধার্যকৃত মাসিক ফি হার`, 22, 128);
  doc.setFont('helvetica', 'bold');
  doc.text(`: INR ${data.monthlyRate}/- প্রতি মাস`, 75, 128);
  doc.setFont('helvetica', 'normal');

  doc.text(`পরিশোধের ধরন`, 22, 138);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`: এককালীন সম্পূর্ণ বাৎসরিক পরিশোধ (Paid Full Year)`, 75, 138);

  // ৪. মোট অ্যামাউন্ট হাইলাইট বক্স
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(15, 160, 180, 22, 2, 2, 'FD');

  doc.setTextColor(6, 78, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`সর্বমোট প্রাপ্ত অর্থ: INR ${data.totalAmount}/- টাকা মাত্র`, 105, 174, { align: 'center' });

  // ৫. কর্তৃপক্ষ ও কমিটির স্বাক্ষর অংশ
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // ইমাম সাহেব
  doc.line(25, 225, 75, 225);
  doc.text(data.imamName ? `ইমাম: ${data.imamName}` : 'ইমাম সাহেবের স্বাক্ষর', 50, 231, { align: 'center' });

  // সেক্রেটারি / ক্যাশিয়ার
  doc.line(135, 225, 185, 225);
  doc.text(data.secretaryName ? `সেক্রেটারি: ${data.secretaryName}` : 'সেক্রেটারি / ক্যাশিয়ার', 160, 231, { align: 'center' });

  // ফুটার নোটিশ
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('এটি মসজিদ ম্যানেজমেন্ট সিস্টেমের একটি বৈধ কম্পিউটার জেনারেটেড ডিজিটাল রসিদ।', 105, 280, { align: 'center' });

  // সেভ
  doc.save(`Receipt_${data.headName}_${data.receiptNo}.pdf`);
}

// WhatsApp মেসেজ লিংক
export function getWhatsAppUrl(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}