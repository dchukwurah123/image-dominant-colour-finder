# Image Dominant Colour Finder

A small TypeScript Node.js CLI that finds the most frequent RGB colour in an image. It supports common formats such as PNG and JPG through Sharp.

## Why This Approach

The challenge asks for the dominant colour, meaning the colour that appears most often. This project uses a simple histogram: load RGBA pixels, quantise each RGB value, skip sufficiently transparent pixels, count colour frequencies in a `Map`, then return the highest counts.

It deliberately does not calculate an average colour and does not use machine learning, k-means, OpenCV, or advanced clustering. The code is kept small and separated so it can be explained clearly in an interview.

## Installation

Use Node.js 22 or later.

```sh
npm install
```

## Running The CLI

Generate the sample images first:

```sh
npm run generate-fixtures
```

Find the dominant colour:

```sh
npm run dominant -- ./sample-images/mostly-red.png
```

Return the top five colours with a bucket size of 10:

```sh
npm run dominant -- ./sample-images/mostly-red.png --top 5 --bucket-size 10
```

Demo a fixture with three visible colour groups:

```sh
npm run dominant -- ./sample-images/red-blue-green.png --top 3
```

Return JSON:

```sh
npm run dominant -- ./sample-images/mostly-red.png --top 3 --json
```

## Example Output

```text
Image: ./sample-images/mostly-red.png
Size: 4x4
Pixels: 16/16 processed (0 skipped transparent)
Bucket size: 10
Alpha threshold: 128
Dominant colours:
1. rgb(250, 0, 0) - 12 pixels (75.00%)
```

JSON output includes the top colours plus report metadata:

```json
{
  "imagePath": "./sample-images/mostly-red.png",
  "colours": [
    {
      "colour": [250, 0, 0],
      "count": 12,
      "percentage": 75
    }
  ],
  "totalPixels": 16,
  "processedPixels": 16,
  "skippedTransparentPixels": 0,
  "width": 4,
  "height": 4,
  "bucketSize": 10,
  "alphaThreshold": 128
}
```

## CLI Options

- `--top <number>` returns the top N dominant colours. Default: `1`.
- `--bucket-size <number>` rounds RGB values to the nearest multiple. Default: `10`.
- `--alpha-threshold <number>` skips pixels where alpha is below this value. Default: `128`.
- `--json` prints the full report as JSON.

## Algorithm

1. Sharp loads the image, adds an alpha channel with `ensureAlpha()`, and extracts raw RGBA bytes.
2. The pure algorithm reads pixels as repeated `R,G,B,A` values.
3. Pixels with alpha below `alphaThreshold` are skipped; pixels equal to the threshold are included.
4. RGB channels are rounded to the nearest multiple of `bucketSize`.
5. Quantised colours are counted with `Map<string, number>`.
6. Results are sorted by count descending.
7. Equal counts are sorted by RGB tuple order for deterministic behaviour.

## Key Design Decisions

- TypeScript + Node keeps the CLI portable and strongly typed.
- Commander keeps CLI parsing separate from the algorithm.
- Sharp handles image decoding and raw pixel extraction.
- A `Map` works well as a clear colour histogram.
- RGB quantisation reduces noise from near-identical colours.
- Top N dominant colours are returned by sorting the histogram.
- Transparent pixels are skipped using a configurable alpha threshold.
- Sharp-specific logic lives in `src/imageLoader.ts`; the core algorithm is independent from Sharp and the CLI.

## Complexity

Let `n` be the number of pixels and `k` be the number of distinct quantised colours.

- Pixel scan: `O(n)`.
- Histogram storage: `O(k)`.
- Sorting colour buckets: `O(k log k)`.

## Testing Strategy

Vitest covers the pure functions and deterministic in-memory pixel data:

- Channel clamping.
- Quantisation to nearest buckets.
- 255 clamping.
- RGB key conversion and invalid keys.
- Invalid options and malformed image data.
- Dominant colour selection.
- Quantisation grouping.
- Top N ordering.
- Transparent pixel skipping.
- Percentage calculation.
- Deterministic tie-breaking.

Run tests and build:

```sh
npm test
npm run build
```

## AI Usage Notes

AI assistance was used to help scaffold the project, write tests, and draft documentation. The implementation remains intentionally simple, with small functions and explicit tests so the behaviour can be reviewed and explained line by line.

## Future Improvements

- Optionally ignore white or black backgrounds.
- Downsample very large images for faster approximate results.
- Add perceptual colour spaces for human-friendly similarity.
- Add k-means or palette extraction as a separate advanced mode.
- Add richer CI reporting and coverage output.

## Interview Talking Points

- The program finds the most frequent colour, not the average.
- Quantisation is a practical trade-off for noisy images and JPEG artefacts.
- Transparent pixels are excluded before counting.
- The dominant colour logic is pure and easy to test without image files.
- Sharp is isolated as an adapter around external image loading.
- Deterministic tie-breaking keeps tests and CLI output stable.