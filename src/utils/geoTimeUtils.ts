/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. Leap Year Checker
// ==========================================

export function isLeapYear(year: number): {
  isLeap: boolean;
  reason: string;
  nextLeapYears: number[];
  previousLeapYears: number[];
  daysInYear: number;
} {
  const y = Math.round(year);
  let isLeap = false;
  let reason = '';

  if (y % 400 === 0) {
    isLeap = true;
    reason = `${y} is a leap year because it is divisible by 400.`;
  } else if (y % 100 === 0) {
    isLeap = false;
    reason = `${y} is NOT a leap year because century years divisible by 100 are only leap years if divisible by 400.`;
  } else if (y % 4 === 0) {
    isLeap = true;
    reason = `${y} is a leap year because it is divisible by 4 and not a century year.`;
  } else {
    isLeap = false;
    reason = `${y} is NOT a leap year because it is not divisible by 4.`;
  }

  const nextLeapYears: number[] = [];
  let next = y + 1;
  while (nextLeapYears.length < 5) {
    if ((next % 4 === 0 && next % 100 !== 0) || next % 400 === 0) {
      nextLeapYears.push(next);
    }
    next++;
  }

  const previousLeapYears: number[] = [];
  let prev = y - 1;
  while (previousLeapYears.length < 5) {
    if ((prev % 4 === 0 && prev % 100 !== 0) || prev % 400 === 0) {
      previousLeapYears.push(prev);
    }
    prev--;
  }

  return {
    isLeap,
    reason,
    nextLeapYears,
    previousLeapYears,
    daysInYear: isLeap ? 366 : 365
  };
}

// ==========================================
// 2. Sunrise, Sunset & Solar Twilight Algorithm
// (Standard Astronomical Equations by NOAA)
// ==========================================

export function calculateSunriseSunset(
  lat: number,
  lng: number,
  date: Date = new Date(),
  tzOffsetHours?: number
): {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLength: string;
  civilDawn: string;
  civilDusk: string;
} {
  const offset = tzOffsetHours ?? -date.getTimezoneOffset() / 60;

  // Day of the year
  const startOfYear = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Approximate solar coordinates
  const lngHour = lng / 15.0;

  function computeTime(isSunrise: boolean, zenith: number): number | null {
    const t = isSunrise ? dayOfYear + (6 - lngHour) / 24 : dayOfYear + (18 - lngHour) / 24;
    const M = (0.9856 * t) - 3.289;
    let L = M + (1.916 * Math.sin(M * Math.PI / 180)) + (0.020 * Math.sin(2 * M * Math.PI / 180)) + 282.634;
    L = ((L % 360) + 360) % 360;

    let RA = Math.atan(0.91764 * Math.tan(L * Math.PI / 180)) * 180 / Math.PI;
    RA = ((RA % 360) + 360) % 360;

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = RA + (Lquadrant - RAquadrant);
    RA = RA / 15;

    const sinDec = 0.39782 * Math.sin(L * Math.PI / 180);
    const cosDec = Math.cos(Math.asin(sinDec));

    const cosH = (Math.cos(zenith * Math.PI / 180) - (sinDec * Math.sin(lat * Math.PI / 180))) / (cosDec * Math.cos(lat * Math.PI / 180));

    if (cosH > 1 || cosH < -1) return null; // Polar day or night

    let H = isSunrise ? 360 - Math.acos(cosH) * 180 / Math.PI : Math.acos(cosH) * 180 / Math.PI;
    H = H / 15;

    const T = H + RA - (0.06571 * t) - 6.622;
    let UT = T - lngHour;
    UT = ((UT % 24) + 24) % 24;
    let localT = UT + offset;
    return ((localT % 24) + 24) % 24;
  }

  function formatHoursToTime(hours: number | null): string {
    if (hours === null) return 'N/A';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }

  const standardZenith = 90.833; // Official sunrise/sunset with atmospheric refraction
  const civilZenith = 96.0;      // Civil twilight (6° below horizon)

  const sunriseHours = computeTime(true, standardZenith);
  const sunsetHours = computeTime(false, standardZenith);
  const dawnHours = computeTime(true, civilZenith);
  const duskHours = computeTime(false, civilZenith);

  let solarNoonStr = 'N/A';
  let dayLengthStr = 'N/A';

  if (sunriseHours !== null && sunsetHours !== null) {
    const noonHours = (sunriseHours + (sunsetHours < sunriseHours ? sunsetHours + 24 : sunsetHours)) / 2 % 24;
    solarNoonStr = formatHoursToTime(noonHours);

    const lengthDiff = sunsetHours >= sunriseHours ? sunsetHours - sunriseHours : (sunsetHours + 24) - sunriseHours;
    const lH = Math.floor(lengthDiff);
    const lM = Math.round((lengthDiff - lH) * 60);
    dayLengthStr = `${lH}h ${lM}m`;
  }

  return {
    sunrise: formatHoursToTime(sunriseHours),
    sunset: formatHoursToTime(sunsetHours),
    solarNoon: solarNoonStr,
    dayLength: dayLengthStr,
    civilDawn: formatHoursToTime(dawnHours),
    civilDusk: formatHoursToTime(duskHours)
  };
}

