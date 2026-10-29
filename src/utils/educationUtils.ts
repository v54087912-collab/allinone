/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. GPA & Grade Calculations
// ==========================================

export interface CourseGrade {
  id?: string;
  name: string;
  credits: number;
  grade: string;
}

export const GRADE_SCALE_4_0: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

export const GRADE_SCALE_5_0: Record<string, number> = {
  'A+': 5.0, 'A': 5.0, 'A-': 4.5,
  'B+': 4.0, 'B': 3.5, 'B-': 3.0,
  'C+': 2.5, 'C': 2.0, 'C-': 1.5,
  'D+': 1.0, 'D': 0.5, 'F': 0.0
};

export const GRADE_SCALE_10_0: Record<string, number> = {
  'O': 10.0, 'A+': 9.0, 'A': 8.0,
  'B+': 7.0, 'B': 6.0, 'C': 5.0,
  'P': 4.0, 'F': 0.0
};

export function calculateGpa(
  courses: CourseGrade[],
  scale: '4.0' | '5.0' | '10.0' = '4.0'
): { gpa: number; totalCredits: number; qualityPoints: number } {
  const scaleMap = scale === '5.0' ? GRADE_SCALE_5_0 : scale === '10.0' ? GRADE_SCALE_10_0 : GRADE_SCALE_4_0;
  let totalCredits = 0;
  let qualityPoints = 0;

  for (const c of courses) {
    const cred = Math.max(0, Number(c.credits) || 0);
    const gradeUpper = (c.grade || '').trim().toUpperCase();
    const pts = scaleMap[gradeUpper] ?? (Number(c.grade) || 0);
    qualityPoints += cred * pts;
    totalCredits += cred;
  }

  const gpa = totalCredits > 0 ? Number((qualityPoints / totalCredits).toFixed(2)) : 0;
  return { gpa, totalCredits, qualityPoints: Number(qualityPoints.toFixed(2)) };
}

export function calculateTargetGpa(
  currentGpa: number,
  currentCredits: number,
  targetGpa: number,
  remainingCredits: number,
  maxGpaScale: number = 4.0
): { requiredGpa: number; achievable: boolean } {
  if (remainingCredits <= 0) {
    return { requiredGpa: 0, achievable: currentGpa >= targetGpa };
  }
  const totalCredits = currentCredits + remainingCredits;
  const targetTotalPoints = targetGpa * totalCredits;
  const currentPoints = currentGpa * currentCredits;
  const requiredPoints = targetTotalPoints - currentPoints;
  const requiredGpa = Number((requiredPoints / remainingCredits).toFixed(2));
  const achievable = requiredGpa >= 0 && requiredGpa <= maxGpaScale;
  return { requiredGpa, achievable };
}

// ==========================================
// 2. Marks & Weighted Grade Calculator
// ==========================================

export interface SubjectMarks {
  name: string;
  marksObtained: number;
  maxMarks: number;
  passingMarks?: number;
}

export function calculateMarks(subjects: SubjectMarks[]): {
  totalObtained: number;
  totalMax: number;
  percentage: number;
  passed: boolean;
  grade: string;
} {
  let totalObtained = 0;
  let totalMax = 0;
  let passed = true;

  for (const s of subjects) {
    const obt = Math.max(0, Number(s.marksObtained) || 0);
    const max = Math.max(1, Number(s.maxMarks) || 100);
    const pass = s.passingMarks ?? Math.round(max * 0.4);
    totalObtained += obt;
    totalMax += max;
    if (obt < pass) passed = false;
  }

  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';
  else if (percentage >= 40) grade = 'E';

  return { totalObtained, totalMax, percentage, passed, grade };
}

export interface WeightedItem {
  name: string;
  score: number;
  maxScore: number;
  weight: number; // percentage, e.g. 20 for 20%
}

