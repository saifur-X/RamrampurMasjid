export function getFormattedCalendars() {
  const now = new Date();

  // 1. English Date, Day name and IST Time
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

  // 2. Accurate Hijri Calculation (Kuwaiti / Tabular Algorithm)
  const hijriDate = calculateHijriDate(now);

  // 3. Bengali Calendar
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

// Shothik Hijri Calculation Helper
function calculateHijriDate(date: Date): string {
  const islamicMonths = [
    'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
  ];

  const jd = Math.floor((date.getTime() + 19800000) / 86400000) + 2440587.5;
  const l = Math.floor(jd - 1948440 + 10632);
  const n = Math.floor((l - 1) / 10631);
  const lSub = l - 10631 * n + 354;
  const j = (Math.floor((10985 - lSub) / 5316)) * (Math.floor((50 * lSub) / 17719)) + (Math.floor(lSub / 5670)) * (Math.floor((43 * lSub) / 15238));
  const lFinal = lSub - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  
  const m = Math.floor((24 * lFinal) / 709);
  const d = lFinal - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;

  const monthName = islamicMonths[m - 1] || 'Islamic Month';
  return `${d} ${monthName}, ${y} AH`;
}
