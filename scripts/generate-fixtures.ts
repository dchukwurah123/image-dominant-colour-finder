import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

type Rgba = [number, number, number, number];

const sampleImagesDirectory = new URL('../sample-images/', import.meta.url);

await mkdir(sampleImagesDirectory, { recursive: true });

await writePng('mostly-red.png', 4, 4, [
  ...repeat([250, 0, 0, 255], 12),
  ...repeat([0, 0, 250, 255], 4)
]);

await writePng('red-blue-green.png', 3, 3, [
  ...repeat([250, 0, 0, 255], 4),
  ...repeat([0, 0, 250, 255], 3),
  ...repeat([0, 250, 0, 255], 2)
]);

await writePng('transparent-with-red.png', 3, 3, [
  ...repeat([250, 0, 0, 255], 5),
  ...repeat([0, 0, 250, 40], 4)
]);

await writeJpeg('near-red-jpeg.jpg', 4, 4, [
  ...repeat([251, 2, 3, 255], 8),
  ...repeat([247, 4, 2, 255], 5),
  ...repeat([0, 0, 250, 255], 3)
]);

await writeJpeg('multi-color-mostly-blue.jpg', 10, 10, [
  ...repeat([0, 60, 240, 255], 60),
  ...repeat([0, 220, 250, 255], 20),
  ...repeat([250, 0, 0, 255], 10),
  ...repeat([0, 250, 0, 255], 10)
]);

console.log('Generated sample images in sample-images/');

function repeat(pixel: Rgba, count: number): Rgba[] {
  return Array.from({ length: count }, () => pixel);
}

async function writePng(
  filename: string,
  width: number,
  height: number,
  pixels: Rgba[]
): Promise<void> {
  await writeImage(filename, width, height, pixels, 'png');
}

async function writeJpeg(
  filename: string,
  width: number,
  height: number,
  pixels: Rgba[]
): Promise<void> {
  await writeImage(filename, width, height, pixels, 'jpeg');
}

async function writeImage(
  filename: string,
  width: number,
  height: number,
  pixels: Rgba[],
  format: 'png' | 'jpeg'
): Promise<void> {
  if (pixels.length !== width * height) {
    throw new Error(`${filename} has ${pixels.length} pixels, expected ${width * height}`);
  }

  const rawData = Buffer.from(pixels.flat());
  const image = sharp(rawData, {
    raw: {
      width,
      height,
      channels: 4
    }
  });

  const outputPath = fileURLToPath(new URL(filename, sampleImagesDirectory));

  if (format === 'png') {
    await image.png().toFile(outputPath);
    return;
  }

  await image.jpeg({ quality: 95 }).toFile(outputPath);
}
