# AutoCR

AutoCR is a static web app for analyzing and reviewing data associated with RetroAchievements achievement sets, such as trigger logic for achievements, leaderboards, and rich presence.

## Requirements

- [Bun](https://bun.sh/)

## Run locally

Serve the repository root:

```shell
bunx serve . -l 8080
```

Open http://localhost:8080.

### Run the middleware locally

The middleware is a proxy server that logs in to RetroAchievements and gets achievement set data and code notes. To run it locally follow these steps.

First, create `middleware/credentials.js`:

```js
export const username = 'your-ra-username';
export const password = 'your-ra-password';
```

Then start the middleware:

```shell
cd middleware
bun install
bun start
```

The middleware runs at http://localhost:3000. To use it, change the middleware URL in `js/overview.js` to `http://localhost:3000/pack/`.

## Local Checks

_test/_ exists, but for now, all testing is local fixtures. There are no automated checks for the time being.

## Deployment

Commits to `main` automatically deploy the repo root to [GitHub Pages](https://retroachievements.github.io/AutoCR/).

The middleware currently deploys to Vercel. Changes to _server.js_ do not currently trigger a redeploy.
