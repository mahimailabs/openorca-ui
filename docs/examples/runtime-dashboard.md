# Runtime Dashboard Example

This example assumes you already have a bridge service exposing the OpenOrca runtime contract for a LiveKit Agents backend.

## `src/App.tsx`

```tsx
import { OpenOrcaDashboard, OpenOrcaProvider } from "@openorca-ui/theme";

export default function App() {
  return (
    <OpenOrcaProvider>
      <OpenOrcaDashboard
        mode="runtime"
        runtimeConfig={{
          snapshotUrl: "http://localhost:8000/openorca/snapshot",
          eventsUrl: "http://localhost:8000/openorca/events",
          resolveInterventionUrl:
            "http://localhost:8000/openorca/interventions/resolve",
          runtimeInfoUrl: "http://localhost:8000/openorca/runtime",
        }}
      />
    </OpenOrcaProvider>
  );
}
```

## Expected `runtimeConfig`

Use these endpoints for a bridge-backed LiveKit deployment:

- `snapshotUrl`: returns the current `OpenOrcaSnapshot`
- `eventsUrl`: streams `OpenOrcaEvent` payloads over SSE
- `resolveInterventionUrl`: accepts `approve`, `deny`, and `later`
- `runtimeInfoUrl`: returns runtime metadata with `runtime: "livekit-agents"`

## End-to-End Scenario

A typical operator flow looks like this:

1. The dashboard loads a LiveKit-backed snapshot and shows `runtime: "livekit-agents"`.
2. A new task appears as the bridge emits `task.created`.
3. Tool activity and workflow progress stream into the action log through `action.logged` and `task.updated` events.
4. The bridge emits `intervention.created` when the runtime pauses for an operator decision.
5. The operator sends `approve`, `deny`, or `later` through `POST /openorca/interventions/resolve`.
6. The bridge resumes or terminates the underlying workflow and emits the follow-up task and intervention updates.

See [Runtime Bridge Contract](/integrations/runtime-bridge-contract), [LiveKit Agents](/integrations/livekit-agents), and [LiveKit Intervention Lifecycle](/integrations/livekit-interventions).
