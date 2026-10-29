/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'toolora_notes_app';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [
    {
      id: 'note-1',
      title: 'Welcome to Notes App',
      content: '# Welcome to your private scratchpad!\n\n- All notes are saved automatically in your browser.\n- No data is ever uploaded to a server.\n- Supports instant search, word count, pinning, and Markdown/TXT export.',
      category: 'General',
      pinned: true,
      updatedAt: Date.now(),
    },
    {
      id: 'note-2',
      title: 'Project Roadmap Ideas',
      content: '1. Launch productivity suite\n2. Integrate offline backup/restore\n3. Ensure high accessibility & responsive design',
      category: 'Work',
      pinned: false,
      updatedAt: Date.now() - 3600000,
    },
  ];
}

function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let notes = loadNotes();
  let activeNoteId: string = notes[0]?.id || '';
  let searchQuery = '';

  const notesListEl = document.getElementById('notes-sidebar-list');
  const newNoteBtn = document.getElementById('note-new-btn');
  const searchInput = document.getElementById('note-search-input') as HTMLInputElement | null;

  // Editor DOM
  const titleInput = document.getElementById('note-title-input') as HTMLInputElement | null;
  const categorySelect = document.getElementById('note-category-select') as HTMLSelectElement | null;
  const pinBtn = document.getElementById('note-pin-btn');
  const deleteBtn = document.getElementById('note-delete-btn');
  const contentArea = document.getElementById('note-content-area') as HTMLTextAreaElement | null;
  const wordCountEl = document.getElementById('note-word-count');
  const charCountEl = document.getElementById('note-char-count');
  const lastSavedEl = document.getElementById('note-last-saved');

  // Exports
  const exportMdBtn = document.getElementById('note-export-md-btn');
  const exportTxtBtn = document.getElementById('note-export-txt-btn');
  const exportAllJsonBtn = document.getElementById('note-export-all-btn');

  function getActiveNote(): Note | undefined {
    return notes.find((n) => n.id === activeNoteId);
  }

  function renderSidebar(): void {
    if (!notesListEl) return;
    notesListEl.innerHTML = '';

    const filtered = notes
      .filter((n) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
      });

    if (filtered.length === 0) {
      notesListEl.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-400">
          No notes found.
        </div>
      `;
      return;
    }

    filtered.forEach((note) => {
      const isActive = note.id === activeNoteId;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `w-full text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
        isActive
          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`;

      const previewText = note.content.replace(/[#*`_~]/g, '').trim() || 'Empty note...';

      item.innerHTML = `
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="font-bold text-xs truncate text-slate-900 dark:text-white flex items-center gap-1">
            ${note.pinned ? '📌' : ''} ${escapeHtml(note.title || 'Untitled')}
          </span>
          <span class="text-[10px] text-slate-400 shrink-0">${note.category}</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">${escapeHtml(previewText)}</p>
      `;

      item.addEventListener('click', () => {
        activeNoteId = note.id;
        renderSidebar();
        renderEditor();
      });

      notesListEl.appendChild(item);
    });
  }

  function renderEditor(): void {
    const note = getActiveNote();
    if (!note) {
      if (titleInput) titleInput.value = '';
      if (contentArea) contentArea.value = '';
      if (wordCountEl) wordCountEl.textContent = '0 words';
      if (charCountEl) charCountEl.textContent = '0 chars';
      return;
    }

    if (titleInput) titleInput.value = note.title;
    if (categorySelect) categorySelect.value = note.category;
    if (contentArea) contentArea.value = note.content;

    if (pinBtn) {
      pinBtn.textContent = note.pinned ? '📌 Pinned' : '📍 Pin';
      if (note.pinned) {
        pinBtn.classList.add('bg-blue-100', 'text-blue-700', 'dark:bg-blue-900', 'dark:text-blue-300');
      } else {
        pinBtn.classList.remove('bg-blue-100', 'text-blue-700', 'dark:bg-blue-900', 'dark:text-blue-300');
      }
    }

    updateStats(note.content);
    if (lastSavedEl) {
      lastSavedEl.textContent = `Saved ${new Date(note.updatedAt).toLocaleTimeString()}`;
    }
  }

  function updateStats(text: string): void {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    if (wordCountEl) wordCountEl.textContent = `${words} words`;
    if (charCountEl) charCountEl.textContent = `${chars} chars`;
  }

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  // Create new note
  newNoteBtn?.addEventListener('click', () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      category: 'General',
      pinned: false,
      updatedAt: Date.now(),
    };
    notes.unshift(newNote);
    activeNoteId = newNote.id;
    saveNotes(notes);
    renderSidebar();
    renderEditor();
    if (titleInput) titleInput.focus();
  });

  // Editor inputs
  titleInput?.addEventListener('input', () => {
    const note = getActiveNote();
    if (note) {
      note.title = titleInput.value;
      note.updatedAt = Date.now();
      saveNotes(notes);
      renderSidebar();
      if (lastSavedEl) lastSavedEl.textContent = 'Saved just now';
    }
  });

  categorySelect?.addEventListener('change', () => {
    const note = getActiveNote();
    if (note) {
      note.category = categorySelect.value;
      note.updatedAt = Date.now();
      saveNotes(notes);
      renderSidebar();
    }
  });

  contentArea?.addEventListener('input', () => {
    const note = getActiveNote();
    if (note) {
      note.content = contentArea.value;
      note.updatedAt = Date.now();
      updateStats(note.content);
      saveNotes(notes);
      renderSidebar();
      if (lastSavedEl) lastSavedEl.textContent = 'Saved just now';
    }
  });

  // Pin toggle
  pinBtn?.addEventListener('click', () => {
    const note = getActiveNote();
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = Date.now();
      saveNotes(notes);
      renderSidebar();
      renderEditor();
    }
  });

  // Delete note
  deleteBtn?.addEventListener('click', () => {
    const note = getActiveNote();
    if (note && confirm(`Delete note "${note.title}"?`)) {
      notes = notes.filter((n) => n.id !== note.id);
      activeNoteId = notes[0]?.id || '';
      saveNotes(notes);
      renderSidebar();
      renderEditor();
    }
  });

  // Search
  searchInput?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value.trim();
    renderSidebar();
  });

  // Download Markdown
  exportMdBtn?.addEventListener('click', () => {
    const note = getActiveNote();
    if (!note) return;
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(note.title || 'note').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Download TXT
  exportTxtBtn?.addEventListener('click', () => {
    const note = getActiveNote();
    if (!note) return;
    const blob = new Blob([note.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(note.title || 'note').toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Download All JSON
  exportAllJsonBtn?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  renderSidebar();
  renderEditor();
});
