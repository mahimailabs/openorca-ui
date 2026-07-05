# VoiceGateway

VoiceGateway speaks the OpenOrca runtime contract **natively**. Unlike a runtime that needs a separate bridge service to translate its internals, the VoiceGateway engine's own server (`voicegw serve`) exposes the `/openorca/*` endpoints directly, so you point the dashboard straight at it.

## Why VoiceGateway Fits

VoiceGateway already tracks a live fleet of voice-agent workers: each agent process calls `voicegateway.register_worker(...)`, which heartbeats presence (idle / busy / offline, active sessions, project, region) to a collector. The engine's server persists that roster and maps it onto an `OpenOrcaSnapshot`, so the dashboard renders your live agents with no extra plumbing.

## Topology

```text
voice agent processes  (register_worker heartbeat)
  -> voicegw serve      (workers roster)
     -> GET  /openorca/snapshot
     -> GET  /openorca/events            (SSE)
     -> POST /openorca/interventions/resolve
     -> GET  /openorca/runtime-info
        -> OpenOrcaDashboard
```

No bridge process: the engine IS the bridge. Point `VOICEGW_COLLECTOR_URL` in your agents at the same `voicegw serve` instance, and its roster feeds the console.

## Connect the Dashboard

Run the engine server (defaults to port 8080):

```bash
voicegw serve --port 8080
```

Then render the dashboard in runtime mode against it:

```tsx
import { OpenOrcaProvider, OpenOrcaDashboard } from "@openorca-ui/theme";
import "@openorca-ui/theme/styles.css";

const VG = "http://localhost:8080"; // your voicegw serve base URL

const runtimeConfig = {
  snapshotUrl: `${VG}/openorca/snapshot`,
  eventsUrl: `${VG}/openorca/events`,
  resolveInterventionUrl: `${VG}/openorca/interventions/resolve`,
  runtimeInfoUrl: `${VG}/openorca/runtime-info`,
};

export default function App() {
  return (
    <OpenOrcaProvider>
      <OpenOrcaDashboard mode="runtime" runtimeConfig={runtimeConfig} />
    </OpenOrcaProvider>
  );
}
```

`mode="runtime"` switches the shell off its built-in demo data and onto the live snapshot; `runtime-info` reports `runtime: "voicegateway"` and the badge goes green once the SSE stream connects. With `mode` omitted (or `"demo"`) the shell renders mock data, so you can develop the layout before a server is up.

## What Surfaces Today

The snapshot is built from the fleet roster, so these light up immediately:

- **Agents** — one node per `agent_name`, grouping its workers; status collapses to `active` (any busy worker), `idle`, or `offline` (aged past the roster TTL).
- **Fleet health** — total / active / offline agents and in-flight sessions.

`tasks`, `swarms`, and `interventions` arrive empty for now (the roster does not yet expose per-session or approval data); those panels render but stay quiet. Enriching them is planned work on the engine mapper.

## Auth

In the default self-hosted, single-operator setup (no static API keys configured), the `/openorca/*` endpoints are reachable without credentials, so the config above works as-is on a trusted network.

The browser `EventSource` used for `/openorca/events` cannot send an `Authorization` header, so a **multi-tenant or authenticated** deployment needs one of: a short-lived token passed as a query parameter, or a reverse proxy that injects the credential. Keep the console on a private network or behind such a proxy; do not expose an unauthenticated `voicegw serve` to the public internet.

## Next Reading

- [Runtime Bridge Contract](/integrations/runtime-bridge-contract)
- [Runtime Dashboard Example](/examples/runtime-dashboard)
- Engine-side: the VoiceGateway "Fleet worker heartbeat contract" (in the voicegateway docs) pins the roster ingestion semantics the snapshot depends on.
