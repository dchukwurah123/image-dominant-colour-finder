import type { Rgb } from './types.js';

const RGB_KEY_PATTERN = /^(\d{1,3}),(\d{1,3}),(\d{1,3})$/;

interface Hsl {
  hue: number;
  saturation: number;
  lightness: number;
}

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

export function describeRgbColour(colour: Rgb): string {
  const { hue, saturation, lightness } = rgbToHsl(colour);

  if (lightness <= 0.08) {
    return 'black';
  }

  if (saturation <= 0.12) {
    if (lightness >= 0.9) {
      return 'white';
    }

    if (lightness <= 0.18) {
      return 'black';
    }

    return 'grey';
  }

  const baseColour = describeHue(hue);

  if (lightness <= 0.28) {
    return `dark ${baseColour}`;
  }

  if (lightness >= 0.78) {
    return `light ${baseColour}`;
  }

  if (
    baseColour === 'cyan / aqua blue' &&
    saturation >= 0.75 &&
    lightness >= 0.45
  ) {
    return `bright ${baseColour}`;
  }

  return baseColour;
}

export function validateBucketSize(bucketSize: number): void {
  if (!Number.isInteger(bucketSize) || bucketSize < 1 || bucketSize > 255) {
    throw new Error('bucketSize must be an integer between 1 and 255');
  }
}

function rgbToHsl(colour: Rgb): Hsl {
  const [red, green, blue] = colour.map((channel) => clampChannel(channel) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;

  if (max === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation,
    lightness
  };
}

function describeHue(hue: number): string {
  if (hue < 20 || hue >= 330) {
    return 'red';
  }

  if (hue < 45) {
    return 'orange';
  }

  if (hue < 70) {
    return 'yellow';
  }

  if (hue < 165) {
    return 'green';
  }

  if (hue < 200) {
    return 'cyan / aqua blue';
  }

  if (hue < 260) {
    return 'blue';
  }

  return 'purple / magenta';
}
