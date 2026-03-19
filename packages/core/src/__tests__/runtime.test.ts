import { describe, expect, it } from "vitest";
import type { ClawOrchestratorData } from "../clawData";
import { applyOpenOrcaEvent, createRuntimeSnapshot } from "../runtime";

function createData(): ClawOrchestratorData {
  return {
    agents: [
      {
        id: "agent-1",
        name: "Agent One",
        machineId: "machine-1",
        machineName: "Machine One",
        status: "active",
        domain: "automation",
        integrations: ["terminal"],
        currentTaskId: "task-1",
        currentAction: "Working",
        memoryUsage: 10,
        uptime: "1h",
        tasksCompleted: 1,
        collaboratingWith: [],
        interventionRequired: false,
        activityLevel: 50,
        loadedCores: [],
        knowledgeContributions: 0,
        graphAccess: "read",
      },
    ],
    tasks: [
      {
        id: "task-1",
        agentId: "agent-1",
        agentName: "Agent One",
        domain: "automation",
        title: "Task One",
        description: "Do work",
        status: "in_progress",
        priority: "medium",
        progress: 25,
        startTime: "2026-03-19T12:00:00.000Z",
        integrationsUsed: ["terminal"],
        collaborators: [],
      },
    ],
    actionLog: [],
    swarms: [],
    fleetHealth: {
      totalAgents: 1,
      activeAgents: 1,
      offlineAgents: 0,
      interventionsRequired: 0,
      tasksInProgress: 1,
      tasksCompletedToday: 1,
      swarmsActive: 0,
      overallHealth: "healthy",
    },
    interventions: [],
    machines: [],
  };
}

describe("createRuntimeSnapshot", () => {
  it('uses the neutral runtime default of "runtime"', () => {
    const snapshot = createRuntimeSnapshot(createData());

    expect(snapshot.meta.runtime).toBe("runtime");
    expect(snapshot.meta.connectionStatus).toBe("connected");
    expect(snapshot.meta.generatedAt).toMatch(/T/);
  });

  it("allows callers to override runtime metadata", () => {
    const snapshot = createRuntimeSnapshot(createData(), {
      runtime: "livekit-agents",
      connectionStatus: "degraded",
    });

    expect(snapshot.meta.runtime).toBe("livekit-agents");
    expect(snapshot.meta.connectionStatus).toBe("degraded");
  });
});

describe("applyOpenOrcaEvent", () => {
  it("applies task and action updates", () => {
    const snapshot = createRuntimeSnapshot(createData(), {
      runtime: "livekit-agents",
    });

    const withTask = applyOpenOrcaEvent(snapshot, {
      type: "task.created",
      task: {
        id: "task-2",
        agentId: "agent-1",
        agentName: "Agent One",
        domain: "automation",
        title: "Task Two",
        description: "More work",
        status: "pending",
        priority: "high",
        progress: 0,
        startTime: "2026-03-19T12:01:00.000Z",
        integrationsUsed: ["terminal"],
        collaborators: [],
      },
    });

    const withAction = applyOpenOrcaEvent(withTask, {
      type: "action.logged",
      action: {
        id: "action-1",
        agentId: "agent-1",
        timestamp: "2026-03-19T12:02:00.000Z",
        type: "command_run",
        description: "Ran command",
        integration: "terminal",
        outcome: "success",
        requiresApproval: false,
      },
    });

    expect(withTask.tasks[0]?.id).toBe("task-2");
    expect(withAction.actionLog[0]?.id).toBe("action-1");
  });

  it("marks agent intervention state when interventions are created and resolved", () => {
    const snapshot = createRuntimeSnapshot(createData());

    const withIntervention = applyOpenOrcaEvent(snapshot, {
      type: "intervention.created",
      intervention: {
        id: "intervention-1",
        agentId: "agent-1",
        agentName: "Agent One",
        type: "approval_needed",
        question: "Approve?",
        context: "Need approval",
        timestamp: "2026-03-19T12:03:00.000Z",
        priority: "high",
      },
    });

    expect(withIntervention.interventions).toHaveLength(1);
    expect(withIntervention.agents[0]?.interventionRequired).toBe(true);
    expect(withIntervention.agents[0]?.status).toBe("intervention_required");

    const resolved = applyOpenOrcaEvent(withIntervention, {
      type: "intervention.resolved",
      interventionId: "intervention-1",
      resolution: "approve",
    });

    expect(resolved.interventions).toHaveLength(0);
    expect(resolved.agents[0]?.interventionRequired).toBe(false);
    expect(resolved.agents[0]?.status).toBe("intervention_required");
  });

  it("updates runtime connection state from runtime status events", () => {
    const snapshot = createRuntimeSnapshot(createData());

    const next = applyOpenOrcaEvent(snapshot, {
      type: "runtime.status",
      status: "degraded",
      message: "stream reconnecting",
    });

    expect(next.meta.connectionStatus).toBe("degraded");
  });
});
