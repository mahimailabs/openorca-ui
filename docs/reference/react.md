# React Reference

> `@openorca-ui/react` is the single published package for the library. Components and hooks live at the package root, runtime contracts at `@openorca-ui/react/runtime` (full barrel at `@openorca-ui/react/core`), and the branded shell at `@openorca-ui/react/theme`.

## Package

```ts
import {} from "@openorca-ui/react";
```

## Entry Points

- `@openorca-ui/react` — components and hooks
- `@openorca-ui/react/runtime` — runtime contracts and reducer
- `@openorca-ui/react/core` — full core barrel (runtime + clawData + knowledge)
- `@openorca-ui/react/theme` — `OpenOrcaDashboard` and `OpenOrcaProvider`
- `@openorca-ui/react/styles.css` — stylesheet

## Curated Exports

- `AgentVisualization`
- `ActionTimeline`
- `AgentStream`
- `AgentInterventionPanel`
- `AgentInspector`
- `SwarmDashboard`
- `FleetHealthPanel`
- `ThemeProvider`
- `useTheme`
- `useOpenOrcaRuntime`

## `useOpenOrcaRuntime`

```ts
interface OpenOrcaRuntimeConfig {
  snapshotUrl: string;
  eventsUrl: string;
  resolveInterventionUrl: string;
  runtimeInfoUrl?: string;
}
```

```ts
function useOpenOrcaRuntime(config?: OpenOrcaRuntimeConfig): {
  snapshot: OpenOrcaSnapshot | null;
  runtimeInfo: OpenOrcaRuntimeInfo | null;
  status: OpenOrcaConnectionStatus;
  error?: string;
  resolveIntervention: (request: ResolveInterventionRequest) => Promise<void>;
};
```

Use this hook when you want runtime mode without the full `OpenOrcaDashboard` shell.
