# `@openorca-ui/core`

Use `@openorca-ui/core` for shared contracts and framework-agnostic data shapes.

## What It Owns

- domain data for agents, tasks, interventions, swarms, and action logs
- runtime contracts for snapshots, events, and intervention commands
- mock/demo data generation used by the themed dashboard

## Use It When

- you are building a runtime bridge
- you want to normalize backend state into OpenOrca contracts
- you need the same types in frontend and backend code

## Key Imports

```ts
import { generateClawData } from "@openorca-ui/core/clawData";
import type {
  OpenOrcaEvent,
  OpenOrcaRuntimeInfo,
  OpenOrcaSnapshot,
  ResolveInterventionRequest,
} from "@openorca-ui/core/runtime";
```
