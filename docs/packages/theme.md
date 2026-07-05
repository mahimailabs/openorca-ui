# `@openorca-ui/react/theme`

> Formerly the standalone `@openorca-ui/theme` package. The library is now published as a single package, `@openorca-ui/react`, and the branded shell ships as the `@openorca-ui/react/theme` subpath (stylesheet at `@openorca-ui/react/styles.css`). Install `@openorca-ui/react` to use it.

Use `@openorca-ui/react/theme` when you want the full branded OpenOrca experience with minimal setup.

## What It Owns

- `OpenOrcaProvider`
- `OpenOrcaDashboard`
- the default OpenOrca shell composition
- the published stylesheet at `@openorca-ui/react/styles.css`

## Use It When

- you want to get a dashboard on screen quickly
- you want the default OpenOrca visual language
- you want demo mode or runtime mode without hand-composing every panel

## Minimum Usage

```tsx
import { OpenOrcaDashboard, OpenOrcaProvider } from "@openorca-ui/react/theme";
import "@openorca-ui/react/styles.css";

export function App() {
  return (
    <OpenOrcaProvider>
      <OpenOrcaDashboard />
    </OpenOrcaProvider>
  );
}
```
