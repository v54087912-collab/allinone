/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initQuizGenerator(): void {
  const textInput = document.getElementById('notes-input') as HTMLTextAreaElement | null;
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement | null;
  const quizContainer = document.getElementById('quiz-view') as HTMLDivElement | null;
  const questionBox = document.getElementById('question-box') as HTMLDivElement | null;
  const optionsBox = document.getElementById('options-box') as HTMLDivElement | null;
  const scoreReport = document.getElementById('score-report') as HTMLDivElement | null;
  const scoreValue = document.getElementById('score-val') as HTMLHeadingElement | null;

  interface Question {
    text: string;
    options: string[];
    correctIndex: number;
  }

  let questions: Question[] = [];
  let currentIdx = 0;
  let score = 0;

  if (generateBtn && textInput) {
    generateBtn.addEventListener('click', () => {
      const text = textInput.value.trim();
      if (!text) {
        alert('Please enter study notes or content to generate quiz.');
        return;
      }

      // Generate questions from bullet points or sentences
      const sentences = text
        .split(/[.\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      if (sentences.length < 2) {
        alert('Please provide at least 2 complete sentences to generate quiz questions.');
        return;
      }

      questions = sentences.slice(0, 5).map((sentence, idx) => {
        const words = sentence.split(' ');
        const keyWord = words.find(w => w.length > 5) || words[Math.floor(words.length / 2)];
        const qText = sentence.replace(keyWord, '________');
        const distractors = ['Variable', 'Hypothesis', 'Constant', 'Synthesis', 'Equation'].filter(d => d.toLowerCase() !== keyWord.toLowerCase());

        const options = [keyWord, distractors[0], distractors[1], distractors[2]].sort(() => Math.random() - 0.5);
        return {
          text: `Q${idx + 1}: Fill in the blank: "${qText}"`,
          options,
          correctIndex: options.indexOf(keyWord)
        };
      });

      currentIdx = 0;
      score = 0;
      if (scoreReport) scoreReport.classList.add('hidden');
      if (quizContainer) quizContainer.classList.remove('hidden');
      renderQuestion();
    });
  }

  function renderQuestion() {
    if (currentIdx >= questions.length) {
      if (quizContainer) quizContainer.classList.add('hidden');
      if (scoreReport) {
        scoreReport.classList.remove('hidden');
        if (scoreValue) scoreValue.textContent = `${score} / ${questions.length} (${Math.round((score / questions.length) * 100)}%)`;
      }
      return;
    }

    const q = questions[currentIdx];
    if (questionBox) questionBox.textContent = q.text;
    if (optionsBox) {
      optionsBox.innerHTML = '';
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-sm font-medium transition-colors cursor-pointer';
        btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
        btn.addEventListener('click', () => {
          if (idx === q.correctIndex) {
            score++;
          }
          currentIdx++;
          renderQuestion();
        });
        optionsBox.appendChild(btn);
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', initQuizGenerator);
