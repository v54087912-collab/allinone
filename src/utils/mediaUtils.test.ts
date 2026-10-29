import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatMediaTime,
  parseMediaTime,
  calculateScaledVideoDimensions,
  calculateAspectFit,
  generateThumbnailTimestamps,
  calculateSliceFrameRange,
  createSimpleGif,
  audioBufferToWav,
} from './mediaUtils.ts';

describe('mediaUtils Tests', () => {
  it('formatMediaTime formats seconds correctly', () => {
    assert.strictEqual(formatMediaTime(0), '00:00');
    assert.strictEqual(formatMediaTime(65), '01:05');
    assert.strictEqual(formatMediaTime(125.4, true), '02:05.4');
    assert.strictEqual(formatMediaTime(-5), '00:00');
  });

  it('parseMediaTime parses strings correctly', () => {
    assert.strictEqual(parseMediaTime('01:30'), 90);
    assert.strictEqual(parseMediaTime('45'), 45);
    assert.strictEqual(parseMediaTime('00:05.5'), 5.5);
    assert.strictEqual(parseMediaTime(''), 0);
  });

  it('calculateScaledVideoDimensions scales down and ensures even dimensions', () => {
    const res = calculateScaledVideoDimensions(1920, 1080, 1280, 720);
    assert.strictEqual(res.width, 1280);
    assert.strictEqual(res.height, 720);
    assert.strictEqual(res.width % 2, 0);
    assert.strictEqual(res.height % 2, 0);

    const odd = calculateScaledVideoDimensions(1001, 501, 800, 600);
    assert.strictEqual(odd.width % 2, 0);
    assert.strictEqual(odd.height % 2, 0);
  });

  it('calculateAspectFit computes contain and cover positions correctly', () => {
    const contain = calculateAspectFit(1920, 1080, 1080, 1080, 'contain');
    assert.strictEqual(contain.drawWidth, 1080);
    assert.ok(contain.drawHeight < 1080);
    assert.strictEqual(contain.drawX, 0);
    assert.ok(contain.drawY > 0);

    const cover = calculateAspectFit(1920, 1080, 1080, 1080, 'cover');
    assert.strictEqual(cover.drawHeight, 1080);
    assert.ok(cover.drawWidth > 1080);
    assert.ok(cover.drawX < 0);
    assert.strictEqual(cover.drawY, 0);
  });

  it('generateThumbnailTimestamps produces evenly spaced timestamps', () => {
    const ts = generateThumbnailTimestamps(100, 4);
    assert.strictEqual(ts.length, 4);
    assert.strictEqual(ts[0], 20);
    assert.strictEqual(ts[1], 40);
    assert.strictEqual(ts[2], 60);
    assert.strictEqual(ts[3], 80);
  });

  it('calculateSliceFrameRange computes frame bounds safely', () => {
    const range = calculateSliceFrameRange(10, 44100, 2, 5);
    assert.strictEqual(range.startFrame, 88200);
    assert.strictEqual(range.endFrame, 220500);
    assert.strictEqual(range.length, 132300);
  });

  it('createSimpleGif generates a valid GIF89a byte sequence', () => {
    const w = 10;
    const h = 10;
    const frame = new Uint8ClampedArray(w * h * 4);
    // Fill with blue
    for (let i = 0; i < w * h; i++) {
      frame[i * 4] = 0;
      frame[i * 4 + 1] = 0;
      frame[i * 4 + 2] = 255;
      frame[i * 4 + 3] = 255;
    }

    const gifBytes = createSimpleGif(w, h, [frame], 100);
    assert.ok(gifBytes.length > 50);
    // Header should be 'GIF89a' -> 0x47, 0x49, 0x46, 0x38, 0x39, 0x61
    assert.strictEqual(gifBytes[0], 0x47);
    assert.strictEqual(gifBytes[1], 0x49);
    assert.strictEqual(gifBytes[2], 0x46);
    assert.strictEqual(gifBytes[3], 0x38);
    assert.strictEqual(gifBytes[4], 0x39);
    assert.strictEqual(gifBytes[5], 0x61);
    // Trailer is 0x3B (';')
    assert.strictEqual(gifBytes[gifBytes.length - 1], 0x3b);
  });

  it('audioBufferToWav encodes mock AudioBuffer data into valid WAV header', () => {
    const mockChannel = new Float32Array(44100); // 1 sec of silence
    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 44100,
      duration: 1,
      getChannelData: () => mockChannel,
    } as unknown as AudioBuffer;

    const wavBytes = audioBufferToWav(mockAudioBuffer);
    assert.ok(wavBytes.length > 44);
    // RIFF check
    const headerStr = String.fromCharCode(...wavBytes.slice(0, 4));
    assert.strictEqual(headerStr, 'RIFF');
    const waveStr = String.fromCharCode(...wavBytes.slice(8, 12));
    assert.strictEqual(waveStr, 'WAVE');
  });
});
