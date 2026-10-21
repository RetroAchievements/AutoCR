# AutoCR

AutoCR is a static web app for analyzing and reviewing data associated with RetroAchievements achievement sets, such as trigger logic for achievements, leaderboards, and rich presence.

## Requirements

- [Bun](https://bun.sh/)

## Install

The first step is to install the dependencies:

```shell
bun install
```

## Run locally

### Dev run

To get a dev run with hot reload:

```shell
bun run dev
```

### Build run

Build the project:

```shell
bun run build
```

Serve the built artifacts:

```shell
bun run start
```

Open http://localhost:8080.

### Run the middleware locally

The middleware is a proxy server that logs in to RetroAchievements and gets achievement set data and code notes. To run it locally follow these steps.

First, copy _middleware/.env.example_ to _middleware/.env.local_. Then, write your RetroAchievements credentials:

```shell
RA_USERNAME=your-ra-username
RA_PASSWORD=your-ra-password
```

Bun reads _.env_ and _.env.local_ automatically.

Then start the middleware:

```shell
cd middleware
bun install
bun start
```

The middleware runs at http://localhost:3000. To use it, add the `middleware` query parameter to the app URL:

```
http://localhost:8080?middleware=http://localhost:3000
```

## Local Checks

[oxfmt](https://oxc.rs/docs/guide/usage/formatter) handles formatting and [oxlint](https://oxc.rs/docs/guide/usage/linter) handles linting. [bun test](https://bun.sh/docs/test) powers AutoCR's test suite. Test files live beside the code they cover. The fixtures those tests load live in _test/fixtures/_.

```shell
bun run format    # autoformat all files
bun run lint:fix  # apply linting autofixes
bun run test      # run every test file with isolation enabled
```

`bun run test` isolates each test file, so module state such as `current` in _js/state.js_ cannot leak from one file into the next.

### Title case benchmark

In `test/fixtures/titlecase-reference.json`, there are 10,000 randomly sampled (real) achievement titles with the
reference casing from [titlecaseconverter.com](https://titlecaseconverter.com/?style=CMOS) (Chicago, keep all caps).
The benchmark can be used to verify changes in the word lists or rules in `js/titlecase.js`:

```shell
bun run benchmark:titlecase            # accuracy, false positives, misses
bun run benchmark:titlecase --verbose  # also lists every disagreement
```

Note: There are certain edge cases where the reference output is questionable and not following the rules posted on
titlecaseconverter.com.

## Deployment

Commits to `main` automatically deploy the repo root to [GitHub Pages](https://retroachievements.github.io/AutoCR/).

The middleware currently deploys to Vercel. Changes to _server.js_ do not currently trigger a redeploy.
