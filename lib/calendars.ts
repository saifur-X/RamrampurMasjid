export function getFormattedCalendars() {
  const now = new Date();

  // ১. ইংরেজি দিন, তারিখ, সাল এবং ভারতীয় সময় (IST)
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(now);
  const engDate = new Intl.DateTimeFormat('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric', 
    timeZone: 'Asia/Kolkata' 
  }).format(now);
  
  const istTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(now);

  const englishFull = `${dayName}, ${engDate} | ${istTime} IST`;
  const isFriday = dayName.toLowerCase() === 'friday';

  // ২. সঠিক হিজরি / আরবি তারিখ ও সাল
  let hijriDate = '';
  try {
    const hijriFormatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    hijriDate = `${hijriFormatter.format(now)} AH`;
  } catch (e) {
    hijriDate = 'Islamic Calendar Active';
  }

  // ৩. বঙ্গাব্দ ক্যালেন্ডার
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

  const monthTransitions = [14, 15, 15, 16, 17, 17, 18, 17, 16, 15, 13, 14];
  let bMonthIndex = (currentMonth + 9) % 12;
  let bDay = currentDate - monthTransitions[currentMonth];

  if (bDay <= 0) {
    bMonthIndex = (bMonthIndex - 1 + 12) % 12;
    bDay += 30;
  }

  const bengaliDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  const toBengaliNumber = (num: number) => num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');

  const bengaliDate = `${toBengaliNumber(bDay)} ${bengaliMonths[bMonthIndex]}, ${toBengaliNumber(bengaliYear)} বঙ্গাব্দ`;

  return { englishFull, hijriDate, bengaliDate, isFriday, dayName };
}
