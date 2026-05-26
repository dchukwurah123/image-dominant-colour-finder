export type Rgb = [number, number, number];

export interface LoadedImageData {
  width: number;
  height: number;
  channels: 4;
  data: Uint8Array;
}

export interface DominantColourOptions {
  top?: number;
  bucketSize?: number;
  alphaThreshold?: number;
}

export interface DominantColourResult {
  colour: Rgb;
  count: number;
  percentage: number;
}

export interface DominantColourReport {
  colours: DominantColourResult[];
  totalPixels: number;
  processedPixels: number;
  skippedTransparentPixels: number;
  width: number;
  height: number;
  bucketSize: number;
  alphaThreshold: number;
}
