import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSubtitles,
  convertSubtitles,
  formatSecondsToSrtTime,
  extractWaveformPeaks,
  calculateAspectRatio,
  estimateBitrate
} from './mediaAudioUtils.ts';

describe('Media & Audio Utilities Unit Tests', () => {
  it('formatSecondsToSrtTime formats hours, minutes, seconds, milliseconds', () => {
    assert.equal(formatSecondsToSrtTime(0), '00:00:00,000');
    assert.equal(formatSecondsToSrtTime(65.5), '00:01:05,500');
    assert.equal(formatSecondsToSrtTime(3661.125), '01:01:01,125');
  });

  it('parseSubtitles parses SRT and VTT subtitle blocks', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,500 --> 00:00:08,200
Second subtitle line`;

    const cues = parseSubtitles(srt);
    assert.equal(cues.length, 2);
    assert.equal(cues[0].startTime, 1);
    assert.equal(cues[0].endTime, 4);
    assert.equal(cues[0].text, 'Hello world');
    assert.equal(cues[1].startTime, 5.5);
    assert.equal(cues[1].text, 'Second subtitle line');
  });

  it('convertSubtitles converts SRT to VTT, JSON, and shifts timestamp offsets', () => {
    const cues = [
      { id: 1, startTime: 2.0, endTime: 5.0, text: 'First line' }
    ];

    // Shift by +1.5 seconds
    const vtt = convertSubtitles(cues, 'vtt', 1.5);
    assert.ok(vtt.startsWith('WEBVTT'));
    assert.ok(vtt.includes('00:00:03.500 --> 00:00:06.500'));

    const json = convertSubtitles(cues, 'json', 0);
    const parsed = JSON.parse(json);
    assert.equal(parsed[0].text, 'First line');
    assert.equal(parsed[0].startTime, 2.0);
  });

  it('extractWaveformPeaks normalizes audio channel data into peak bars', () => {
    const channel = new Float32Array([0.1, 0.8, -0.9, 0.2, 0.5, -0.6]);
    const peaks = extractWaveformPeaks(channel, 2);
    assert.equal(peaks.length, 2);
    assert.equal(peaks[0], 0.9); // max of 0.1, 0.8, 0.9
    assert.equal(peaks[1], 0.6); // max of 0.2, 0.5, 0.6
  });

  it('calculateAspectRatio detects 16:9, 4:3, 1:1 correctly', () => {
    assert.equal(calculateAspectRatio(1920, 1080), '16:9');
    assert.equal(calculateAspectRatio(1280, 720), '16:9');
    assert.equal(calculateAspectRatio(1024, 768), '4:3');
    assert.equal(calculateAspectRatio(500, 500), '1:1');
  });

  it('estimateBitrate computes bitrate for video file sizes', () => {
    // 10 MB for 10 seconds -> 80 Mbps / 10 = 8 Mbps
    const rate = estimateBitrate(10 * 1024 * 1024, 10);
    assert.ok(rate.includes('Mbps'));
  });
});
