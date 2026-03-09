# Data Model

OpenOrca revolves around a shared operational state model.

## Core Concepts

- `ClawAgent`: an operator-visible agent or logical worker
- `AgentTask`: a tracked unit of work
- `Intervention`: a human-in-the-loop decision request
- `Swarm`: a coordinated set of agents or branches
- `ActionEntry`: a timeline event
- `OpenOrcaSnapshot`: a full dashboard state payload
- `OpenOrcaEvent`: an incremental state update event

## Why This Matters

The UI packages are useful because they share one stable data model. Demo mode and runtime mode both end up rendering the same shapes.

## Snapshot Shape

`OpenOrcaSnapshot` extends the base dashboard data and adds runtime metadata:

```ts
interface OpenOrcaSnapshot {
  agents: ClawAgent[];
  tasks: AgentTask[];
  actionLog: ActionEntry[];
  interventions: Intervention[];
  swarms: Swarm[];
  machines: OpenOrcaMachine[];
  fleetHealth: FleetHealth;
  meta: {
    runtime: string;
    runtimeVersion?: string;
    generatedAt: string;
    connectionStatus: "connected" | "degraded" | "disconnected";
  };
}
```
