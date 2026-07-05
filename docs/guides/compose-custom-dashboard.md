# Compose A Custom Dashboard

If the full shell is too opinionated, use `@openorca-ui/react` directly.

## Typical Composition

```tsx
import {
  ActionTimeline,
  AgentInspector,
  AgentInterventionPanel,
  AgentStream,
  AgentVisualization,
  FleetHealthPanel,
} from "@openorca-ui/react";
import { generateClawData } from "@openorca-ui/react/core/clawData";

const data = generateClawData();
```

Use the generated or runtime-loaded data as input to the individual panels. The `@openorca-ui/react/theme` entry point is essentially a first-party composition of these lower-level primitives.

## Recommended Strategy

- start with `@openorca-ui/react/theme`
- identify the panels you want to keep
- move to `@openorca-ui/react` once the layout diverges from the stock shell
