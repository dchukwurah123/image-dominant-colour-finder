# Interview Walkthrough

This is a rehearsal guide for presenting the Image Dominant Colour Finder in a 1h 30m technical interview for a Mid-level Software Developer in Test role.

## 1. 60-Second Project Overview

This project is a TypeScript Node.js CLI tool that finds the dominant colour in an image. By dominant colour, I mean the RGB colour that appears most frequently after optional quantisation, not the average colour.

The CLI accepts an image path, loads the image with Sharp, converts it into raw RGBA pixel data, skips transparent pixels, groups near-identical colours into configurable buckets, counts each colour with a `Map`, and returns the top N colours with counts and percentages.

The design is intentionally small and testable. CLI parsing, image loading, colour utilities, and the core algorithm are separated so the main logic can be unit tested using deterministic in-memory pixel data.

## 2. 2-Minute Technical Walkthrough

The entry point is `src/cli.ts`. It uses Commander to parse the image path and options such as `--top`, `--bucket-size`, `--alpha-threshold`, and `--json`.

The image-loading adapter is `src/imageLoader.ts`. It uses Sharp to decode the input image, calls `ensureAlpha()` so every pixel has red, green, blue, and alpha channels, then extracts a raw buffer.

The core algorithm is in `src/dominantColourFinder.ts`. It loops through the raw RGBA data four bytes at a time. For each pixel, it checks alpha first. If the pixel is transparent enough, it is skipped. Otherwise, the RGB values are quantised, converted into a string key like `250,0,0`, and counted in a `Map`.

After scanning the pixels, the histogram is converted into result objects, sorted by count descending, then by RGB tuple order for deterministic tie-breaking. The report includes the top colours plus metadata such as total pixels, processed pixels, skipped transparent pixels, dimensions, bucket size, and alpha threshold.

Tests use Vitest and focus on pure functions. The algorithm tests build tiny in-memory RGBA images, which keeps the tests fast, deterministic, and independent of image files.

## 3. How To Demo From The Terminal

Install dependencies:

```sh
npm install
```

Generate sample images:

```sh
npm run generate-fixtures
```

Run the main demo:

```sh
npm run dominant -- ./sample-images/mostly-red.png --top 3
```

Show JSON output:

```sh
npm run dominant -- ./sample-images/mostly-red.png --top 3 --json
```

Run verification:

```sh
npm test
npm run build
```

## 4. How The Algorithm Works In Plain English

The program looks at every visible pixel in the image and keeps a count of how many times each colour appears.

Before counting, it rounds colours into simple buckets. For example, with a bucket size of 10, values near red such as `251,2,3` and `249,4,1` both become `250,0,0`. This makes the result more useful for real images where compression or lighting can create tiny colour differences.

At the end, the colour with the highest count is the dominant colour. If the user asks for more than one colour, the program returns the top N colours.

## 5. How The Algorithm Works Technically

The algorithm receives `LoadedImageData`, which contains width, height, channel count, and a `Uint8Array` of RGBA bytes.

For each pixel:

1. Read `red`, `green`, `blue`, and `alpha`.
2. Skip the pixel if `alpha < alphaThreshold`.
3. Round each RGB channel to the nearest multiple of `bucketSize`.
4. Convert the quantised RGB tuple into a key, for example `250,0,0`.
5. Increment that key in a `Map<string, number>`.

Then:

1. Convert histogram entries back into RGB results.
2. Calculate each percentage from processed pixels.
3. Sort by count descending.
4. Break tied counts by RGB tuple order.
5. Return the requested top N results.

## 6. How The Image Buffer Is Read

Sharp returns the image as raw pixel data after this chain:

```ts
sharp(filePath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
```

`ensureAlpha()` guarantees four channels per pixel: red, green, blue, and alpha. `raw()` asks Sharp for decoded pixel bytes instead of an encoded PNG or JPG file.

The buffer layout is repeated RGBA values:

```text
R, G, B, A, R, G, B, A, R, G, B, A, ...
```

So pixel one starts at offset `0`, pixel two starts at offset `4`, pixel three starts at offset `8`, and so on.

## 7. Why RGB Quantisation Is Used

Exact RGB counting can be too sensitive for real-world images. A JPEG may contain many slightly different reds because of compression, lighting, or anti-aliasing.

Quantisation reduces that noise by rounding channel values into buckets. With the default bucket size of 10:

- `244` becomes `240`
- `249` becomes `250`
- `255` stays clamped at `255`

This keeps the approach simple while making the output more useful.

## 8. Why Map/Hash Map Is Used

