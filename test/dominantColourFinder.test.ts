import { describe, expect, it } from 'vitest';
import {
  findDominantColours,
  normaliseOptions
} from '../src/dominantColourFinder.js';
import type { LoadedImageData, Rgb } from '../src/types.js';

type TestPixel = [number, number, number, number];

describe('dominantColourFinder', () => {
  it('throws for invalid options and malformed image data', () => {
    expect(() => normaliseOptions({ top: 0 })).toThrow(
      'top must be a positive integer'
    );
    expect(() => normaliseOptions({ bucketSize: 0 })).toThrow(
      'bucketSize must be an integer between 1 and 255'
    );
    expect(() => normaliseOptions({ alphaThreshold: 300 })).toThrow(
      'alphaThreshold must be an integer between 0 and 255'
    );
    expect(() =>
      findDominantColours({
        width: 2,
        height: 2,
        channels: 4,
        data: Uint8Array.from([255, 0, 0, 255])
      })
    ).toThrow('image data length must be');
  });

  it('returns red when red appears more often than blue', () => {
    const report = findDominantColours(
      imageFromPixels([
        [250, 0, 0, 255],
        [250, 0, 0, 255],
        [250, 0, 0, 255],
        [0, 0, 250, 255]
      ])
    );

    expect(report.colours[0]).toMatchObject({
      colour: [250, 0, 0],
      description: 'red',
      count: 3
    });
  });

  it('groups near-red colours through quantisation', () => {
    const report = findDominantColours(
      imageFromPixels([
        [251, 2, 3, 255],
        [249, 4, 1, 255],
        [0, 0, 250, 255]
      ]),
      { bucketSize: 10 }
    );

    expect(report.colours[0]).toMatchObject({
      colour: [250, 0, 0],
      count: 2
    });
  });

  it('returns top N colours in count order', () => {
    const report = findDominantColours(
      imageFromPixels([
        [0, 250, 0, 255],
        [0, 250, 0, 255],
        [0, 250, 0, 255],
        [250, 0, 0, 255],
        [250, 0, 0, 255],
        [0, 0, 250, 255]
      ]),
      { top: 2 }
    );

    expect(coloursOnly(report.colours)).toEqual([
      [0, 250, 0],
      [250, 0, 0]
    ]);
  });

  it('skips transparent pixels below the alpha threshold', () => {
    const report = findDominantColours(
      imageFromPixels([
        [250, 0, 0, 255],
        [0, 0, 250, 128],
        [0, 250, 0, 127]
      ]),
      { top: 2, alphaThreshold: 128 }
    );

    expect(report.processedPixels).toBe(2);
    expect(report.skippedTransparentPixels).toBe(1);
    expect(coloursOnly(report.colours)).toEqual([
      [0, 0, 250],
      [250, 0, 0]
    ]);
  });

  it('returns an empty colour list when all pixels are transparent', () => {
    const report = findDominantColours(
      imageFromPixels([
        [250, 0, 0, 20],
        [0, 0, 250, 30]
      ]),
      { alphaThreshold: 128 }
    );

    expect(report.colours).toEqual([]);
    expect(report.processedPixels).toBe(0);
    expect(report.skippedTransparentPixels).toBe(2);
  });

  it('calculates percentages from processed pixels', () => {
    const report = findDominantColours(
      imageFromPixels([
        [250, 0, 0, 255],
        [250, 0, 0, 255],
        [250, 0, 0, 255],
        [0, 0, 250, 255]
      ]),
      { top: 2 }
    );

    expect(report.colours[0]?.percentage).toBe(75);
    expect(report.colours[1]?.percentage).toBe(25);
  });

  it('reports image metadata and normalised options', () => {
    const report = findDominantColours(
      imageFromPixels([
        [250, 0, 0, 255],
        [0, 0, 250, 255]
      ]),
      { top: 5, bucketSize: 20, alphaThreshold: 100 }
    );

    expect(report).toMatchObject({
      totalPixels: 2,
      processedPixels: 2,
      skippedTransparentPixels: 0,
      width: 2,
      height: 1,
      bucketSize: 20,
      alphaThreshold: 100
    });
    expect(report.colours).toHaveLength(2);
  });

  it('uses deterministic RGB tuple ordering when counts are equal', () => {
    const report = findDominantColours(
      imageFromPixels([
        [250, 0, 0, 255],
        [0, 250, 0, 255],
        [0, 0, 250, 255]
      ]),
      { top: 3 }
    );

    expect(coloursOnly(report.colours)).toEqual([
      [0, 0, 250],
      [0, 250, 0],
      [250, 0, 0]
    ]);
  });
});

function imageFromPixels(pixels: TestPixel[]): LoadedImageData {
  return {
    width: pixels.length,
    height: 1,
    channels: 4,
    data: Uint8Array.from(pixels.flat())
  };
}

function coloursOnly(results: Array<{ colour: Rgb }>): Rgb[] {
  return results.map((result) => result.colour);
}
