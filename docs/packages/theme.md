# `@openorca-ui/theme`

Use `@openorca-ui/theme` when you want the full branded OpenOrca experience with minimal setup.

## What It Owns

- `OpenOrcaProvider`
- `OpenOrcaDashboard`
- the default OpenOrca shell composition
- the published stylesheet at `@openorca-ui/theme/styles.css`

## Use It When

- you want to get a dashboard on screen quickly
- you want the default OpenOrca visual language
- you want demo mode or runtime mode without hand-composing every panel

## Minimum Usage

```tsx
import { OpenOrcaDashboard, OpenOrcaProvider } from "@openorca-ui/theme";
import "@openorca-ui/theme/styles.css";

export function App() {
  return (
    <OpenOrcaProvider>
      <OpenOrcaDashboard />
    </OpenOrcaProvider>
  );
}
```