export function calculateWeightedGrade(
  items: WeightedItem[],
  targetGradePercent?: number,
  finalWeight?: number
): {
  currentWeightedScore: number;
  currentPercentage: number;
  letterGrade: string;
  requiredFinalScore?: number;
} {
  let totalWeight = 0;
  let weightedPoints = 0;

  for (const item of items) {
    const s = Math.max(0, Number(item.score) || 0);
    const m = Math.max(1, Number(item.maxScore) || 100);
    const w = Math.max(0, Number(item.weight) || 0);
    weightedPoints += (s / m) * w;
    totalWeight += w;
  }

  const currentPercentage = totalWeight > 0 ? Number(((weightedPoints / totalWeight) * 100).toFixed(2)) : 0;
  let letterGrade = 'F';
  if (currentPercentage >= 93) letterGrade = 'A';
  else if (currentPercentage >= 90) letterGrade = 'A-';
  else if (currentPercentage >= 87) letterGrade = 'B+';
  else if (currentPercentage >= 83) letterGrade = 'B';
  else if (currentPercentage >= 80) letterGrade = 'B-';
  else if (currentPercentage >= 77) letterGrade = 'C+';
  else if (currentPercentage >= 70) letterGrade = 'C';
  else if (currentPercentage >= 60) letterGrade = 'D';

  let requiredFinalScore: number | undefined;
  if (targetGradePercent !== undefined && finalWeight !== undefined && finalWeight > 0) {
    // target = weightedPoints + (finalScore/100)*finalWeight
    const needed = (targetGradePercent - weightedPoints) / (finalWeight / 100);
    requiredFinalScore = Number(needed.toFixed(2));
  }

  return {
    currentWeightedScore: Number(weightedPoints.toFixed(2)),
    currentPercentage,
    letterGrade,
    requiredFinalScore
  };
}

// ==========================================
// 3. Equation Solvers (Linear, Quadratic, 2x2 System)
// ==========================================

export function solveLinearEquation(a: number, b: number, c: number): { x: number; steps: string[] } {
  if (a === 0) {
    throw new Error('Coefficient "a" cannot be zero in a linear equation ax + b = c.');
  }
  const steps: string[] = [
    `Given equation: ${a}x + (${b}) = ${c}`,
    `Subtract ${b} from both sides: ${a}x = ${c - b}`,
    `Divide both sides by ${a}: x = (${c - b}) / ${a}`
  ];
  const x = Number(((c - b) / a).toFixed(6));
  steps.push(`Result: x = ${x}`);
  return { x, steps };
}

export function solveQuadraticEquation(a: number, b: number, c: number): {
  discriminant: number;
  roots: Array<{ real: number; imag: number; formatted: string }>;
  vertex: { x: number; y: number };
  steps: string[];
} {
  if (a === 0) {
    throw new Error('Coefficient "a" cannot be zero in a quadratic equation ax² + bx + c = 0.');
  }
  const d = b * b - 4 * a * c;
  const vertexX = Number((-b / (2 * a)).toFixed(6));
  const vertexY = Number((a * vertexX * vertexX + b * vertexX + c).toFixed(6));
  const steps: string[] = [
    `Equation: ${a}x² + (${b})x + (${c}) = 0`,
    `Discriminant Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${d}`
  ];

  const roots: Array<{ real: number; imag: number; formatted: string }> = [];

  if (d > 0) {
    const sqrtD = Math.sqrt(d);
    const r1 = Number(((-b + sqrtD) / (2 * a)).toFixed(6));
    const r2 = Number(((-b - sqrtD) / (2 * a)).toFixed(6));
    roots.push({ real: r1, imag: 0, formatted: `${r1}` });
    roots.push({ real: r2, imag: 0, formatted: `${r2}` });
    steps.push(`Since Δ > 0, there are two distinct real roots:`);
    steps.push(`x₁ = (-(${b}) + √${d}) / 2(${a}) = ${r1}`);
    steps.push(`x₂ = (-(${b}) - √${d}) / 2(${a}) = ${r2}`);
  } else if (d === 0) {
    const r = Number((-b / (2 * a)).toFixed(6));
    roots.push({ real: r, imag: 0, formatted: `${r}` });
    steps.push(`Since Δ = 0, there is one repeated real root:`);
    steps.push(`x = -(${b}) / 2(${a}) = ${r}`);
  } else {
    const realPart = Number((-b / (2 * a)).toFixed(6));
    const imagPart = Number((Math.sqrt(-d) / (2 * Math.abs(a))).toFixed(6));
    roots.push({ real: realPart, imag: imagPart, formatted: `${realPart} + ${imagPart}i` });
    roots.push({ real: realPart, imag: -imagPart, formatted: `${realPart} - ${imagPart}i` });
    steps.push(`Since Δ < 0, there are two complex conjugate roots:`);
    steps.push(`x = ${realPart} ± ${imagPart}i`);
  }

  steps.push(`Parabola Vertex: (${vertexX}, ${vertexY})`);

  return {
    discriminant: Number(d.toFixed(6)),
    roots,
    vertex: { x: vertexX, y: vertexY },
    steps
  };
}

