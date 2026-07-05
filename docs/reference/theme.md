# Theme Reference

> Formerly the standalone `@openorca-ui/theme` package. The branded shell is now the `@openorca-ui/react/theme` subpath of the single published `@openorca-ui/react` package (stylesheet at `@openorca-ui/react/styles.css`). Install `@openorca-ui/react` to use it.

## Package

```ts
import { OpenOrcaDashboard, OpenOrcaProvider } from "@openorca-ui/react/theme";
import "@openorca-ui/react/styles.css";
```

## `OpenOrcaProvider`

Use `OpenOrcaProvider` at the app boundary for the stock shell. It composes the provider stack required by the default dashboard.

## `OpenOrcaDashboard`

```ts
interface OpenOrcaDashboardProps {
  mode?: "demo" | "runtime";
  runtimeConfig?: {
    snapshotUrl: string;
    eventsUrl: string;
    resolveInterventionUrl: string;
    runtimeInfoUrl?: string;
  };
}
```

### Behavior

- default mode is `demo`
- `runtime` mode activates snapshot loading and SSE subscription
- intervention actions call the configured runtime endpoint

## Stylesheet

Import `@openorca-ui/react/styles.css` once at your app entry.
