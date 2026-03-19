# LiveKit Agents

LiveKit Agents is the primary documented backend path for OpenOrca runtime mode.

## Why LiveKit Agents Fits

LiveKit Agents already models long-lived sessions, streamed activity, and operator-visible decision points. That makes it a strong match for OpenOrca's dashboard primitives without requiring the frontend to speak LiveKit directly.

## Recommended Topology

```text
LiveKit Agents runtime
  -> OpenOrca bridge service
  -> GET /openorca/snapshot
  -> GET /openorca/events
  -> POST /openorca/interventions/resolve
  -> optional GET /openorca/runtime
  -> OpenOrcaDashboard
```

The bridge translates LiveKit-native jobs, participants, workflow progress, and approval gates into stable OpenOrca snapshot and event payloads.

## What the Bridge Should Do

- summarize the current LiveKit-backed run state as one `OpenOrcaSnapshot`
- stream incremental `OpenOrcaEvent` updates over SSE
- expose intervention resolution commands for `approve`, `deny`, and `later`
- return `runtime: "livekit-agents"` from the runtime metadata endpoint

## What the Frontend Should Not Do

Do not expose raw LiveKit internals directly to the dashboard. Keep the UI bound to the OpenOrca bridge contract so the existing React hook and dashboard shell remain unchanged.

## Next Reading

- [Runtime Bridge Contract](/integrations/runtime-bridge-contract)
- [LiveKit Migration Architecture Decision](/integrations/livekit-migration-architecture)
- [LiveKit Mapping Spec](/integrations/livekit-mapping)
- [LiveKit Intervention Lifecycle](/integrations/livekit-interventions)
- [Runtime Dashboard Example](/examples/runtime-dashboard)
