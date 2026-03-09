# Runtime Dashboard Example

This example assumes you already have a bridge service exposing the OpenOrca runtime contract.

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
          resolveInterventionUrl: "http://localhost:8000/openorca/interventions/resolve",
          runtimeInfoUrl: "http://localhost:8000/openorca/runtime",
        }}
      />
    </OpenOrcaProvider>
  );
}
```

## Expected Backend Behavior

- return one current snapshot
- stream runtime updates over SSE
- accept intervention commands from the operator UI

See [Runtime Bridge Contract](/integrations/runtime-bridge-contract).
