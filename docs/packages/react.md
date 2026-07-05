# `@openorca-ui/react`

> `@openorca-ui/react` is now the single published package for the whole library. The runtime contracts live at the `@openorca-ui/react/runtime` (and `@openorca-ui/react/core`) subpath, and the branded shell lives at `@openorca-ui/react/theme` (stylesheet at `@openorca-ui/react/styles.css`).

Use `@openorca-ui/react` when you want OpenOrca building blocks without committing to the full shell.

## What It Owns

- reusable operational UI components
- shared hooks such as runtime loading and API key storage
- theme context and lower-level UI primitives used by the shell

## Use It When

- you want a custom dashboard layout
- you want to embed only certain panels
- you need direct access to `useOpenOrcaRuntime`

## Representative Exports

- `AgentVisualization`
- `ActionTimeline`
- `AgentStream`
- `AgentInterventionPanel`
- `AgentInspector`
- `SwarmDashboard`
- `FleetHealthPanel`
- `useOpenOrcaRuntime`
