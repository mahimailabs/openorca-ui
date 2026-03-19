---
layout: home

hero:
  name: OpenOrca UI
  text: Agent operations UI for React
  tagline: Build branded operator dashboards, run in demo mode, or connect a runtime bridge such as LiveKit Agents.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: Runtime Integration
      link: /integrations/overview
    - theme: alt
      text: Package Reference
      link: /packages/theme

features:
  - title: Full Dashboard Shell
    details: Start with @openorca-ui/theme for the branded OpenOrca experience with provider, layout, and styles already composed.
  - title: Lower-Level React Primitives
    details: Drop into @openorca-ui/react when you want to build a custom operator page around streams, interventions, inspectors, and swarm views.
  - title: Runtime-Ready Contracts
    details: Use @openorca-ui/core contracts for snapshots, events, and intervention commands when wiring a backend bridge.
---

OpenOrca UI is a frontend-first framework for agent operations dashboards. It is built as three packages:

- `@openorca-ui/core` for shared domain and runtime contracts
- `@openorca-ui/react` for reusable OpenOrca components and hooks
- `@openorca-ui/theme` for the branded provider and full dashboard shell

Most users should start with `@openorca-ui/theme`.

## Package Model

```text
@openorca-ui/core   -> shared types, runtime contracts, state model
@openorca-ui/react  -> reusable operational UI and hooks
@openorca-ui/theme  -> branded provider, shell, default dashboard
```

## Runtime Model

OpenOrca is the UI layer, not the runtime. In runtime mode, the dashboard expects:

- an initial snapshot endpoint
- an SSE event stream
- an intervention command endpoint

LiveKit Agents is the primary documented backend path, but the contracts remain runtime-agnostic so any bridge can target the same UI surface.
