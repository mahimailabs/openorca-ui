# `@openorca-ui/react/runtime`

> Formerly the standalone `@openorca-ui/core` package. The library is now published as a single package, `@openorca-ui/react`, and these contracts ship as the `@openorca-ui/react/runtime` subpath (with the full barrel available at `@openorca-ui/react/core`). Install `@openorca-ui/react` to use them.

Use `@openorca-ui/react/runtime` for shared contracts and framework-agnostic data shapes.

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
import { generateClawData } from "@openorca-ui/react/core/clawData";
import type {
  OpenOrcaEvent,
  OpenOrcaRuntimeInfo,
  OpenOrcaSnapshot,
  ResolveInterventionRequest,
} from "@openorca-ui/react/runtime";
```
