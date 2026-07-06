# LiveKit Migration Architecture Decision

## Status

Accepted.

## Decision

OpenOrca will adopt **LiveKit Agents behind the existing OpenOrca runtime bridge** as the phase-one migration target.

The frontend contract remains:

- `GET /openorca/snapshot`
- `GET /openorca/events`
- `POST /openorca/interventions/resolve`
- optional `GET /openorca/runtime-info`

The dashboard, `useOpenOrcaRuntime`, and the core runtime types stay on the current fetch + SSE + POST transport surface for the first migration phase.

## Options Considered

### A. LiveKit behind the existing OpenOrca bridge

Pros:

- lowest-risk migration path
- preserves current dashboard behavior and runtime hook APIs
- lets the backend normalize LiveKit-specific details before the UI sees them
- supports incremental rollout with minimal package churn

Cons:

- introduces a translation layer that must maintain LiveKit state and correlations
- does not yet let the browser participate directly in a LiveKit room or session

### B. LiveKit-native frontend transport

Pros:

- allows direct browser participation in LiveKit rooms or sessions
- could unlock richer media-native experiences later

Cons:

- requires a larger product and API redesign
- would force transport abstractions above `packages/react/src/hooks/useOpenOrcaRuntime.ts`
- would deprecate parts of `packages/core/src/runtime.ts` and create a second runtime path before bridge parity exists

## Rationale

The current UI contract is already generic and stable. A bridge-backed LiveKit integration removes legacy runtime-specific positioning immediately while avoiding a risky frontend rewrite. This keeps the migration focused on backend adaptation and documentation rather than transport churn.

## Rollout Order

1. Neutralize runtime branding and defaults in shared packages.
2. Replace legacy runtime-specific docs with LiveKit-first guidance.
3. Publish the architecture, mapping, and intervention specs.
4. Build the LiveKit-backed bridge against the existing runtime contract.
5. Ship a runnable example and operational guidance.
6. Evaluate a LiveKit-native transport only after bridge parity is reached.

## Compatibility Expectations

- `packages/react/src/hooks/useOpenOrcaRuntime.ts` remains the supported frontend integration entrypoint in phase one.
- `packages/core/src/runtime.ts` remains the canonical transport contract in phase one.
- Any future LiveKit-native transport must sit behind a new abstraction that still yields normalized snapshots and events.
- Existing runtime bridges that already speak the OpenOrca contract remain valid.
