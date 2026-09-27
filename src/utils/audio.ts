/**
 * Converts raw 16-bit PCM little-endian data at given sample rate into standard WAV Blob.
 * If data already contains a RIFF header, returns it directly as audio/wav blob.
 */
export function base64ToWavBlob(
  base64Data: string,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Blob {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Check if it already has a RIFF header (ASCII 0x52, 0x49, 0x46, 0x46)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return new Blob([bytes], { type: "audio/wav" });
  }

  // Otherwise, construct standard 44-byte RIFF/WAVE header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  function writeString(v: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      v.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // "RIFF"
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + len, true);
  writeString(view, 8, "WAVE");

  // "fmt " chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // audioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // numChannels
  view.setUint32(24, sampleRate, true); // sampleRate
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  view.setUint32(28, byteRate, true); // byteRate
  const blockAlign = numChannels * (bitsPerSample / 8);
  view.setUint16(32, blockAlign, true); // blockAlign
  view.setUint16(34, bitsPerSample, true); // bitsPerSample

  // "data" chunk
  writeString(view, 36, "data");
  view.setUint32(40, len, true); // subchunk2Size

  return new Blob([header, bytes], { type: "audio/wav" });
}

/**
 * Extracts normalized peak values (0 to 1) for visualization bars from PCM base64 string.
 */
export function extractWaveformPeaks(base64Data: string, numBars = 64): number[] {
  try {
    const binary = atob(base64Data);
    const int16Length = Math.floor(binary.length / 2);
    if (int16Length === 0) return Array(numBars).fill(0.15);

    const int16Array = new Int16Array(int16Length);
    for (let i = 0; i < int16Length; i++) {
      const low = binary.charCodeAt(i * 2);
      const high = binary.charCodeAt(i * 2 + 1);
      int16Array[i] = (high << 8) | low;
    }

    const blockSize = Math.floor(int16Length / numBars);
    if (blockSize <= 0) return Array(numBars).fill(0.2);

    const peaks: number[] = [];
    for (let i = 0; i < numBars; i++) {
      let sum = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, int16Length);
      for (let j = start; j < end; j++) {
        sum += Math.abs(int16Array[j]);
      }
      const avg = sum / (end - start);
      // Normalized between 0.1 and 1
      const norm = Math.min(1, Math.max(0.1, avg / 10000));
      peaks.push(norm);
    }
    return peaks;
  } catch (e) {
    console.warn("Waveform extraction failed:", e);
    return Array(numBars).fill(0.25);
  }
}

/**
 * Formats time in seconds into mm:ss format.
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
