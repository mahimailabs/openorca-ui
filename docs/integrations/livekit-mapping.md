# LiveKit Mapping Spec

This document defines the canonical mapping between LiveKit Agents concepts and the OpenOrca runtime types in `packages/core/src/runtime.ts` and `packages/core/src/clawData.ts`.

## Canonical Mapping

| OpenOrca entity | LiveKit source signal | Correlation identifier | Created when | Updated when | Removed or resolved when |
| --- | --- | --- | --- | --- | --- |
| `ClawAgent` | Worker registration, agent participant presence, agent session metadata | `agent.id = livekit participant identity or stable worker identity` | The bridge first observes an agent-capable participant or worker assigned to a session | Presence, status, current task, activity level, or agent metadata changes | Agent leaves the active session; bridge may keep it as `offline` until snapshot compaction |
| `AgentTask` | Session job, workflow run, or user-visible unit of work | `task.id = livekit job id or workflow step group id` | A new user-visible task starts for an agent or session | Progress, state, collaborator set, or approval status changes | Task reaches a terminal state such as completed or failed |
| `ActionEntry` | Tool call, workflow step activity, emitted status update, or notable agent trace event | `action.id = livekit event id or bridge-generated hash` | A user-visible action or tool activity is emitted | Rarely updated; append-only in most bridges | Never removed from the action log during an active session |
| `Intervention` | Approval gate, pending human decision, blocked external permission, or policy hold | `intervention.id = bridge-generated id mapped to livekit session + gate id` | The runtime enters a pending human decision state | Context, retry counters, or timestamps change while still pending | Operator resolves it, the runtime auto-cancels it, or the session ends |
| `Swarm` | Multi-agent session group, coordinated room, or workflow collaboration set | `swarm.id = livekit room name, session id, or orchestration group id` | More than one agent is coordinated toward a shared objective | Agent membership, lead agent, progress, or lifecycle status changes | Collaboration group disbands or session completes |
| `FleetHealth` | Aggregated bridge health derived from active jobs, agents, and pending interventions | synthetic singleton | Snapshot generation time | Counts or overall runtime health change | Recomputed every snapshot; not explicitly removed |

## Entity Notes

### `ClawAgent`

- Source: LiveKit worker or participant metadata plus current session assignment.
- Recommended fields:
  - `id`: participant identity or worker identity
  - `machineId`: worker host or deployment slot id
  - `machineName`: human-readable host label
  - `status`: mapped from connected, idle, processing, waiting for approval, or offline states
  - `currentTaskId`: current job or workflow id when present

### `AgentTask`

- Source: LiveKit job execution or one user-visible workflow unit.
- Prefer one OpenOrca task per operator-visible unit of work rather than one per low-level trace event.
- Use `waiting_approval` when the task is blocked on a human intervention.

### `ActionEntry`

- Source: streamed progress, tool activity, workflow transitions, and important runtime messages.
- The bridge should normalize low-level trace events into readable descriptions.
- `requiresApproval` should be `true` only for action entries that lead directly to a pending intervention.

### `Intervention`

- Source: approval or permission checkpoint emitted by the LiveKit-backed application logic.
- Store a durable mapping between `intervention.id` and the underlying LiveKit session, task, and decision gate identifiers.

### `Swarm`

- Source: collaboration metadata when multiple agents or participants are working on the same objective.
- Single-agent sessions may omit swarm records entirely.

### `FleetHealth`

- Source: bridge-side aggregation over all active sessions known to the deployment.
- `overallHealth` should degrade when event ingestion stalls, intervention queues back up, or worker connectivity drops.

## Example Snapshot

