export function getFormattedCalendars() {
  const now = new Date();

  // ১. ভারতীয় প্রমাণ সময় (IST) ও ইংরেজি তারিখ
  const istOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  const englishIST = new Intl.DateTimeFormat('bn-IN', istOptions).format(now);

  // ২. হিজরি / আরবি তারিখ
  const hijriOptions: Intl.DateTimeFormatOptions = {
    calendar: 'islamic-umalqura',
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  const hijriDate = new Intl.DateTimeFormat('bn-IN-u-ca-islamic-umalqura', hijriOptions).format(now);

  // ৩. বঙ্গাব্দ ক্যালেন্ডার (ভাদ্র-আশ্বিন সংক্রান্তি সহ ভারতীয় বঙ্গাব্দ হিসাব)
  const bengaliMonths = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
  ];
  const startYear = 593;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  let bengaliYear = currentYear - startYear;
  if (currentMonth < 3 || (currentMonth === 3 && currentDate < 14)) {
    bengaliYear -= 1;
  }

  // সংক্রান্তির সাধারণ ক্যালকুলেশন
  const monthTransitions = [14, 15, 15, 16, 17, 17, 18, 17, 16, 15, 13, 14];
  let bMonthIndex = (currentMonth + 9) % 12;
  let bDay = currentDate - monthTransitions[currentMonth];

  if (bDay <= 0) {
    bMonthIndex = (bMonthIndex - 1 + 12) % 12;
    bDay += 30; // আনুমানিক ৩০ দিনের হিসাব
  }

  const bengaliDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  const toBengaliNumber = (num: number) => num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');

  const bengaliDate = `${toBengaliNumber(bDay)} ${bengaliMonths[bMonthIndex]}, ${toBengaliNumber(bengaliYear)} বঙ্গাব্দ`;

  return { englishIST, hijriDate, bengaliDate };
}
