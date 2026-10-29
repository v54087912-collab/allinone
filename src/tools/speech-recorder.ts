/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { encodeWavBlob, formatSecondsToSrtTime } from '../utils/mediaAudioUtils.ts';

export function initSpeechRecorder(): void {
  const recordBtn = document.getElementById('record-btn') as HTMLButtonElement | null;
  const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement | null;
  const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement | null;
  const timerDisplay = document.getElementById('timer-display') as HTMLSpanElement | null;
  const visualizerCanvas = document.getElementById('visualizer-canvas') as HTMLCanvasElement | null;
  const audioPreview = document.getElementById('audio-preview') as HTMLAudioElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;

  let mediaStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let timerInterval: any = null;
  let secondsElapsed = 0;
  let isRecording = false;
  let animId: any = null;

  function updateTimer() {
    secondsElapsed++;
    if (timerDisplay) {
      timerDisplay.textContent = formatSecondsToSrtTime(secondsElapsed).slice(3, 8);
    }
  }

  function drawVisualizer() {
    if (!visualizerCanvas || !analyser) return;
    const ctx = visualizerCanvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * visualizerCanvas.height;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    if (isRecording) {
      animId = requestAnimationFrame(drawVisualizer);
    }
  }

  if (recordBtn) {
    recordBtn.addEventListener('click', async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;

        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        recordedChunks = [];
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          if (audioPreview) {
            audioPreview.src = url;
            audioPreview.classList.remove('hidden');
          }
          if (downloadLink) {
            downloadLink.href = url;
            downloadLink.download = `voice-recording-${new Date().toISOString().slice(0, 10)}.webm`;
          }
          if (downloadContainer) downloadContainer.classList.remove('hidden');
        };

        mediaRecorder.start(250);
        isRecording = true;
        secondsElapsed = 0;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);

        recordBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = false;

        drawVisualizer();
      } catch (err: any) {
        alert('Microphone access is required: ' + err.message);
      }
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (!mediaRecorder) return;
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        clearInterval(timerInterval);
        pauseBtn.textContent = 'Resume';
      } else if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        timerInterval = setInterval(updateTimer, 1000);
        pauseBtn.textContent = 'Pause';
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      isRecording = false;
      clearInterval(timerInterval);
      cancelAnimationFrame(animId);

      if (recordBtn) recordBtn.disabled = false;
      if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.textContent = 'Pause';
      }
      if (stopBtn) stopBtn.disabled = true;
    });
  }
}

document.addEventListener('DOMContentLoaded', initSpeechRecorder);