// ==========================================
// 3. Haversine Distance & Bearing
// ==========================================

export function calculateHaversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): {
  km: number;
  miles: number;
  nauticalMiles: number;
  bearingDegrees: number;
  compassDirection: string;
  flightTimeEstimateHours: number;
} {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const rLat1 = lat1 * Math.PI / 180;
  const rLat2 = lat2 * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rLat1) * Math.cos(rLat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = Number((R * c).toFixed(2));
  const miles = Number((km * 0.621371).toFixed(2));
  const nauticalMiles = Number((km * 0.539957).toFixed(2));

  // Forward azimuth (bearing)
  const y = Math.sin(dLon) * Math.cos(rLat2);
  const x = Math.cos(rLat1) * Math.sin(rLat2) -
            Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
  let bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  const bearingDegrees = Number(bearing.toFixed(1));

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  const compassDirection = directions[index];

  // Commercial jet cruise ~800 km/h + 30 min taxi/climb
  const flightTimeEstimateHours = km > 0 ? Number(((km / 800) + 0.5).toFixed(2)) : 0;

  return {
    km,
    miles,
    nauticalMiles,
    bearingDegrees,
    compassDirection,
    flightTimeEstimateHours
  };
}

// ==========================================
// 4. GPS Coordinates Conversion (DD, DMS, DDM, UTM)
// ==========================================

