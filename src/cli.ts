#!/usr/bin/env node
import { Command, InvalidArgumentError } from 'commander';
import { findDominantColours } from './dominantColourFinder.js';
import { loadImage } from './imageLoader.js';
import type { DominantColourReport } from './types.js';

const program = new Command();

program
  .name('dominant-colour')
  .description('Find the dominant RGB colour of an image.')
  .argument('<imagePath>', 'path to a JPG, PNG, or other Sharp-supported image')
  .option('--top <number>', 'number of dominant colours to return', parsePositiveInteger, 1)
  .option(
    '--bucket-size <number>',
    'RGB quantisation bucket size',
    parseBucketSize,
    10
  )
  .option(
    '--alpha-threshold <number>',
    'skip pixels with alpha below this value',
    parseAlphaThreshold,
    128
  )
  .option('--json', 'output the full report as JSON')
  .action(async (imagePath: string, options: CliOptions) => {
    const image = await loadImage(imagePath);
    const report = findDominantColours(image, {
      top: options.top,
      bucketSize: options.bucketSize,
      alphaThreshold: options.alphaThreshold
    });

    if (options.json) {
      console.log(JSON.stringify({ imagePath, ...report }, null, 2));
      return;
    }

    console.log(formatTextReport(imagePath, report));
  });

interface CliOptions {
  top: number;
  bucketSize: number;
  alphaThreshold: number;
  json?: boolean;
}

function parsePositiveInteger(value: string): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new InvalidArgumentError('must be a positive integer');
  }

  return parsedValue;
}

function parseBucketSize(value: string): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 255) {
    throw new InvalidArgumentError('must be an integer between 1 and 255');
  }

  return parsedValue;
}

function parseAlphaThreshold(value: string): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0 || parsedValue > 255) {
    throw new InvalidArgumentError('must be an integer between 0 and 255');
  }

  return parsedValue;
}

function formatTextReport(imagePath: string, report: DominantColourReport): string {
  const lines = [
    `Image: ${imagePath}`,
    `Size: ${report.width}x${report.height}`,
    `Pixels: ${report.processedPixels}/${report.totalPixels} processed (${report.skippedTransparentPixels} skipped transparent)`,
    `Bucket size: ${report.bucketSize}`,
    `Alpha threshold: ${report.alphaThreshold}`,
    'Dominant colours:'
  ];

  if (report.colours.length === 0) {
    lines.push('No pixels met the alpha threshold.');
    return lines.join('\n');
  }

  report.colours.forEach((result, index) => {
    const [red, green, blue] = result.colour;
    lines.push(
      `${index + 1}. rgb(${red}, ${green}, ${blue}) - ${result.count} pixels (${result.percentage.toFixed(2)}%)`
    );
  });

  return lines.join('\n');
}

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});
