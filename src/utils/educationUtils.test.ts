import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGpa,
  calculateTargetGpa,
  calculateMarks,
  calculateWeightedGrade,
  solveLinearEquation,
  solveQuadraticEquation,
  solveLinearSystem2,
  formatCitation,
  searchElements
} from './educationUtils.ts';

describe('Education & Student Utilities Unit Tests', () => {
  it('calculateGpa handles standard 4.0 scale accurately', () => {
    const courses = [
      { name: 'Calculus', credits: 4, grade: 'A' },
      { name: 'Physics', credits: 4, grade: 'B' },
      { name: 'Computer Science', credits: 3, grade: 'A-' }
    ];
    // (4*4.0 + 4*3.0 + 3*3.7) = 16 + 12 + 11.1 = 39.1 / 11 = 3.5545... -> 3.55
    const res = calculateGpa(courses, '4.0');
    assert.equal(res.totalCredits, 11);
    assert.equal(res.gpa, 3.55);
  });

  it('calculateTargetGpa calculates required GPA for desired cumulative standing', () => {
    // Current: 60 credits at 3.20. Target: 3.50 after 30 more credits.
    // Total credits: 90. Total points: 90 * 3.5 = 315.
    // Current points: 60 * 3.2 = 192.
    // Needed: 315 - 192 = 123 / 30 = 4.10 -> impossible on 4.0 scale
    const res = calculateTargetGpa(3.20, 60, 3.50, 30, 4.0);
    assert.equal(res.requiredGpa, 4.1);
    assert.equal(res.achievable, false);

    const realistic = calculateTargetGpa(3.20, 60, 3.40, 30, 4.0);
    // (90*3.4 - 192) / 30 = (306 - 192) / 30 = 114 / 30 = 3.80
    assert.equal(realistic.requiredGpa, 3.8);
    assert.equal(realistic.achievable, true);
  });

  it('calculateMarks computes marks totals, percentages and passing status', () => {
    const subjects = [
      { name: 'Math', marksObtained: 85, maxMarks: 100 },
      { name: 'Science', marksObtained: 90, maxMarks: 100 },
      { name: 'English', marksObtained: 75, maxMarks: 100 }
    ];
    const res = calculateMarks(subjects);
    assert.equal(res.totalObtained, 250);
    assert.equal(res.totalMax, 300);
    assert.equal(res.percentage, 83.33);
    assert.equal(res.passed, true);
    assert.equal(res.grade, 'A');
  });

  it('calculateWeightedGrade calculates overall grade and final exam needed', () => {
    const items = [
      { name: 'Homework', score: 90, maxScore: 100, weight: 20 },
      { name: 'Midterm', score: 80, maxScore: 100, weight: 30 }
    ];
    // Current weighted: 0.90*20 + 0.80*30 = 18 + 24 = 42 out of 50 weight
    // Percentage = (42 / 50) * 100 = 84% (B)
    // To achieve 85% overall with final exam weight 50%:
    // (85 - 42) / 0.5 = 43 / 0.5 = 86%
    const res = calculateWeightedGrade(items, 85, 50);
    assert.equal(res.currentWeightedScore, 42);
    assert.equal(res.currentPercentage, 84);
    assert.equal(res.letterGrade, 'B');
    assert.equal(res.requiredFinalScore, 86);
  });

  it('solveLinearEquation solves ax + b = c properly', () => {
    // 3x + 5 = 20 -> 3x = 15 -> x = 5
    const res = solveLinearEquation(3, 5, 20);
    assert.equal(res.x, 5);
    assert.ok(res.steps.length > 0);
  });

  it('solveQuadraticEquation finds real roots and vertex', () => {
    // x² - 5x + 6 = 0 -> roots 3 and 2
    const res = solveQuadraticEquation(1, -5, 6);
    assert.equal(res.discriminant, 1);
    assert.equal(res.roots.length, 2);
    assert.equal(res.roots[0].real, 3);
    assert.equal(res.roots[1].real, 2);
    assert.equal(res.vertex.x, 2.5);
    assert.equal(res.vertex.y, -0.25);
  });

  it('solveLinearSystem2 solves 2x2 linear equations using Cramer rule', () => {
    // 2x + 3y = 8
    // 1x - y = -1
    // det = -2 - 3 = -5
    // detX = -8 - (-3) = -5 -> x = 1
    // detY = -2 - 8 = -10 -> y = 2
    const res = solveLinearSystem2(2, 3, 8, 1, -1, -1);
    assert.equal(res.status, 'unique');
    assert.ok(res.solution);
    assert.equal(res.solution.x, 1);
    assert.equal(res.solution.y, 2);
  });

  it('formatCitation formats APA, MLA and Chicago styles', () => {
    const book = {
      authors: 'Knuth, Donald E.',
      title: 'The Art of Computer Programming',
      year: '1968',
      sourceOrPublisher: 'Addison-Wesley'
    };
    const apa = formatCitation('book', book, 'apa');
    assert.ok(apa.includes('Knuth, Donald E. (1968). *The Art of Computer Programming*. Addison-Wesley.'));

    const mla = formatCitation('book', book, 'mla');
    assert.ok(mla.includes('Knuth, Donald E. *The Art of Computer Programming*. Addison-Wesley, 1968.'));
  });

  it('searchElements finds chemical elements by query', () => {
    const gold = searchElements('Gold');
    assert.equal(gold.length, 1);
    assert.equal(gold[0].symbol, 'Au');
    assert.equal(gold[0].number, 79);

    const gases = searchElements('noble gas');
    assert.ok(gases.length >= 3);
  });
});
