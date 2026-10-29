/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initRandomQuestionPicker(): void {
  const questionsInput = document.getElementById('questions-bank') as HTMLTextAreaElement | null;
  const pickBtn = document.getElementById('pick-btn') as HTMLButtonElement | null;
  const pickedCard = document.getElementById('picked-card') as HTMLDivElement | null;
  const questionDisplay = document.getElementById('picked-text') as HTMLHeadingElement | null;

  if (pickBtn && questionsInput) {
    pickBtn.addEventListener('click', () => {
      const lines = questionsInput.value
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      if (!lines.length) {
        alert('Please enter at least one question in the bank.');
        return;
      }

      const randomQ = lines[Math.floor(Math.random() * lines.length)];
      if (questionDisplay) questionDisplay.textContent = randomQ;
      if (pickedCard) pickedCard.classList.remove('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', initRandomQuestionPicker);