A `Map` is a good fit because the algorithm needs to count how many times each colour appears.

The colour key is a string such as `250,0,0`, and the value is the number of pixels seen for that colour. Lookup and update are efficient and easy to explain:

```ts
histogram.set(key, (histogram.get(key) ?? 0) + 1);
```

This is a straightforward histogram.

## 9. Why Top N Was Chosen As The Extension Feature

Top N is a natural extension because the algorithm already builds a full histogram of colour counts. Returning one dominant colour or the top five dominant colours uses the same data.

It is useful for interview discussion because it demonstrates sorting, deterministic tie-breaking, result metadata, and option validation without adding unrelated complexity.

## 10. How Transparent Pixels Are Handled

Each pixel has an alpha channel. Alpha represents opacity:

- `0` is fully transparent.
- `255` is fully opaque.

The CLI has an `--alpha-threshold` option, defaulting to `128`. Pixels where alpha is below the threshold are skipped. Pixels equal to the threshold are included.

This prevents transparent background pixels from incorrectly influencing the dominant colour.

## 11. Testing Strategy

Tests use Vitest.

The most important tests focus on pure functions:

- Channel clamping.
- RGB quantisation.
- RGB key conversion.
- Invalid RGB keys.
- Invalid algorithm options.
- Dominant colour selection.
- Quantisation grouping.
- Top N ordering.
- Transparent pixel skipping.
- Percentage calculation.
- Deterministic tie-breaking.
- Empty result when all pixels are transparent.

The dominant colour tests use deterministic in-memory RGBA data rather than real image files. This makes them fast, stable, and easy to understand.

## 12. Complexity Explanation

Let `n` be the number of pixels and `k` be the number of distinct quantised colour buckets.

The pixel scan is `O(n)` because each pixel is visited once.

The histogram uses `O(k)` memory because it stores one entry per distinct quantised colour.

Sorting the final colour buckets is `O(k log k)`. Usually `k` is much smaller than the number of pixels because quantisation groups similar colours together.

## 13. Trade-Offs And Alternatives

Exact RGB counting avoids grouping and gives the literal most common RGB value, but it can produce noisy results for JPEGs or photos.

A larger bucket size groups more colours together, which can make results more stable, but it also loses detail.

Ignoring white or black could help with images that have plain backgrounds, but it adds subjective rules.

Downsampling would make very large images faster, but it becomes approximate because not every pixel is counted.

K-means or perceptual colour spaces can produce more human-friendly palettes, but they are more complex and outside the challenge constraints.

## 14. AI Usage Explanation

AI helped scaffold the project, generate test ideas, and draft documentation.

The implementation was manually verified by running tests, TypeScript build, fixture generation, and CLI smoke commands.

The key requirement was checked carefully: this program finds the most frequent colour using counts in a histogram. It does not calculate average colour. That distinction matters because an average can create a colour that does not actually appear in the image.

## 15. Likely Interviewer Questions And Strong Answers

### What is the project, in simple terms?

It is a command-line program that looks at an image and reports the colour that appears most often.

An image is made of many tiny squares called pixels. Each pixel has colour values. In this project, the colour values are represented as RGB, which means red, green, and blue. Each channel usually has a value from `0` to `255`. For example, `rgb(255, 0, 0)` is bright red because the red channel is at maximum and the green and blue channels are zero.

The program reads every pixel, counts the colours, and returns the most common one. It can also return the top N most common colours.

### Why did you use a histogram instead of averaging?

A histogram counts how often each value appears. In this project, the histogram counts how often each colour appears.

That matches the challenge requirement because the challenge asks for the dominant colour, defined as the colour that appears most frequently.

An average colour is different. To calculate an average, you add all the red values and divide by the number of pixels, then do the same for green and blue. That can produce a colour that does not appear anywhere in the image.

For example, if an image is half red and half blue, the average might be purple. But purple may not be present in the image at all. The dominant colour should be red or blue depending on which appears more often. This is why the project uses counting rather than averaging.

### Is the program genuinely finding the most frequent colour?

Yes. The algorithm scans each processed pixel exactly once. For each pixel, it quantises the RGB values, creates a key such as `250,0,0`, and increments that key in a `Map`.

After the scan, each key has a count. The program sorts the counts from highest to lowest and returns the first result, or the top N results if requested.

This is a direct frequency-counting approach. There is no averaging step and no statistical approximation in the core count.

### What is a pixel?

A pixel is the smallest addressable colour unit in a raster image. A PNG or JPG is essentially a grid of pixels.

