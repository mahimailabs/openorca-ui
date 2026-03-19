# Demo vs Runtime

`OpenOrcaDashboard` supports two operating modes.

## Demo Mode

This is the default:

```tsx
<OpenOrcaDashboard />
```

Use demo mode when you want:

- no backend requirement
- built-in generated data
- fast local evaluation of the UI

## Runtime Mode

Use runtime mode when you want the dashboard driven by a real backend bridge:

```tsx
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
```

Runtime mode expects:

- an initial snapshot over HTTP
- live updates over Server-Sent Events
- a POST endpoint for intervention resolution

See [Runtime Mode](/guides/runtime-mode), [Runtime Bridge Contract](/integrations/runtime-bridge-contract), and [LiveKit Agents](/integrations/livekit-agents).
