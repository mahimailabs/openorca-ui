# Runtime Bridge Contract

The OpenOrca runtime contract is transport-simple and UI-focused.

## Required Endpoints

### `GET /openorca/snapshot`

Returns one `OpenOrcaSnapshot`.

### `GET /openorca/events`

Returns a Server-Sent Events stream of `OpenOrcaEvent` payloads.

### `POST /openorca/interventions/resolve`

Accepts:

```ts
interface ResolveInterventionRequest {
  interventionId: string;
  action: "approve" | "deny" | "later";
  actor?: {
    type: "human";
    id?: string;
    name?: string;
  };
}
```

### Optional `GET /openorca/runtime-info`

Returns runtime capability metadata (the `runtimeInfoUrl` in the runtime config):

```ts
interface OpenOrcaRuntimeInfo {
  runtime: string;
  language: string;
  supports: {
    sse: boolean;
    interventions: boolean;
    snapshots: boolean;
  };
}
```

## Event Model

Important event variants:

- `snapshot.replace`
- `agent.updated`
- `task.updated`
- `task.created`
- `action.logged`
- `intervention.created`
- `intervention.resolved`
- `swarm.updated`
- `fleet.updated`
- `runtime.status`

The bridge should map runtime-native state into these UI-facing events rather than leaking runtime internals directly into the dashboard.
