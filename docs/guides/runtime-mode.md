# Runtime Mode

Runtime mode swaps local demo data for a real backend bridge.

## Dashboard API

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

## Data Flow

```text
bridge snapshot endpoint -> dashboard bootstrap state
bridge SSE endpoint      -> live updates
intervention POST        -> approve / deny / later
```

## Hook API

`useOpenOrcaRuntime(config)` is the lower-level runtime loader used by the shell.

It is responsible for:

- fetching the initial snapshot
- opening the SSE stream
- tracking connection state
- sending intervention resolution commands

## Connection States

The runtime connection state visible in the UI is:

- `idle`
- `loading`
- `connected`
- `degraded`
- `disconnected`
- `error`
