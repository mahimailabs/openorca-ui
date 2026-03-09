# React Reference

## Package

```ts
import {} from "@openorca-ui/react";
```

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
}
```

Use this hook when you want runtime mode without the full `OpenOrcaDashboard` shell.