```json
{
  "meta": {
    "runtime": "livekit-agents",
    "generatedAt": "2026-03-19T12:00:00.000Z",
    "connectionStatus": "connected"
  },
  "agents": [
    {
      "id": "agent:planner-1",
      "name": "Planner",
      "machineId": "worker-us-east-1a",
      "machineName": "worker-us-east-1a",
      "status": "intervention_required",
      "domain": "automation",
      "integrations": ["browser", "files", "terminal"],
      "currentTaskId": "task:job-2381",
      "currentAction": "Waiting for operator approval before purchasing seats",
      "memoryUsage": 42,
      "uptime": "17m",
      "tasksCompleted": 3,
      "collaboratingWith": ["agent:research-2"],
      "interventionRequired": true,
      "interventionReason": "Approve vendor purchase?",
      "activityLevel": 58,
      "loadedCores": [],
      "knowledgeContributions": 0,
      "graphAccess": "read"
    }
  ],
  "tasks": [
    {
      "id": "task:job-2381",
      "agentId": "agent:planner-1",
      "agentName": "Planner",
      "domain": "automation",
      "title": "Prepare onboarding software order",
      "description": "Collect quotes and request approval before checkout.",
      "status": "waiting_approval",
      "priority": "high",
      "progress": 70,
      "startTime": "2026-03-19T11:47:00.000Z",
      "integrationsUsed": ["browser", "files"],
      "collaborators": ["agent:research-2"]
    }
  ],
  "actionLog": [
    {
      "id": "action:evt-551",
      "agentId": "agent:planner-1",
      "timestamp": "2026-03-19T11:58:00.000Z",
      "type": "api_call",
      "description": "Compared vendor pricing across three plans",
      "details": "LiveKit job step pricing.compare completed",
      "integration": "browser",
      "outcome": "success",
      "requiresApproval": false
    }
  ],
  "interventions": [
    {
      "id": "intr:job-2381:purchase",
      "agentId": "agent:planner-1",
      "agentName": "Planner",
      "type": "approval_needed",
      "question": "Approve purchase of 25 onboarding tool seats for $1,240/month?",
      "context": "The agent compared three vendors and recommends Plan B.",
      "options": ["approve", "deny", "later"],
      "timestamp": "2026-03-19T11:58:10.000Z",
      "priority": "high"
    }
  ],
  "swarms": [
    {
      "id": "swarm:room-onboarding-q2",
      "name": "Onboarding Procurement",
      "objective": "Research and approve software purchasing plan",
      "agents": ["agent:planner-1", "agent:research-2"],
      "leadAgentId": "agent:planner-1",
      "status": "active",
      "progress": 70,
      "tasksTotal": 2,
      "tasksCompleted": 1
    }
  ],
  "fleetHealth": {
    "totalAgents": 2,
    "activeAgents": 1,
    "offlineAgents": 0,
    "interventionsRequired": 1,
    "tasksInProgress": 1,
    "tasksCompletedToday": 6,
    "swarmsActive": 1,
    "overallHealth": "healthy"
  },
  "machines": []
}
```

## Example Streaming Events

### Task created

```json
{
  "type": "task.created",
  "task": {
    "id": "task:job-2381",
    "agentId": "agent:planner-1",
    "agentName": "Planner",
    "domain": "automation",
    "title": "Prepare onboarding software order",
    "description": "Collect quotes and request approval before checkout.",
    "status": "in_progress",
    "priority": "high",
    "progress": 10,
    "startTime": "2026-03-19T11:47:00.000Z",
    "integrationsUsed": ["browser"],
    "collaborators": []
  }
}
```

### Action logged

```json
{
  "type": "action.logged",
  "action": {
    "id": "action:evt-551",
    "agentId": "agent:planner-1",
    "timestamp": "2026-03-19T11:58:00.000Z",
    "type": "api_call",
    "description": "Compared vendor pricing across three plans",
    "integration": "browser",
    "outcome": "success",
    "requiresApproval": false
  }
}
```

### Intervention created

```json
{
  "type": "intervention.created",
  "intervention": {
    "id": "intr:job-2381:purchase",
    "agentId": "agent:planner-1",
    "agentName": "Planner",
    "type": "approval_needed",
    "question": "Approve purchase of 25 onboarding tool seats for $1,240/month?",
    "context": "Plan B has the best support and lowest setup cost.",
    "options": ["approve", "deny", "later"],
    "timestamp": "2026-03-19T11:58:10.000Z",
    "priority": "high"
  }
}
```

### Runtime status update

```json
{
  "type": "runtime.status",
  "status": "degraded",
  "message": "Bridge is reconnecting to one LiveKit worker stream."
}
```
