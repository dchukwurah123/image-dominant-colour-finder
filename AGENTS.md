# AGENTS.md

Guidance for agents working in this repository.

## Project Context

This repository is for a technical interview coding challenge for a Mid-level Software Developer in Test role at FX Digital.

The goal is to build a small TypeScript Node.js CLI tool that finds the dominant colour of an image.

Optimise for an interview-friendly solution: simple, readable, deterministic, and easy to explain line by line.

## Engineering Principles

- Keep the solution simple and avoid clever abstractions.
- Prefer clear design over advanced techniques.
- Use TypeScript strict mode.
- Use meaningful names and small focused functions.
- Prefer pure functions wherever possible.
- Add comments only for non-obvious logic.
- Keep CLI parsing separate from algorithm logic.
- Keep Sharp/image-loading logic isolated from the core algorithm.
- Do not build a web UI.
- Do not use machine learning, k-means, OpenCV, or advanced clustering.
- Do not calculate average colour. The challenge asks for the most frequent colour.
- Use British spelling in documentation where natural, such as colour, quantisation, and behaviour.

## Suggested Structure

Keep responsibilities separated so each part is easy to test and discuss:

- CLI entry point: parse arguments, validate user-facing options, print output, set exit codes.
- Image loading adapter: use Sharp to read pixels and metadata, then convert them into plain in-memory data.
- Core algorithm: pure functions that accept pixel data/options and return dominant colour results.
- Formatting helpers: convert colours to display formats such as hex or RGB strings.

Avoid letting Sharp types or CLI framework details leak into the dominant colour algorithm.

## Algorithm Expectations

Find the most frequent colour, not the average colour.

The core algorithm should:

- Accept deterministic in-memory pixel data for testing.
- Ignore transparent pixels according to a clear transparency rule.
- Support quantisation in a simple, explainable way.
- Count colour frequencies with straightforward data structures such as `Map`.
- Return top N colours in deterministic order.
- Resolve ties deterministically, using a documented rule such as RGB tuple ordering.
- Validate invalid options before processing where practical.

Keep complexity easy to explain. A typical implementation should be linear in the number of pixels, plus sorting only when top N results are requested.

## Testing Expectations

Use Vitest.

Add automated tests for pure functions first, especially the dominant colour algorithm. Use deterministic in-memory image data rather than fixture files for algorithm tests.

Coverage should include:

- Quantisation behaviour.
- Transparent pixel handling.
- Top N ordering.
- Invalid options.
- Deterministic tie-breaking.
- CLI behaviour where useful.

All tests must pass before handing over implementation changes.

## Documentation Expectations

Keep the README concise but useful for interviewers.

The README should explain:

- What the CLI does.
- How to install dependencies.
- How to run the CLI.
- How to run tests.
- How to build the project.
- The dominant colour approach.
- Algorithm complexity.
- Trade-offs.
- AI usage.
- Future improvements.

Use British spelling in prose where natural.

## Commands

When the project scripts exist, run these before summarising implementation work:

```sh
npm test
npm run build
```

If scripts differ, use the actual commands defined in `package.json` and mention them in the final summary.

## Handover Checklist

Before finishing implementation work:

- Confirm tests pass.
- Confirm the project builds successfully.
- Fix any issues found by tests or build.
- Summarise what changed.
- Explain how to demo the CLI.
- Mention any known limitations or follow-up improvements.

