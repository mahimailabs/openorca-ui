import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenOrcaSnapshot } from "@openorca-ui/react/core/runtime";
import { useOpenOrcaRuntime } from "../useOpenOrcaRuntime";

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  emitMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent<string>);
  }

  emitRawMessage(data: string) {
    this.onmessage?.({ data } as MessageEvent<string>);
  }

  emitError() {
    this.onerror?.();
  }

  static latest() {
    const instance = MockEventSource.instances.at(-1);
    if (!instance) {
      throw new Error("Expected an EventSource instance to exist.");
    }
    return instance;
  }

  static reset() {
    MockEventSource.instances = [];
  }
}

const snapshot: OpenOrcaSnapshot = {
  meta: {
    runtime: "livekit-agents",
    generatedAt: "2026-03-19T12:00:00.000Z",
    connectionStatus: "connected",
  },
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

const runtimeInfo = {
  runtime: "livekit-agents",
  language: "typescript",
  supports: {
    sse: true,
    interventions: true,
    snapshots: true,
  },
};

function createConfig() {
  return {
    snapshotUrl: "http://localhost:8000/openorca/snapshot",
    eventsUrl: "http://localhost:8000/openorca/events",
    resolveInterventionUrl: "http://localhost:8000/openorca/resolve",
    runtimeInfoUrl: "http://localhost:8000/openorca/runtime",
  };
}

describe("useOpenOrcaRuntime", () => {
  beforeEach(() => {
    MockEventSource.reset();
    vi.restoreAllMocks();
    vi.stubGlobal("EventSource", MockEventSource);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (init?.method === "POST" || url.endsWith("/resolve")) {
          return new Response(null, { status: 204 });
        }
        if (url.endsWith("/snapshot")) {
          return new Response(JSON.stringify(snapshot), { status: 200 });
        }
        if (url.endsWith("/runtime")) {
          return new Response(JSON.stringify(runtimeInfo), { status: 200 });
        }
        throw new Error(`Unexpected fetch to ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the snapshot and runtime info, then applies SSE updates", async () => {
    const config = createConfig();
    const { result } = renderHook(() => useOpenOrcaRuntime(config));

    await waitFor(() => {
      expect(result.current.snapshot?.meta.runtime).toBe("livekit-agents");
    });

    expect(result.current.runtimeInfo?.runtime).toBe("livekit-agents");
    expect(result.current.status).toBe("connected");

    // The stream is opened a microtask after the snapshot fetch settles, so
    // wait for the EventSource instance before firing events on it.
    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    await act(async () => {
      MockEventSource.latest().emitMessage({
        type: "runtime.status",
        status: "degraded",
        message: "reconnecting",
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe("degraded");
      expect(result.current.snapshot?.meta.connectionStatus).toBe("degraded");
    });
  });

  it("posts intervention decisions to the configured backend", async () => {
    const fetchSpy = vi.mocked(fetch);
    const config = createConfig();
    const { result } = renderHook(() => useOpenOrcaRuntime(config));

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    await act(async () => {
      await result.current.resolveIntervention({
        interventionId: "intervention-1",
        action: "approve",
        actor: { type: "human", name: "Operator" },
      });
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8000/openorca/resolve",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces stream errors and malformed event payloads", async () => {
    const config = createConfig();
    const { result } = renderHook(() => useOpenOrcaRuntime(config));

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    // The stream is opened a microtask after the snapshot fetch settles, so
    // wait for the EventSource instance before firing events on it.
    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    await act(async () => {
      MockEventSource.latest().emitRawMessage("not-json");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("degraded");
      expect(result.current.error).toBeDefined();
    });

    await act(async () => {
      MockEventSource.latest().emitError();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Lost connection to the runtime event stream.",
      );
    });
  });
});
