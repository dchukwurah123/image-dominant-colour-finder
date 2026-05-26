import {
  compareRgbAscending,
  describeRgbColour,
  keyToRgb,
  quantiseRgb,
  rgbToKey,
  validateBucketSize
} from './colourUtils.js';
import type {
  DominantColourOptions,
  DominantColourReport,
  DominantColourResult,
  LoadedImageData,
  Rgb
} from './types.js';

const BYTES_PER_RGBA_PIXEL = 4;

export const DEFAULT_DOMINANT_COLOUR_OPTIONS = {
  top: 1,
  bucketSize: 10,
  alphaThreshold: 128
} as const satisfies Required<DominantColourOptions>;

interface NormalisedDominantColourOptions {
  top: number;
  bucketSize: number;
  alphaThreshold: number;
}

export function findDominantColours(
  image: LoadedImageData,
  options: DominantColourOptions = {}
): DominantColourReport {
  const normalisedOptions = normaliseOptions(options);
  validateImageData(image);

  const histogram = new Map<string, number>();
  let processedPixels = 0;
  let skippedTransparentPixels = 0;

  // Sharp gives us repeated RGBA bytes, so each loop reads one complete pixel.
  for (let offset = 0; offset < image.data.length; offset += BYTES_PER_RGBA_PIXEL) {
    const alpha = image.data[offset + 3];

    if (alpha < normalisedOptions.alphaThreshold) {
      skippedTransparentPixels += 1;
      continue;
    }

    const colour = quantiseRgb(
      [image.data[offset], image.data[offset + 1], image.data[offset + 2]],
      normalisedOptions.bucketSize
    );
    const key = rgbToKey(colour);

    histogram.set(key, (histogram.get(key) ?? 0) + 1);
    processedPixels += 1;
  }

  const colours = Array.from(histogram.entries())
    .map(([key, count]) => createResult(keyToRgb(key), count, processedPixels))
    .sort(compareResults)
    .slice(0, normalisedOptions.top);

  return {
    colours,
    totalPixels: image.width * image.height,
    processedPixels,
    skippedTransparentPixels,
    width: image.width,
    height: image.height,
    bucketSize: normalisedOptions.bucketSize,
    alphaThreshold: normalisedOptions.alphaThreshold
  };
}

export function normaliseOptions(
  options: DominantColourOptions
): NormalisedDominantColourOptions {
  const top = options.top ?? DEFAULT_DOMINANT_COLOUR_OPTIONS.top;
  const bucketSize =
    options.bucketSize ?? DEFAULT_DOMINANT_COLOUR_OPTIONS.bucketSize;
  const alphaThreshold =
    options.alphaThreshold ?? DEFAULT_DOMINANT_COLOUR_OPTIONS.alphaThreshold;

  if (!Number.isInteger(top) || top < 1) {
    throw new Error('top must be a positive integer');
  }

  validateBucketSize(bucketSize);

  if (
    !Number.isInteger(alphaThreshold) ||
    alphaThreshold < 0 ||
    alphaThreshold > 255
  ) {
    throw new Error('alphaThreshold must be an integer between 0 and 255');
  }

  return { top, bucketSize, alphaThreshold };
}

function validateImageData(image: LoadedImageData): void {
  if (!Number.isInteger(image.width) || image.width < 1) {
    throw new Error('image width must be a positive integer');
  }

  if (!Number.isInteger(image.height) || image.height < 1) {
    throw new Error('image height must be a positive integer');
  }

  if (image.channels !== BYTES_PER_RGBA_PIXEL) {
    throw new Error('image data must contain RGBA pixels');
  }

  const expectedBytes = image.width * image.height * BYTES_PER_RGBA_PIXEL;

  if (image.data.length !== expectedBytes) {
    throw new Error(
      `image data length must be ${expectedBytes} bytes for ${image.width}x${image.height} RGBA data`
    );
  }
}

function createResult(
  colour: Rgb,
  count: number,
  processedPixels: number
): DominantColourResult {
  return {
    colour,
    description: describeRgbColour(colour),
    count,
    percentage: processedPixels === 0 ? 0 : (count / processedPixels) * 100
  };
}

function compareResults(
  left: DominantColourResult,
  right: DominantColourResult
): number {
  return right.count - left.count || compareRgbAscending(left.colour, right.colour);
}
