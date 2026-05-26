import type { Rgb } from './types.js';

const RGB_KEY_PATTERN = /^(\d{1,3}),(\d{1,3}),(\d{1,3})$/;

export function clampChannel(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`RGB channel must be a finite number: ${value}`);
  }

  return Math.min(255, Math.max(0, Math.round(value)));
}

export function quantiseChannel(value: number, bucketSize: number): number {
  validateBucketSize(bucketSize);

  const clampedValue = clampChannel(value);
  return clampChannel(Math.round(clampedValue / bucketSize) * bucketSize);
}

export function quantiseRgb(colour: Rgb, bucketSize: number): Rgb {
  return [
    quantiseChannel(colour[0], bucketSize),
    quantiseChannel(colour[1], bucketSize),
    quantiseChannel(colour[2], bucketSize)
  ];
}

export function rgbToKey(colour: Rgb): string {
  const [red, green, blue] = colour.map(clampChannel) as Rgb;
  return `${red},${green},${blue}`;
}

export function keyToRgb(key: string): Rgb {
  const match = RGB_KEY_PATTERN.exec(key);

  if (!match) {
    throw new Error(`Invalid RGB key: ${key}`);
  }

  const colour: Rgb = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3])
  ];

  for (const channel of colour) {
    if (channel < 0 || channel > 255) {
      throw new Error(`Invalid RGB key: ${key}`);
    }
  }

  return colour;
}

export function compareRgbAscending(left: Rgb, right: Rgb): number {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

export function validateBucketSize(bucketSize: number): void {
  if (!Number.isInteger(bucketSize) || bucketSize < 1 || bucketSize > 255) {
    throw new Error('bucketSize must be an integer between 1 and 255');
  }
}