export function decimalToDms(val: number, isLatitude: boolean): string {
  const dir = isLatitude ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Number(((minFloat - min) * 60).toFixed(2));
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

export function decimalToDdm(val: number, isLatitude: boolean): string {
  const dir = isLatitude ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const min = Number(((abs - deg) * 60).toFixed(4));
  return `${deg}° ${min}' ${dir}`;
}

export function parseCoordinates(input: string): { lat: number; lng: number } {
  const cleaned = input.trim();
  // Match standard decimal coordinates "37.7749, -122.4194"
  const decMatch = cleaned.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (decMatch) {
    return { lat: Number(decMatch[1]), lng: Number(decMatch[2]) };
  }

  // Fallback default
  return { lat: 0, lng: 0 };
}

export function convertCoordinates(lat: number, lng: number): {
  dd: { lat: number; lng: number; formatted: string };
  dms: { lat: string; lng: string; formatted: string };
  ddm: { lat: string; lng: string; formatted: string };
  utm: string;
} {
  const dmsLat = decimalToDms(lat, true);
  const dmsLng = decimalToDms(lng, false);
  const ddmLat = decimalToDdm(lat, true);
  const ddmLng = decimalToDdm(lng, false);

  // Approximate UTM Zone
  const zone = Math.floor((lng + 180) / 6) + 1;
  const hemisphere = lat >= 0 ? 'N' : 'S';
  const utm = `Zone ${zone}${hemisphere}`;

  return {
    dd: { lat, lng, formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}` },
    dms: { lat: dmsLat, lng: dmsLng, formatted: `${dmsLat}, ${dmsLng}` },
    ddm: { lat: ddmLat, lng: ddmLng, formatted: `${ddmLat}, ${ddmLng}` },
    utm
  };
}

// ==========================================
// 5. Date Calculator (Add/Subtract Days, Weeks, Months, Years)
// ==========================================

export function calculateDateMath(
  startDateStr: string,
  operation: 'add' | 'subtract',
  amount: number,
  unit: 'days' | 'weeks' | 'months' | 'years'
): {
  resultDate: string;
  dayOfWeek: string;
  formattedFull: string;
} {
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid start date.');
  }

  const multiplier = operation === 'subtract' ? -1 : 1;
  const delta = Math.round(amount) * multiplier;

  if (unit === 'days') {
    d.setDate(d.getDate() + delta);
  } else if (unit === 'weeks') {
    d.setDate(d.getDate() + delta * 7);
  } else if (unit === 'months') {
    d.setMonth(d.getMonth() + delta);
  } else if (unit === 'years') {
    d.setFullYear(d.getFullYear() + delta);
  }

  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const resultDate = `${yyyy}-${mm}-${dd}`;

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = daysOfWeek[d.getDay()];

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const formattedFull = `${dayOfWeek}, ${months[d.getMonth()]} ${d.getDate()}, ${yyyy}`;

  return { resultDate, dayOfWeek, formattedFull };
}

// ==========================================
// 6. World Countries Offline Dataset & Directory
// ==========================================

export interface CountryInfo {
  name: string;
  code: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  currencies: string[];
  languages: string[];
  timezones: string[];
  callingCode: string;
  tld: string;
  flagEmoji: string;
}

export const COUNTRIES_DATA: CountryInfo[] = [
  { name: 'United States', code: 'US', capital: 'Washington, D.C.', region: 'Americas', subregion: 'Northern America', population: 334914895, currencies: ['USD ($)'], languages: ['English'], timezones: ['UTC-10 to UTC-5'], callingCode: '+1', tld: '.us', flagEmoji: '🇺🇸' },
  { name: 'India', code: 'IN', capital: 'New Delhi', region: 'Asia', subregion: 'Southern Asia', population: 1428627663, currencies: ['INR (₹)'], languages: ['Hindi', 'English'], timezones: ['UTC+05:30'], callingCode: '+91', tld: '.in', flagEmoji: '🇮🇳' },
  { name: 'United Kingdom', code: 'GB', capital: 'London', region: 'Europe', subregion: 'Northern Europe', population: 67736802, currencies: ['GBP (£)'], languages: ['English'], timezones: ['UTC+00:00'], callingCode: '+44', tld: '.uk', flagEmoji: '🇬🇧' },
  { name: 'Canada', code: 'CA', capital: 'Ottawa', region: 'Americas', subregion: 'Northern America', population: 40097761, currencies: ['CAD ($)'], languages: ['English', 'French'], timezones: ['UTC-8 to UTC-3.5'], callingCode: '+1', tld: '.ca', flagEmoji: '🇨🇦' },
  { name: 'Australia', code: 'AU', capital: 'Canberra', region: 'Oceania', subregion: 'Australia and New Zealand', population: 26439111, currencies: ['AUD ($)'], languages: ['English'], timezones: ['UTC+8 to UTC+11'], callingCode: '+61', tld: '.au', flagEmoji: '🇦🇺' },
  { name: 'Germany', code: 'DE', capital: 'Berlin', region: 'Europe', subregion: 'Western Europe', population: 84482267, currencies: ['EUR (€)'], languages: ['German'], timezones: ['UTC+01:00'], callingCode: '+49', tld: '.de', flagEmoji: '🇩🇪' },
  { name: 'France', code: 'FR', capital: 'Paris', region: 'Europe', subregion: 'Western Europe', population: 68170228, currencies: ['EUR (€)'], languages: ['French'], timezones: ['UTC+01:00'], callingCode: '+33', tld: '.fr', flagEmoji: '🇫🇷' },
  { name: 'Japan', code: 'JP', capital: 'Tokyo', region: 'Asia', subregion: 'Eastern Asia', population: 124516650, currencies: ['JPY (¥)'], languages: ['Japanese'], timezones: ['UTC+09:00'], callingCode: '+81', tld: '.jp', flagEmoji: '🇯🇵' },
  { name: 'China', code: 'CN', capital: 'Beijing', region: 'Asia', subregion: 'Eastern Asia', population: 1411750000, currencies: ['CNY (¥)'], languages: ['Mandarin'], timezones: ['UTC+08:00'], callingCode: '+86', tld: '.cn', flagEmoji: '🇨🇳' },
  { name: 'Brazil', code: 'BR', capital: 'Brasília', region: 'Americas', subregion: 'South America', population: 216422446, currencies: ['BRL (R$)'], languages: ['Portuguese'], timezones: ['UTC-5 to UTC-2'], callingCode: '+55', tld: '.br', flagEmoji: '🇧🇷' },
  { name: 'United Arab Emirates', code: 'AE', capital: 'Abu Dhabi', region: 'Asia', subregion: 'Western Asia', population: 9516871, currencies: ['AED (د.إ)'], languages: ['Arabic'], timezones: ['UTC+04:00'], callingCode: '+971', tld: '.ae', flagEmoji: '🇦🇪' },
  { name: 'Singapore', code: 'SG', capital: 'Singapore', region: 'Asia', subregion: 'South-Eastern Asia', population: 5917600, currencies: ['SGD ($)'], languages: ['English', 'Malay', 'Mandarin', 'Tamil'], timezones: ['UTC+08:00'], callingCode: '+65', tld: '.sg', flagEmoji: '🇸🇬' },
  { name: 'South Africa', code: 'ZA', capital: 'Pretoria', region: 'Africa', subregion: 'Southern Africa', population: 60414495, currencies: ['ZAR (R)'], languages: ['Zulu', 'Xhosa', 'Afrikaans', 'English'], timezones: ['UTC+02:00'], callingCode: '+27', tld: '.za', flagEmoji: '🇿🇦' },
  { name: 'Italy', code: 'IT', capital: 'Rome', region: 'Europe', subregion: 'Southern Europe', population: 58870762, currencies: ['EUR (€)'], languages: ['Italian'], timezones: ['UTC+01:00'], callingCode: '+39', tld: '.it', flagEmoji: '🇮🇹' },
  { name: 'Spain', code: 'ES', capital: 'Madrid', region: 'Europe', subregion: 'Southern Europe', population: 48059777, currencies: ['EUR (€)'], languages: ['Spanish'], timezones: ['UTC+01:00'], callingCode: '+34', tld: '.es', flagEmoji: '🇪🇸' },
  { name: 'Switzerland', code: 'CH', capital: 'Bern', region: 'Europe', subregion: 'Western Europe', population: 8853482, currencies: ['CHF (Fr)'], languages: ['German', 'French', 'Italian', 'Romansh'], timezones: ['UTC+01:00'], callingCode: '+41', tld: '.ch', flagEmoji: '🇨🇭' }
];

export function searchCountries(query: string): CountryInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return COUNTRIES_DATA;
  return COUNTRIES_DATA.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase() === q ||
      c.capital.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.callingCode.includes(q)
  );
}
