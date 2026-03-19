# Core Reference

## Package

```ts
import {} from "@openorca-ui/core";
```

## Important Entry Points

- `@openorca-ui/core`
- `@openorca-ui/core/clawData`
- `@openorca-ui/core/runtime`
- `@openorca-ui/core/knowledge`

## Key Runtime Types

```ts
type OpenOrcaConnectionStatus =
  | "idle"
  | "loading"
  | "connected"
  | "degraded"
  | "disconnected"
  | "error";
```

```ts
interface OpenOrcaSnapshot {
  meta: {
    runtime: string;
    runtimeVersion?: string;
    generatedAt: string;
    connectionStatus: "connected" | "degraded" | "disconnected";
  };
}
```

```ts
type OpenOrcaEvent =
  | { type: "snapshot.replace"; snapshot: OpenOrcaSnapshot }
  | { type: "agent.updated"; agent: ClawAgent }
  | { type: "task.updated"; task: AgentTask }
  | { type: "task.created"; task: AgentTask }
  | { type: "action.logged"; action: ActionEntry }
  | { type: "intervention.created"; intervention: Intervention }
  | {
      type: "intervention.resolved";
      interventionId: string;
      resolution: "approve" | "deny" | "later";
    }
  | { type: "swarm.updated"; swarm: Swarm }
  | { type: "fleet.updated"; fleetHealth: FleetHealth }
  | {
      type: "runtime.status";
      status: "connected" | "degraded" | "disconnected";
      message?: string;
    };
```

## Helpers

- `generateClawData()`
- `applyOpenOrcaEvent(snapshot, event)`
- `createRuntimeSnapshot(data, overrides?)`