For example, a `4x4` image has 4 pixels across and 4 pixels down, so it has 16 pixels in total.

Each pixel stores colour information. In this project, after Sharp decodes the image, every pixel is represented using four channels:

- Red
- Green
- Blue
- Alpha

Alpha means opacity, or how transparent the pixel is.

### What is RGB?

RGB stands for red, green, and blue. It is a common way to represent colour on screens.

Each channel is a number, usually from `0` to `255`.

- `rgb(0, 0, 0)` is black.
- `rgb(255, 255, 255)` is white.
- `rgb(255, 0, 0)` is red.
- `rgb(0, 255, 0)` is green.
- `rgb(0, 0, 255)` is blue.

Different combinations of these three channels create different colours.

### What is alpha?

Alpha represents opacity. It tells us how visible a pixel is.

In this project, alpha is also a value from `0` to `255`.

- `0` means fully transparent.
- `255` means fully opaque.
- Values in the middle are partly transparent.

The program skips pixels where alpha is below the configured threshold. This prevents invisible or mostly transparent pixels from affecting the dominant colour.

### What is Sharp?

Sharp is a Node.js image-processing library. It can load common image formats such as PNG and JPG, decode them, and expose the raw pixel data.

In this project, Sharp is used only in `src/imageLoader.ts`. That is intentional. The algorithm should not know about Sharp, file formats, or image decoding. It only receives plain pixel data.

This separation makes the algorithm easier to test because tests can provide small in-memory pixel arrays instead of needing real image files.

### How does the Sharp loader work?

The loader calls:

```ts
sharp(filePath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
```

`sharp(filePath)` opens the image.

`ensureAlpha()` makes sure every pixel has an alpha channel. Some images, such as many JPG files, do not naturally have transparency. After `ensureAlpha()`, every pixel has red, green, blue, and alpha channels.

`raw()` asks Sharp to return decoded pixel bytes rather than another encoded image file.

`toBuffer({ resolveWithObject: true })` returns both the raw buffer and metadata such as width, height, and number of channels.

### How is the image buffer read?

The raw buffer is read as repeated groups of four values:

```text
R, G, B, A
```

So the first pixel uses indexes `0`, `1`, `2`, and `3`.

The second pixel uses indexes `4`, `5`, `6`, and `7`.

The algorithm loops through the buffer in steps of four:

```ts
for (let offset = 0; offset < image.data.length; offset += 4) {
  const red = image.data[offset];
  const green = image.data[offset + 1];
  const blue = image.data[offset + 2];
  const alpha = image.data[offset + 3];
}
```

This is simple and efficient because it reads the bytes in order.

### What is quantisation?

Quantisation means reducing a large set of possible values into a smaller set of buckets.

For colours, exact RGB has many possibilities. Each channel can be `0` to `255`, so there are over 16 million possible RGB combinations.

The project reduces this by rounding each channel to the nearest multiple of the bucket size. With bucket size `10`, values are rounded to numbers like `0`, `10`, `20`, `30`, and so on.

For example:

- `244` becomes `240`
- `249` becomes `250`
- `251` becomes `250`

This means very similar colours are treated as the same colour for counting.

### Why is RGB quantisation useful?

Real images often contain tiny variations. A flat red area in a JPEG might not be exactly the same red for every pixel. Compression may create nearby colours like `251,2,3`, `249,4,1`, and `250,0,2`.

Without quantisation, those would be counted as separate colours. The dominant red area might be split across several almost-identical keys.

With quantisation, those near-red colours can be grouped into one bucket such as `250,0,0`. That makes the result more useful while keeping the method easy to explain.

### Is quantisation always correct?

It is correct for the chosen design, but it is a trade-off.

The challenge asks us to reduce the colour space by rounding RGB values to the nearest multiple of a configurable bucket size. This implementation does exactly that.

However, quantisation can merge colours that are distinct but close together. A larger bucket size means more grouping and less precision. A smaller bucket size means more precision but less grouping.

The default bucket size of `10` is a practical balance for this challenge.

### How does the program handle `255` during quantisation?

Quantisation rounds to the nearest multiple of the bucket size, then clamps the result to the valid RGB range of `0` to `255`.

For example, with bucket size `10`, `255 / 10` is `25.5`, which rounds to `26`, and `26 * 10` is `260`. Since `260` is outside the valid RGB range, it is clamped back to `255`.

This prevents invalid RGB values.

### Why use a `Map` or hash map?

A hash map stores key-value pairs and is efficient for lookups and updates.

In this project:

