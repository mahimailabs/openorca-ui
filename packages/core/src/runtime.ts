import type {
  ActionEntry,
  AgentTask,
  ClawAgent,
  ClawOrchestratorData,
  FleetHealth,
  Intervention,
  Machine,
  Swarm,
} from "./clawData";

export type OpenOrcaConnectionStatus =
  | "idle"
  | "loading"
  | "connected"
  | "degraded"
  | "disconnected"
  | "error";

export interface OpenOrcaSnapshot extends ClawOrchestratorData {
  meta: {
    runtime: "langgraph" | string;
    runtimeVersion?: string;
    generatedAt: string;
    connectionStatus: Exclude<OpenOrcaConnectionStatus, "idle" | "loading" | "error">;
  };
}

export type OpenOrcaEvent =
  | { type: "snapshot.replace"; snapshot: OpenOrcaSnapshot }
  | { type: "agent.updated"; agent: ClawAgent }
  | { type: "task.updated"; task: AgentTask }
  | { type: "task.created"; task: AgentTask }
  | { type: "action.logged"; action: ActionEntry }
  | { type: "intervention.created"; intervention: Intervention }
  | {
      type: "intervention.resolved";
      interventionId: string;
      resolution: "approve" | "deny" | "later";
    }
  | { type: "swarm.updated"; swarm: Swarm }
  | { type: "fleet.updated"; fleetHealth: FleetHealth }
  | {
      type: "runtime.status";
      status: Exclude<OpenOrcaConnectionStatus, "idle" | "loading" | "error">;
      message?: string;
    };

export interface ResolveInterventionRequest {
  interventionId: string;
  action: "approve" | "deny" | "later";
  actor?: {
    type: "human";
    id?: string;
    name?: string;
  };
}

export interface OpenOrcaRuntimeInfo {
  runtime: "langgraph" | string;
  language: "python" | "javascript" | "typescript" | string;
  supports: {
    sse: boolean;
    interventions: boolean;
    snapshots: boolean;
  };
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) {
    return [item, ...items];
  }

  return items.map((existing, currentIndex) =>
    currentIndex === index ? item : existing,
  );
}

function updateAgentInterventionState(
  agents: ClawAgent[],
  interventions: Intervention[],
) {
  const interventionAgentIds = new Set(interventions.map((intervention) => intervention.agentId));

  return agents.map((agent) => {
    const intervention = interventions.find((item) => item.agentId === agent.id);

    return {
      ...agent,
      interventionRequired: interventionAgentIds.has(agent.id),
      interventionReason: intervention?.question,
      status:
        interventionAgentIds.has(agent.id) && agent.status !== "offline"
          ? ("intervention_required" as const)
          : agent.status,
    };
  });
}

export function applyOpenOrcaEvent(
  snapshot: OpenOrcaSnapshot,
  event: OpenOrcaEvent,
): OpenOrcaSnapshot {
  switch (event.type) {
    case "snapshot.replace":
      return event.snapshot;
    case "agent.updated":
      return {
        ...snapshot,
        agents: upsertById(snapshot.agents, event.agent),
      };
    case "task.updated":
    case "task.created":
      return {
        ...snapshot,
        tasks: upsertById(snapshot.tasks, event.task),
      };
    case "action.logged":
      return {
        ...snapshot,
        actionLog: [event.action, ...snapshot.actionLog],
      };
    case "intervention.created": {
      const interventions = upsertById(snapshot.interventions, event.intervention);
      return {
        ...snapshot,
        interventions,
        agents: updateAgentInterventionState(snapshot.agents, interventions),
      };
    }
    case "intervention.resolved": {
      const interventions = snapshot.interventions.filter(
        (intervention) => intervention.id !== event.interventionId,
      );
      return {
        ...snapshot,
        interventions,
        agents: updateAgentInterventionState(snapshot.agents, interventions),
      };
    }
    case "swarm.updated":
      return {
        ...snapshot,
        swarms: upsertById(snapshot.swarms, event.swarm),
      };
    case "fleet.updated":
      return {
        ...snapshot,
        fleetHealth: event.fleetHealth,
      };
    case "runtime.status":
      return {
        ...snapshot,
        meta: {
          ...snapshot.meta,
          connectionStatus: event.status,
        },
      };
    default:
      return snapshot;
  }
}

export function createRuntimeSnapshot(
  data: ClawOrchestratorData,
  overrides?: Partial<OpenOrcaSnapshot["meta"]>,
): OpenOrcaSnapshot {
  return {
    ...data,
    meta: {
      runtime: "langgraph",
      generatedAt: new Date().toISOString(),
      connectionStatus: "connected",
      ...overrides,
    },
  };
}

export type OpenOrcaRuntimeSnapshot = OpenOrcaSnapshot;
export type OpenOrcaMachine = Machine;
