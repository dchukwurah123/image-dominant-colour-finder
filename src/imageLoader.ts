import sharp from 'sharp';
import type { LoadedImageData } from './types.js';

export async function loadImage(filePath: string): Promise<LoadedImageData> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 4) {
    throw new Error(`Expected RGBA image data, received ${info.channels} channels`);
  }

  return {
    width: info.width,
    height: info.height,
    channels: 4,
    data
  };
}