- The key is a colour string such as `250,0,0`.
- The value is the number of pixels counted for that colour.

For each pixel, the program needs to ask: have I seen this colour before? If yes, increase the count. If no, start the count at one.

A `Map` makes that direct:

```ts
histogram.set(key, (histogram.get(key) ?? 0) + 1);
```

This is efficient and easy to explain in an interview.

### What is a histogram?

A histogram is a count of how often values appear.

For example, if the pixels are:

```text
red, red, red, blue
```

The histogram is:

```text
red: 3
blue: 1
```

The dominant colour is red because it has the highest count.

### How do you handle transparent pixels?

Each pixel has an alpha value. The program compares that value with `alphaThreshold`.

If `alpha < alphaThreshold`, the pixel is skipped.

If `alpha >= alphaThreshold`, the pixel is counted.

The default threshold is `128`, which treats mostly transparent pixels as not meaningful for dominant colour detection.

The report includes `skippedTransparentPixels`, so the user can see how many pixels were excluded.

### Why skip transparent pixels before quantisation?

Transparency is about whether the pixel should contribute to the visible result. If a pixel is mostly invisible, its RGB values should not affect the dominant visible colour.

Skipping first also saves a tiny amount of work because the program does not quantise or count pixels that will be ignored anyway.

### Why was top N chosen as the extension feature?

Top N is a natural extension because the algorithm already creates a full histogram.

If we can find the most common colour, we can also sort the histogram and return the top three or top five colours.

This adds useful functionality without changing the core algorithm. It also creates good interview discussion around sorting, tie-breaking, percentages, and output formats.

### How does deterministic tie-breaking work?

Sometimes two colours have the same count. If the program only sorts by count, their order may depend on insertion order or implementation details.

Deterministic tie-breaking means the program uses a clear rule so the output is always the same.

This project sorts equal-count colours by RGB tuple order:

1. Compare red.
2. If red is the same, compare green.
3. If green is the same, compare blue.

For example, `[0, 0, 250]` comes before `[250, 0, 0]` because `0` is less than `250` in the red channel.

This is especially important for tests because stable output makes assertions reliable.

### What is the time complexity?

The pixel scan is `O(n)`, where `n` is the number of pixels.

That means if the image has 1,000 pixels, the loop runs 1,000 times. If the image has 1,000,000 pixels, the loop runs 1,000,000 times.

After scanning, the program sorts the colour buckets. If there are `k` distinct quantised colours, sorting is `O(k log k)`.

So the overall work is:

```text
O(n) + O(k log k)
```

Usually `k` is much smaller than `n`, especially when quantisation is enabled.

### What is the memory complexity?

The histogram stores one entry per distinct quantised colour.

If `k` is the number of distinct quantised colour buckets, memory usage is `O(k)`.

The raw image buffer is also held in memory because Sharp returns the decoded image data. For very large images, that can be significant.

### Are the tests meaningful?

Yes. The tests focus on the parts where correctness matters most.

The colour utility tests cover clamping, quantisation, conversion to and from histogram keys, and invalid keys.

The algorithm tests use tiny in-memory images with known pixel values. That makes the expected result obvious. For example, if the test data has three red pixels and one blue pixel, the expected dominant colour should be red.

The tests also cover transparency, top N ordering, percentages, invalid options, malformed image data, and deterministic tie-breaking.

### Why test with in-memory image data instead of real image files?

In-memory data is deterministic and simple.

A test can define exactly these pixels:

```text
red, red, red, blue
```

Then the expected answer is obvious.

Real image files are better for integration tests, but they add complexity. File formats, compression, and metadata can distract from testing the algorithm itself.

This project separates the algorithm from Sharp so the core logic can be tested without relying on image decoding.

### What would you test next?

I would add dedicated CLI tests to check argument parsing, error output, JSON output, and exit codes.

I would also add an image-loader integration test using a tiny generated PNG to prove that Sharp decoding produces the expected `LoadedImageData` shape.

For production use, I would add tests around very large images, unsupported files, corrupt images, and cases where every pixel is transparent.

### What edge cases are handled?

The project handles:

- Invalid `top` values.
- Invalid `bucketSize` values.
- Invalid `alphaThreshold` values.
- Malformed image data length.
- Invalid channel count.
- Transparent pixels.
- All-transparent images.
- Quantised values above `255`.
- Equal-count tie-breaking.

### What edge cases are not fully handled?

The CLI does not currently have dedicated tests for invalid arguments or missing files.

