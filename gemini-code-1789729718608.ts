import jsPDF from 'jspdf';

// ডিজিটাল রসিদ তৈরির ফাংশন
export function generateReceiptPDF(feeData: {
  receiptNo: string;
  headName: string;
  month: string;
  amount: number;
  date: string;
}) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Mosque Management Society', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Official Monthly Fee Receipt', 105, 30, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text(`Receipt No: ${feeData.receiptNo}`, 20, 50);
  doc.text(`Payment Date: ${feeData.date}`, 20, 60);
  doc.text(`Family Head: ${feeData.headName}`, 20, 70);
  doc.text(`Billing Month: ${feeData.month}`, 20, 80);
  doc.text(`Amount Received: INR ${feeData.amount}/-`, 20, 90);
  doc.text(`Payment Status: Verified & Paid`, 20, 100);

  doc.text('Signature / Stamp: _________________', 120, 130);
  
  doc.save(`Receipt_${feeData.receiptNo}.pdf`);
}

// WhatsApp লিংক জেনারেশন
export function getWhatsAppUrl(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}