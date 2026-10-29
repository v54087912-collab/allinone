import { showToast } from '../shared/site-shell.ts';

// Web Speech API interface declarations
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionLike, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => any) | null;
  onerror: ((this: SpeechRecognitionLike, ev: SpeechRecognitionErrorEventLike) => any) | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => any) | null;
}

export function initSpeechToText(): void {
  const transcriptEl = document.getElementById('stt-transcript') as HTMLTextAreaElement | null;
  const interimEl = document.getElementById('stt-interim') as HTMLElement | null;
  const langSelect = document.getElementById('stt-lang-select') as HTMLSelectElement | null;
  const continuousCheck = document.getElementById('stt-continuous') as HTMLInputElement | null;

  const toggleBtn = document.getElementById('stt-toggle-btn') as HTMLButtonElement | null;
  const statusText = document.getElementById('stt-status-text') as HTMLElement | null;
  const pulseRing = document.getElementById('stt-pulse-ring') as HTMLElement | null;

  const copyBtn = document.getElementById('stt-copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('stt-download-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('stt-clear-btn') as HTMLButtonElement | null;

  const wordsEl = document.getElementById('stat-words') as HTMLElement | null;
  const charsEl = document.getElementById('stat-chars') as HTMLElement | null;
  const unsupportedBanner = document.getElementById('stt-unsupported-banner') as HTMLElement | null;

  if (!transcriptEl) return;

  const SpeechRecognitionConstructor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionConstructor) {
    if (unsupportedBanner) {
      unsupportedBanner.classList.remove('hidden');
    }
    if (toggleBtn) {
      toggleBtn.disabled = true;
      toggleBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (statusText) {
      statusText.textContent = 'Voice recognition is not supported in this browser. Please use Chrome, Edge, Safari, or Brave.';
    }
    return;
  }

  let recognition: SpeechRecognitionLike | null = null;
  let isListening = false;
  let finalTranscript = '';

  function updateCounts() {
    if (!transcriptEl) return;
    const text = transcriptEl.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    if (wordsEl) wordsEl.textContent = `${words}`;
    if (charsEl) charsEl.textContent = `${transcriptEl.value.length}`;
  }

  function startRecognition() {
    if (isListening) return;

    try {
      recognition = new SpeechRecognitionConstructor() as SpeechRecognitionLike;
      recognition.continuous = continuousCheck?.checked ?? true;
      recognition.interimResults = true;
      recognition.lang = langSelect?.value || 'en-US';

      recognition.onstart = () => {
        isListening = true;
        if (statusText) statusText.textContent = 'Listening... Speak into your microphone';
        if (pulseRing) pulseRing.classList.remove('hidden');
        if (toggleBtn) {
          toggleBtn.classList.add('bg-red-600', 'hover:bg-red-700', 'text-white', 'ring-4', 'ring-red-200', 'dark:ring-red-950');
          toggleBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        }
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += (finalTranscript && !finalTranscript.endsWith(' ') ? ' ' : '') + res[0].transcript;
          } else {
            interimText += res[0].transcript;
          }
        }

        if (transcriptEl) {
          transcriptEl.value = finalTranscript;
          updateCounts();
        }

        if (interimEl) {
          if (interimText) {
            interimEl.textContent = `"... ${interimText}"`;
            interimEl.classList.remove('hidden');
          } else {
            interimEl.classList.add('hidden');
            interimEl.textContent = '';
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          showToast('Microphone access was denied. Please allow microphone permission.', 'error');
        } else if (event.error !== 'no-speech') {
          showToast(`Speech recognition error: ${event.error}`, 'warning');
        }
        stopRecognition();
      };

      recognition.onend = () => {
        if (isListening && continuousCheck?.checked) {
          // Restart if continuous mode was requested
          try {
            recognition?.start();
            return;
          } catch {
            // fall through
          }
        }
        stopRecognition();
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      showToast('Could not start microphone', 'error');
      stopRecognition();
    }
  }

  function stopRecognition() {
    isListening = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      recognition = null;
    }

    if (statusText) statusText.textContent = 'Click microphone to start dictation';
    if (pulseRing) pulseRing.classList.add('hidden');
    if (interimEl) interimEl.classList.add('hidden');

    if (toggleBtn) {
      toggleBtn.classList.remove('bg-red-600', 'hover:bg-red-700', 'text-white', 'ring-4', 'ring-red-200', 'dark:ring-red-950');
      toggleBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
  }

  toggleBtn?.addEventListener('click', () => {
    if (isListening) {
      stopRecognition();
      showToast('Dictation stopped', 'info');
    } else {
      finalTranscript = transcriptEl.value;
      startRecognition();
      showToast('Listening... Speak now', 'info');
    }
  });

  transcriptEl.addEventListener('input', () => {
    finalTranscript = transcriptEl.value;
    updateCounts();
  });

  clearBtn?.addEventListener('click', () => {
    finalTranscript = '';
    transcriptEl.value = '';
    if (interimEl) interimEl.textContent = '';
    updateCounts();
    if (isListening) stopRecognition();
  });

  copyBtn?.addEventListener('click', () => {
    if (!transcriptEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(transcriptEl.value).then(
      () => showToast('Transcript copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  downloadBtn?.addEventListener('click', () => {
    if (!transcriptEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([transcriptEl.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'speech-transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transcript downloaded!', 'success');
  });

  updateCounts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSpeechToText);
} else {
  initSpeechToText();
}