The loader relies on Sharp to report errors for unsupported or corrupt images. That is reasonable for a small challenge, but in a production tool I might wrap those errors with more user-friendly messages.

Very large images are loaded fully into memory, so memory usage could become a concern.

### Is anything over-engineered?

No. The project uses a small number of files with clear responsibilities.

There are no unnecessary classes, frameworks, web UI, databases, queues, or advanced colour models.

The only abstractions are practical boundaries:

- CLI parsing.
- Image loading.
- Colour utility functions.
- Core algorithm.
- Shared types.

Those boundaries make the code easier to test and explain.

### Why not use k-means?

K-means is a clustering algorithm. It groups data points into clusters based on distance from cluster centres.

For image colours, k-means can be used to create a palette of representative colours. However, it is more complex than simple counting. It also may return representative colours that are not the most frequent exact colour.

The challenge explicitly says not to use k-means, and the requirement is to find the most frequent colour. A histogram is simpler and more appropriate.

### What is a perceptual colour space?

RGB describes how screens mix red, green, and blue light, but it does not perfectly match how humans perceive colour difference.

A perceptual colour space, such as Lab, tries to represent colours so that distances between values better match human visual perception.

That can be useful for palette extraction or colour similarity. It is not needed here because the challenge asks for a simple RGB dominant-colour finder.

### Why not ignore white or black by default?

Ignoring white or black can be useful for some images, especially screenshots or product photos with plain backgrounds.

However, it is subjective. In some images, white or black may genuinely be the dominant colour and should be reported.

For this challenge, the correct default is to count visible pixels consistently. Ignoring white or black is listed as a future improvement because it would need clear options and documentation.

### How would you handle very large images?

The current version loads the full decoded image into memory and scans every pixel. That is accurate, but memory usage grows with image size.

For very large images, I would consider downsampling before counting. Downsampling means reducing the image dimensions, for example from `4000x3000` to `400x300`.

That would be faster and use less memory, but it would become approximate because we would not count every original pixel.

Another option would be streaming or tile-based processing, but that would add complexity.

### What does "strict TypeScript" give you here?

Strict TypeScript catches more mistakes at compile time.

For example, it helps ensure that `LoadedImageData` has width, height, channel count, and data. It also makes the RGB tuple type explicit:

```ts
type Rgb = [number, number, number];
```

That tells readers and the compiler that an RGB colour should have exactly three numbers.

Strict mode is useful for an SDET-style project because it supports correctness before runtime.

### Why keep CLI parsing separate from algorithm logic?

CLI parsing is about user input: command-line arguments, option names, defaults, and error messages.

The algorithm is about pixel processing and colour counting.

Keeping them separate means the algorithm can be tested directly without running a command-line process. It also means a future API, batch script, or GUI could reuse the algorithm without depending on Commander.

### Why keep Sharp-specific logic isolated?

Sharp is an external image-loading library. It deals with file formats and decoded image buffers.

The dominant-colour algorithm should not care whether the pixels came from Sharp, a test array, or another image library.

By isolating Sharp in `imageLoader.ts`, the rest of the code stays simpler and easier to test.

### How would you explain the key line of counting code?

The key line is:

```ts
histogram.set(key, (histogram.get(key) ?? 0) + 1);
```

In plain English:

Look up the current count for this colour. If there is no count yet, use zero. Add one. Store the new count back in the map.

So if red has already been seen three times, the next red pixel updates the count to four.

### What mistakes did AI help avoid or introduce?

AI helped generate the project structure, tests, and documentation quickly. It also helped keep a checklist of requirements visible.

The main mistake to avoid was confusing dominant colour with average colour. This was manually checked in the implementation and README. The algorithm uses a histogram, not averaging.

During verification, one test expectation initially forgot to request `top: 2` while expecting two colours. Running the tests caught that quickly, and the test was fixed. That is a good example of why automated tests matter even when code looks straightforward.

### How would you prove to me this is not average colour?

I would point to the algorithm and tests.

The code never adds RGB values together to divide by the number of pixels. Instead, it creates a count for each quantised RGB key.

The test with more red pixels than blue pixels proves the behaviour:

```text
red, red, red, blue
```

The result is red with count three. An average-colour algorithm would work differently and would not produce frequency counts.

### What would make this production-ready?

I would add stronger CLI tests, better user-facing error messages, loader integration tests, benchmark tests for large images, and coverage reporting.

I would also consider whether users need approximate mode, downsampling, configurable output formats, ignoring background colours, or perceptual colour grouping.

For this interview challenge, I intentionally kept those out because the requirement values simplicity, readability, and explainability.

