# Theme Reference

## Package

```ts
import { OpenOrcaDashboard, OpenOrcaProvider } from "@openorca-ui/theme";
import "@openorca-ui/theme/styles.css";
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

Import `@openorca-ui/theme/styles.css` once at your app entry.