export function solveLinearSystem2(
  a1: number, b1: number, c1: number,
  a2: number, b2: number, c2: number
): {
  solution?: { x: number; y: number };
  status: 'unique' | 'infinite' | 'none';
  steps: string[];
} {
  const det = a1 * b2 - a2 * b1;
  const detX = c1 * b2 - c2 * b1;
  const detY = a1 * c2 - a2 * c1;

  const steps: string[] = [
    `System:\n1) ${a1}x + ${b1}y = ${c1}\n2) ${a2}x + ${b2}y = ${c2}`,
    `Determinant D = (${a1})(${b2}) - (${a2})(${b1}) = ${det}`
  ];

  if (Math.abs(det) < 1e-9) {
    if (Math.abs(detX) < 1e-9 && Math.abs(detY) < 1e-9) {
      steps.push('D = 0 and Dx = Dy = 0: Infinitely many solutions (dependent lines).');
      return { status: 'infinite', steps };
    } else {
      steps.push('D = 0 but Dx or Dy ≠ 0: No solution (parallel inconsistent lines).');
      return { status: 'none', steps };
    }
  }

  const x = Number((detX / det).toFixed(6));
  const y = Number((detY / det).toFixed(6));
  steps.push(`Dx = (${c1})(${b2}) - (${c2})(${b1}) = ${detX}`);
  steps.push(`Dy = (${a1})(${c2}) - (${a2})(${c1}) = ${detY}`);
  steps.push(`x = Dx / D = ${x}`);
  steps.push(`y = Dy / D = ${y}`);

  return { solution: { x, y }, status: 'unique', steps };
}

// ==========================================
// 4. Academic Citation Generator
// ==========================================

export interface CitationData {
  authors?: string; // e.g., "Smith, John and Doe, Jane"
  title: string;
  year?: string;
  sourceOrPublisher?: string; // Book publisher or Website name or Journal title
  volume?: string;
  issue?: string;
  pages?: string;
  urlOrDoi?: string;
  accessDate?: string;
}

export function formatCitation(
  type: 'book' | 'website' | 'journal',
  data: CitationData,
  style: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee'
): string {
  let author = (data.authors || 'Anonymous').trim();
  if (author.endsWith('.')) {
    author = author.slice(0, -1);
  }
  const year = (data.year || 'n.d.').trim();
  const title = (data.title || 'Untitled').trim();
  const pub = (data.sourceOrPublisher || '').trim();
  const url = (data.urlOrDoi || '').trim();

  switch (style) {
    case 'apa': // APA 7th
      if (type === 'book') {
        return `${author}. (${year}). *${title}*${pub ? `. ${pub}` : ''}.${url ? ` ${url}` : ''}`;
      } else if (type === 'journal') {
        const vol = data.volume ? ` *${data.volume}*` : '';
        const iss = data.issue ? `(${data.issue})` : '';
        const pgs = data.pages ? `, ${data.pages}` : '';
        return `${author}. (${year}). ${title}. *${pub}*${vol}${iss}${pgs}.${url ? ` ${url}` : ''}`;
      } else {
        return `${author}. (${year}). *${title}*. ${pub}.${url ? ` Retrieved from ${url}` : ''}`;
      }

    case 'mla': // MLA 9th
      if (type === 'book') {
        return `${author}. *${title}*. ${pub ? `${pub}, ` : ''}${year}.`;
      } else if (type === 'journal') {
        const vol = data.volume ? `, vol. ${data.volume}` : '';
        const iss = data.issue ? `, no. ${data.issue}` : '';
        const pgs = data.pages ? `, pp. ${data.pages}` : '';
        return `${author}. "${title}." *${pub}*${vol}${iss}, ${year}${pgs}.${url ? ` ${url}` : ''}`;
      } else {
        return `${author}. "${title}." *${pub}*, ${year}${url ? `, ${url}` : ''}.`;
      }

    case 'chicago': // Chicago 17th
      if (type === 'book') {
        return `${author}. ${year}. *${title}*. ${pub ? `${pub}.` : ''}`;
      } else if (type === 'journal') {
        const vol = data.volume ? ` ${data.volume}` : '';
        const iss = data.issue ? `, no. ${data.issue}` : '';
        const pgs = data.pages ? `: ${data.pages}` : '';
        return `${author}. "${title}." *${pub}*${vol}${iss} (${year})${pgs}.${url ? ` ${url}` : ''}`;
      } else {
        return `${author}. "${title}." ${pub}. Accessed ${data.accessDate || 'recently'}. ${url}.`;
      }

    case 'harvard':
      return `${author} (${year}) *${title}*${pub ? `, ${pub}` : ''}${url ? `, available at: ${url}` : ''}.`;

    case 'ieee':
      return `[1] ${author}, "${title}," *${pub}*${data.volume ? `, vol. ${data.volume}` : ''}, ${year}${url ? `, [Online]. Available: ${url}` : ''}.`;

    default:
      return `${author} (${year}). ${title}. ${pub}.`;
  }
}

