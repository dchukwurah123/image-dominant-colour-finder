import { describe, expect, it } from 'vitest';
import {
  clampChannel,
  describeRgbColour,
  keyToRgb,
  quantiseChannel,
  quantiseRgb,
  rgbToKey
} from '../src/colourUtils.js';

describe('colourUtils', () => {
  it('clamps channels to the RGB range', () => {
    expect(clampChannel(-12)).toBe(0);
    expect(clampChannel(127.6)).toBe(128);
    expect(clampChannel(300)).toBe(255);
  });

  it('quantises channels to the nearest bucket', () => {
    expect(quantiseChannel(24, 10)).toBe(20);
    expect(quantiseChannel(25, 10)).toBe(30);
    expect(quantiseRgb([244, 5, 16], 10)).toEqual([240, 10, 20]);
  });

  it('clamps quantised values to 255', () => {
    expect(quantiseChannel(255, 10)).toBe(255);
    expect(quantiseRgb([255, 255, 255], 10)).toEqual([255, 255, 255]);
  });

  it('converts RGB values to and from histogram keys', () => {
    const colour = [10, 20, 30] as const;

    expect(rgbToKey([...colour])).toBe('10,20,30');
    expect(keyToRgb('10,20,30')).toEqual([10, 20, 30]);
  });

  it('throws for invalid RGB keys', () => {
    expect(() => keyToRgb('not-a-colour')).toThrow('Invalid RGB key');
    expect(() => keyToRgb('1,2')).toThrow('Invalid RGB key');
    expect(() => keyToRgb('1,2,300')).toThrow('Invalid RGB key');
  });

  it('describes broad RGB colour families', () => {
    expect(describeRgbColour([255, 0, 0])).toBe('red');
    expect(describeRgbColour([0, 255, 0])).toBe('green');
    expect(describeRgbColour([0, 0, 255])).toBe('blue');
    expect(describeRgbColour([0, 220, 250])).toBe('bright cyan / aqua blue');
    expect(describeRgbColour([255, 255, 255])).toBe('white');
    expect(describeRgbColour([0, 0, 0])).toBe('black');
    expect(describeRgbColour([128, 128, 128])).toBe('grey');
    expect(describeRgbColour([0, 0, 80])).toBe('dark blue');
  });
});
