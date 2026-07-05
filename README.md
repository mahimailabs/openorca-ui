# OpenOrca UI

OpenOrca UI is a frontend-only React package for agent operations interfaces.

It ships as one published package, `@openorca-ui/react`, with subpath entry points:
- `@openorca-ui/react` for reusable OpenOrca components and hooks
- `@openorca-ui/react/runtime` for shared types and data contracts
- `@openorca-ui/react/theme` for the branded provider and full dashboard shell

Most users should start with `@openorca-ui/react/theme`.

## Quick Start

Install the package:

```bash
npm install @openorca-ui/react
```

If you render the branded shell and import the stylesheet, `tailwindcss` and `tw-animate-css` are optional peers.

## Use It On A React Page

The fastest way to use OpenOrca is to render the full dashboard shell.

### `src/main.tsx`

```tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "@openorca-ui/react/styles.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### `src/App.tsx`

```tsx
import { OpenOrcaDashboard, OpenOrcaProvider } from "@openorca-ui/react/theme";

export default function App() {
  return (
    <OpenOrcaProvider>
      <OpenOrcaDashboard />
    </OpenOrcaProvider>
  );
}
```

## Start From Scratch With Vite

Create a new app:

```bash
npm create vite@latest my-openorca-app -- --template react-ts
cd my-openorca-app
npm install
npm install @openorca-ui/react
```

Then replace `src/main.tsx` and `src/App.tsx` with the examples above.

Start the app:

```bash
npm run dev
```

## What `OpenOrcaProvider` Does

`OpenOrcaProvider` already includes:
- React Query provider
- theme provider
- tooltip provider
- toaster notifications

You do not need to wire those separately for the default dashboard setup.

## What You Get By Default

With `@openorca-ui/react/theme`, you get:
- the full OpenOrca dashboard shell
- built-in demo/mock state
- theme styling via `@openorca-ui/react/styles.css`
- frontend-only behavior with no backend required

## Frontend-Only Mode

This repo is currently frontend-only.

That means:
- no database is required
- no Express server is required
- the dashboard works with built-in demo data
- some interactions are simulated for UI/demo purposes

This makes it easy to embed OpenOrca into a React app without standing up backend infrastructure first.

## Package Overview

### `@openorca-ui/react`

Import from here when you want lower-level OpenOrca components and hooks to build your own custom layout.

### `@openorca-ui/react/runtime`

Import from here when you need OpenOrca domain types and shared data contracts.

### `@openorca-ui/react/theme`

Import from here when you want the full branded OpenOrca experience with the least setup.

## Local Development

From this repo:

```bash
npm install
npm run check
npm run build
npm run dev
npm run docs:dev
```

The demo app is served through Vite and shows the same `OpenOrcaProvider` + `OpenOrcaDashboard` integration path documented above.

The VitePress docs site lives in `docs/` and can be built with:

```bash
npm run docs:build
```

The VitePress site is configured with a GitHub Pages base path of `/openorca-ui/`.
Deployments should run from GitHub Actions using the workflow in `.github/workflows/deploy-docs.yml`, which builds `docs/.vitepress/dist`.
In the repository Pages settings, set the deployment source to **GitHub Actions**.

## Example Consumer Shape

The included demo uses the same pattern you should use in your own app:
- import `@openorca-ui/react/styles.css` once at app entry
- wrap your page in `OpenOrcaProvider`
- render `OpenOrcaDashboard`

## Next Step

If you want more control than the full dashboard shell, start composing your own pages with `@openorca-ui/react`.

## License

MIT

## Credits

The idea was inspired from Ian's brilliant work - [OpenOrca](https://github.com/ianpilon/OpenOrca)
