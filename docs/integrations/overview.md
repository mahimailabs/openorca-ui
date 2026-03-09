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

## First Documented Runtime

LangGraph in Python is the first documented runtime because it matches the stateful, human-in-the-loop workflow shape that OpenOrca visualizes well.

See:

- [Runtime Bridge Contract](/integrations/runtime-bridge-contract)
- [LangGraph Python](/integrations/langgraph-python)
