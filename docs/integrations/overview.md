# Integrations Overview

OpenOrca is designed to be runtime-agnostic at the package layer.

## Integration Shape

Use a bridge service between your runtime and the dashboard:

```text
agent runtime -> bridge service -> OpenOrca UI
```

The bridge is responsible for:

- producing an initial `OpenOrcaSnapshot`
- streaming `OpenOrcaEvent` updates
- accepting intervention commands from the UI

## Primary Documented Runtime

LiveKit Agents is the primary documented backend integration because it fits OpenOrca's real-time, human-in-the-loop operator model while keeping the frontend transport stable.

See:

- [Runtime Bridge Contract](/integrations/runtime-bridge-contract)
- [LiveKit Agents](/integrations/livekit-agents)
- [LiveKit Migration Architecture Decision](/integrations/livekit-migration-architecture)
- [LiveKit Mapping Spec](/integrations/livekit-mapping)
- [LiveKit Intervention Lifecycle](/integrations/livekit-interventions)
