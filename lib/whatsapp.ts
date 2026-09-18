import jsPDF from 'jspdf';

// যে কোনো বাংলা বা নন-ল্যাটিন ক্যারেক্টার স্বয়ংক্রিয়ভাবে বাদ দেওয়া বা ইংরেজিতে রূপান্তরের হেল্পার
function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[০-৯]/g, d => '0123456789'['০১২৩৪৫৬৭৮৯'.indexOf(d)])
    .replace(/[^\x20-\x7E]/g, '') // শুধুমাত্র নিরাপদ ক্যারেক্টার রাখা
    .trim();
}

export function generateReceiptPDF(data: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const mName = sanitizeText(data.mosqueName) || 'RAMRAMPUR JAME MASJID';
  const mAddress = sanitizeText(data.mosqueAddress) || 'Ramrampur, Kuli Kandi, Burwan, Murshidabad, WB';
  
  // ভাউচার নম্বর থেকে যেকোনো নন-ল্যাটিন অংশ বাদ দেওয়া
  let rawRNo = String(data.receiptNo || `REC-${Date.now().toString().slice(-6)}`);
  const rNo = sanitizeText(rawRNo) || `REC-${Date.now().toString().slice(-6)}`;
  
  const hName = sanitizeText(data.headName) || 'Member';
  const ph = sanitizeText(data.phone) || 'N/A';
  
  // বাৎসরিক চক্র পরিষ্কার ইংরেজি ফরম্যাট রাখা
  const yCycle = '1431-1432 BS (Bhadra to Sraban)';
  
  const pDate = sanitizeText(data.paidDate || data.date) || new Date().toLocaleDateString('en-GB');
  const tAmount = Number(data.totalAmount || data.amount || 0);
  const mRate = Number(data.monthlyRate || (tAmount > 0 ? Math.round(tAmount / 12) : 100));

  // ১. ডিপ এমারেল্ড হেডার ব্যানার
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, 210, 42, 'F');

  // গোল্ডেন ডিভাইডার স্ট্রিপ
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 42, 210, 2, 'F');

  // হেডার টেক্সট
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(mName.toUpperCase(), 105, 18, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(mAddress, 105, 26, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL YEARLY IMAM FEE RECEIPT', 105, 34, { align: 'center' });

  // ২. মেটা ইনফো বার
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, 50, 180, 16, 2, 2, 'F');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`VOUCHER NO: ${rNo}`, 20, 60);
  doc.text(`DATE OF PAYMENT: ${pDate}`, 130, 60);

  // ৩. মূল বিবরণী টেবিল বক্স
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 72, 180, 80, 3, 3, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FAMILY & PAYMENT PARTICULARS:', 22, 83);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Head of Family', 22, 95);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${hName}`, 75, 95);

  doc.setFont('helvetica', 'normal');
  doc.text('Registered Mobile', 22, 106);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${ph}`, 75, 106);

  doc.setFont('helvetica', 'normal');
  doc.text('Yearly Billing Cycle', 22, 117);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${yCycle}`, 75, 117);

  doc.setFont('helvetica', 'normal');
  doc.text('Monthly Rate', 22, 128);
  doc.setFont('helvetica', 'bold');
  doc.text(`: INR ${mRate}/- per month`, 75, 128);

  doc.setFont('helvetica', 'normal');
  doc.text('Payment Mode', 22, 139);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(': Full Yearly Paid (12 Months)', 75, 139);

  // ৪. টোটাল অ্যামাউন্ট হাইলাইট বক্স
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(15, 160, 180, 20, 2, 2, 'FD');

  doc.setTextColor(6, 78, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL RECEIVED: INR ${tAmount}/- ONLY`, 105, 173, { align: 'center' });

  // ৫. সিগনেচার সেকশন
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const imam = sanitizeText(data.imamName);
  const sec = sanitizeText(data.secretaryName);

  doc.line(25, 225, 75, 225);
  doc.text(imam ? `Imam: ${imam}` : 'Imam Signature', 50, 231, { align: 'center' });

  doc.line(135, 225, 185, 225);
  doc.text(sec ? `Secretary: ${sec}` : 'Secretary / Cashier', 160, 231, { align: 'center' });

  // ফুটার
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated official receipt issued by Mosque Management Society.', 105, 280, { align: 'center' });

  doc.save(`Receipt_${hName}_${rNo}.pdf`);
}

export function getWhatsAppUrl(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
