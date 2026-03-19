# LiveKit Intervention Lifecycle

This document defines how a LiveKit-backed runtime creates and resolves OpenOrca interventions.

## Creation

An `intervention.created` event is emitted when the LiveKit-backed application logic enters a pending human decision state, such as:

- an approval gate before a sensitive tool call
- a permission request for an external system
- a cost or policy threshold requiring operator review
- a clarification request that blocks continued execution

The bridge should create a durable intervention record keyed by:

- `interventionId`: the OpenOrca-facing identifier
- `sessionId`: the LiveKit session or room identifier
- `jobId` or `workflowId`: the user-visible unit of work
- `gateId`: the underlying approval checkpoint identifier
- `agentId`: the participant or worker identity responsible for the request

## Pending State Storage

Store pending decisions in a bridge-side durable store so intervention state survives bridge restarts and duplicate UI requests. These bridge-local fields are not part of the public `Intervention` interface exposed to the dashboard; they remain internal backend state used to manage resumes and retries. The stored record should include:

- current status: `pending`, `approved`, `denied`, `deferred`, `expired`, or `orphaned`
- timestamps for create, last update, and resolution
- the last known LiveKit session and job state
- any resume payload needed to continue the workflow

## Resolution API Behavior

When the frontend sends `POST /openorca/interventions/resolve`, the bridge should translate the action as follows:

### `approve`

- mark the intervention as approved if it is still pending
- send the corresponding approval or resume signal into the LiveKit-backed workflow
- emit `intervention.resolved`
- emit follow-up task or action events as the job resumes

### `deny`

- mark the intervention as denied if it is still pending
- send the rejection or cancellation signal into the LiveKit-backed workflow
- emit `intervention.resolved`
- update the affected task to `failed` or another terminal state chosen by the backend

### `later`

- mark the intervention as deferred
- keep the underlying job paused or parked
- emit `intervention.resolved` only if the UI should remove the current card and rely on a later re-created intervention
- otherwise keep the intervention in the snapshot and refresh its timestamp/context to show it is still pending

Recommended default: treat `later` as a deferral that keeps the intervention visible in future snapshots, unless product requirements prefer clearing the queue temporarily.

## Correlation Rules

- `interventionId` must be unique and stable for the life of the decision.
- The bridge must maintain a reversible mapping from `interventionId` to the underlying LiveKit session, task, and gate identifiers.
- The affected `AgentTask.status` should move to `waiting_approval` while the intervention is pending.
- The affected `ClawAgent.status` should move to `intervention_required` while the intervention is pending.

## Retry and Duplicate Handling

- Resolution requests must be idempotent by `interventionId` and final action.
- Repeating the same final action should return success without re-sending the underlying LiveKit command.
- Conflicting follow-up decisions on an already resolved intervention should return a conflict response and leave the original decision intact.
- If the bridge cannot reach the LiveKit runtime after accepting a decision, store a retryable pending-delivery state and surface a degraded runtime status.

## Stale Interventions

If the underlying LiveKit session or task has already ended:

- mark the intervention as `expired` or `orphaned`
- reject new decisions with a clear response message
- emit a task update reflecting the terminal session state if one is not already present
- remove the intervention from subsequent snapshots after the terminal state is observable to the operator

## UI Expectations

When an intervention is stale or no longer actionable, the UI should show that the run already ended and that the pending decision can no longer be applied. The bridge should communicate that via the resolution response body and follow-up snapshot or task updates.
