# LangGraph Python

LangGraph in Python is the first recommended runtime integration for OpenOrca.

## Why LangGraph Fits

- stateful execution
- graph-based workflow progression
- human-in-the-loop pause points
- long-running runs with incremental updates

These map naturally onto OpenOrca concepts such as tasks, action logs, interventions, and swarms.

## Recommended Architecture

```text
Python LangGraph runtime
        |
        | lifecycle callbacks, run state, interruption state
        v
OpenOrca bridge service
        |
        | snapshot + SSE + intervention commands
        v
OpenOrca dashboard
```

## Bridge Responsibilities

The bridge should:

- normalize current run state into `OpenOrcaSnapshot`
- emit `OpenOrcaEvent` updates as graph steps progress
- translate human approval pauses into `Intervention`
- forward `approve`, `deny`, and `later` decisions back to LangGraph

## Dashboard Configuration

```tsx
<OpenOrcaDashboard
  mode="runtime"
  runtimeConfig={{
    snapshotUrl: "http://localhost:8000/openorca/snapshot",
    eventsUrl: "http://localhost:8000/openorca/events",
    resolveInterventionUrl: "http://localhost:8000/openorca/interventions/resolve",
    runtimeInfoUrl: "http://localhost:8000/openorca/runtime",
  }}
/>
```

## Mapping Guidance

Recommended first mapping:

- LangGraph run -> one or more `AgentTask` records
- graph node execution -> `ActionEntry`
- interruption awaiting human input -> `Intervention`
- logical worker roles -> `ClawAgent`

Do not force LangGraph internals directly into the UI. The bridge should summarize them into stable OpenOrca contracts.
