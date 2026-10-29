/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initFlashcardMaker(): void {
  const frontInput = document.getElementById('card-front') as HTMLInputElement | null;
  const backInput = document.getElementById('card-back') as HTMLInputElement | null;
  const addCardBtn = document.getElementById('add-card-btn') as HTMLButtonElement | null;
  const flipCardArea = document.getElementById('flashcard') as HTMLDivElement | null;
  const cardContent = document.getElementById('card-text') as HTMLDivElement | null;
  const cardBadge = document.getElementById('card-side-badge') as HTMLSpanElement | null;
  const progressText = document.getElementById('card-counter') as HTMLSpanElement | null;
  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement | null;
  const shuffleBtn = document.getElementById('shuffle-btn') as HTMLButtonElement | null;
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement | null;

  interface Flashcard {
    front: string;
    back: string;
  }

  const STORAGE_KEY = 'toolora_flashcards';
  let cards: Flashcard[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!cards.length) {
    cards = [
      { front: 'What is photosynthesis?', back: 'The biological process by which plants use sunlight to synthesize nutrients from CO₂ and water.' },
      { front: 'Formula for Newton\'s Second Law', back: 'F = m × a (Force = Mass × Acceleration)' },
      { front: 'Capital of Australia', back: 'Canberra' }
    ];
  }

  let currentIndex = 0;
  let isFlipped = false;

  function updateCard() {
    if (!cards.length) {
      if (cardContent) cardContent.textContent = 'No cards available. Add one above!';
      if (progressText) progressText.textContent = '0 / 0';
      return;
    }
    const current = cards[currentIndex];
    if (cardContent) {
      cardContent.textContent = isFlipped ? current.back : current.front;
    }
    if (cardBadge) {
      cardBadge.textContent = isFlipped ? 'ANSWER (BACK)' : 'QUESTION (FRONT)';
      cardBadge.className = isFlipped ? 'px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    }
    if (progressText) {
      progressText.textContent = `Card ${currentIndex + 1} of ${cards.length}`;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }

  if (flipCardArea) {
    flipCardArea.addEventListener('click', () => {
      isFlipped = !isFlipped;
      updateCard();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (cards.length) {
        currentIndex = (currentIndex + 1) % cards.length;
        isFlipped = false;
        updateCard();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (cards.length) {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        isFlipped = false;
        updateCard();
      }
    });
  }

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      cards.sort(() => Math.random() - 0.5);
      currentIndex = 0;
      isFlipped = false;
      updateCard();
    });
  }

  if (addCardBtn && frontInput && backInput) {
    addCardBtn.addEventListener('click', () => {
      const front = frontInput.value.trim();
      const back = backInput.value.trim();
      if (!front || !back) return;
      cards.push({ front, back });
      frontInput.value = '';
      backInput.value = '';
      currentIndex = cards.length - 1;
      isFlipped = false;
      updateCard();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flashcards.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  updateCard();
}

document.addEventListener('DOMContentLoaded', initFlashcardMaker);