// ==========================================
// 5. Periodic Table Complete Elements Dataset
// ==========================================

export interface ChemicalElement {
  number: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: string;
  period: number;
  group: number;
  electronConfig: string;
  summary: string;
}

export const PERIODIC_TABLE: ChemicalElement[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', atomicMass: 1.008, category: 'reactive nonmetal', period: 1, group: 1, electronConfig: '1s¹', summary: 'The lightest and most abundant chemical substance in the universe.' },
  { number: 2, symbol: 'He', name: 'Helium', atomicMass: 4.0026, category: 'noble gas', period: 1, group: 18, electronConfig: '1s²', summary: 'Colorless, odorless, inert noble gas second most abundant in the cosmos.' },
  { number: 3, symbol: 'Li', name: 'Lithium', atomicMass: 6.94, category: 'alkali metal', period: 2, group: 1, electronConfig: '[He] 2s¹', summary: 'Soft, silvery-white alkali metal used widely in rechargeable batteries.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', atomicMass: 9.0122, category: 'alkaline earth metal', period: 2, group: 2, electronConfig: '[He] 2s²', summary: 'Relatively rare metal in the universe, forms emerald and aquamarine minerals.' },
  { number: 5, symbol: 'B', name: 'Boron', atomicMass: 10.81, category: 'metalloid', period: 2, group: 13, electronConfig: '[He] 2s² 2p¹', summary: 'Low-abundance metalloid used in fiberglass, ceramics, and semiconductors.' },
  { number: 6, symbol: 'C', name: 'Carbon', atomicMass: 12.011, category: 'reactive nonmetal', period: 2, group: 14, electronConfig: '[He] 2s² 2p²', summary: 'Basis of all known organic life, forming diamond, graphite, and graphene.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', atomicMass: 14.007, category: 'reactive nonmetal', period: 2, group: 15, electronConfig: '[He] 2s² 2p³', summary: 'Makes up roughly 78% of Earth\'s atmosphere, essential for amino acids.' },
  { number: 8, symbol: 'O', name: 'Oxygen', atomicMass: 15.999, category: 'reactive nonmetal', period: 2, group: 16, electronConfig: '[He] 2s² 2p⁴', summary: 'Crucial element for cellular respiration in aerobic organisms, 21% of air.' },
  { number: 9, symbol: 'F', name: 'Fluorine', atomicMass: 18.998, category: 'reactive nonmetal', period: 2, group: 17, electronConfig: '[He] 2s² 2p⁵', summary: 'Extremely reactive and electronegative halogen gas.' },
  { number: 10, symbol: 'Ne', name: 'Neon', atomicMass: 20.180, category: 'noble gas', period: 2, group: 18, electronConfig: '[He] 2s² 2p⁶', summary: 'Inert gas producing an orange-red glow in high-voltage electrical discharge.' },
  { number: 11, symbol: 'Na', name: 'Sodium', atomicMass: 22.990, category: 'alkali metal', period: 3, group: 1, electronConfig: '[Ne] 3s¹', summary: 'Highly reactive soft metal; forms table salt when combined with chlorine.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', atomicMass: 24.305, category: 'alkaline earth metal', period: 3, group: 2, electronConfig: '[Ne] 3s²', summary: 'Essential mineral in biology and key component of lightweight structural alloys.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', atomicMass: 26.982, category: 'post-transition metal', period: 3, group: 13, electronConfig: '[Ne] 3s² 3p¹', summary: 'Abundant crust metal with high corrosion resistance and low density.' },
  { number: 14, symbol: 'Si', name: 'Silicon', atomicMass: 28.085, category: 'metalloid', period: 3, group: 14, electronConfig: '[Ne] 3s² 3p²', summary: 'Semiconductor foundation of modern microchips and second most abundant crust element.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', atomicMass: 30.974, category: 'reactive nonmetal', period: 3, group: 15, electronConfig: '[Ne] 3s² 3p³', summary: 'Vital for DNA, RNA, ATP cellular energy transfer, and fertilizers.' },
  { number: 16, symbol: 'S', name: 'Sulfur', atomicMass: 32.06, category: 'reactive nonmetal', period: 3, group: 16, electronConfig: '[Ne] 3s² 3p⁴', summary: 'Bright yellow crystalline solid used in gunpowder, matches, and sulfuric acid.' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', atomicMass: 35.45, category: 'reactive nonmetal', period: 3, group: 17, electronConfig: '[Ne] 3s² 3p⁵', summary: 'Yellow-green halogen gas utilized as disinfectant and in PVC plastic.' },
  { number: 18, symbol: 'Ar', name: 'Argon', atomicMass: 39.948, category: 'noble gas', period: 3, group: 18, electronConfig: '[Ne] 3s² 3p⁶', summary: 'Third-most abundant gas in Earth\'s atmosphere, used as inert shielding gas in welding.' },
  { number: 19, symbol: 'K', name: 'Potassium', atomicMass: 39.098, category: 'alkali metal', period: 4, group: 1, electronConfig: '[Ar] 4s¹', summary: 'Essential nutrient for nerve transmission and heart function in all animals.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', atomicMass: 40.078, category: 'alkaline earth metal', period: 4, group: 2, electronConfig: '[Ar] 4s²', summary: 'Fifth most abundant element in Earth\'s crust, key component of bones and shells.' },
  { number: 26, symbol: 'Fe', name: 'Iron', atomicMass: 55.845, category: 'transition metal', period: 4, group: 8, electronConfig: '[Ar] 3d⁶ 4s²', summary: 'Most common element on Earth by mass, core element of steel and hemoglobin.' },
  { number: 29, symbol: 'Cu', name: 'Copper', atomicMass: 63.546, category: 'transition metal', period: 4, group: 11, electronConfig: '[Ar] 3d¹⁰ 4s¹', summary: 'High electrical and thermal conductivity metal used for wiring and coins.' },
  { number: 30, symbol: 'Zn', name: 'Zinc', atomicMass: 65.38, category: 'transition metal', period: 4, group: 12, electronConfig: '[Ar] 3d¹⁰ 4s²', summary: 'Corrosion-resistant metal used for galvanizing steel and in brass.' },
  { number: 47, symbol: 'Ag', name: 'Silver', atomicMass: 107.87, category: 'transition metal', period: 5, group: 11, electronConfig: '[Kr] 4d¹⁰ 5s¹', summary: 'Highest electrical conductivity, thermal conductivity, and reflectivity of all metals.' },
  { number: 79, symbol: 'Au', name: 'Gold', atomicMass: 196.97, category: 'transition metal', period: 6, group: 11, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', summary: 'Dense, corrosion-proof precious noble metal valued across human history.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', atomicMass: 200.59, category: 'transition metal', period: 6, group: 12, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', summary: 'Only metallic element that is liquid at standard temperature and pressure.' },
  { number: 92, symbol: 'U', name: 'Uranium', atomicMass: 238.03, category: 'actinide', period: 7, group: 3, electronConfig: '[Rn] 5f³ 6d¹ 7s²', summary: 'Radioactive heavy metal used as nuclear fuel for electricity generation.' }
];

export function searchElements(query: string): ChemicalElement[] {
  const q = query.toLowerCase().trim();
  if (!q) return PERIODIC_TABLE;
  return PERIODIC_TABLE.filter(
    el =>
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase() === q ||
      el.number.toString() === q ||
      el.category.toLowerCase().includes(q)
  );
}
