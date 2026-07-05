import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenOrcaSnapshot } from "@openorca-ui/core/runtime";
import { useOpenOrcaRuntime } from "../useOpenOrcaRuntime";

// Same MockEventSource harness shape as useOpenOrcaRuntime.test.tsx so the two
// suites stay consistent. It records every instance and lets a test fire
// open/message/error on the latest one.
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
    runtime: "voicegateway",
    generatedAt: "2026-07-04T00:00:00.000Z",
    connectionStatus: "connected",
  },
  agents: [],
  tasks: [],
  actionLog: [],
  swarms: [],
  fleetHealth: {
    totalAgents: 0,
    activeAgents: 0,
    offlineAgents: 0,
    interventionsRequired: 0,
    tasksInProgress: 0,
    tasksCompletedToday: 0,
    swarmsActive: 0,
    overallHealth: "healthy",
  },
  interventions: [],
  machines: [],
};

function createConfig() {
  return {
    snapshotUrl: "http://localhost:8000/openorca/snapshot",
    eventsUrl: "http://localhost:8000/openorca/events",
    resolveInterventionUrl: "http://localhost:8000/openorca/interventions/resolve",
  };
}

// Drain the microtask queue (fetch/json promises) inside act so React state
// updates settle. Fake timers do not touch microtasks, so a plain await loop
// is the reliable way to flush the async snapshot load.
async function flushMicrotasks() {
  await act(async () => {
    for (let i = 0; i < 6; i += 1) {
      await Promise.resolve();
    }
  });
}

describe("useOpenOrcaRuntime reconnect", () => {
  beforeEach(() => {
    MockEventSource.reset();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal("EventSource", MockEventSource);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          ok: true,
          json: async () => snapshot,
          text: async () => "",
        };
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reconnects after a stream error and re-fetches the snapshot to resync", async () => {
    const fetchSpy = vi.mocked(fetch);
    const config = createConfig();
    renderHook(() => useOpenOrcaRuntime(config));

    // Initial connect: one snapshot fetch and one EventSource.
    await flushMicrotasks();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(MockEventSource.instances.length).toBe(1);

    // The stream drops. onerror schedules a backoff reconnect (first delay 1000ms).
    act(() => {
      MockEventSource.latest().emitError();
    });

    // Before the backoff window elapses, no reconnect has fired yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(MockEventSource.instances.length).toBe(1);

    // Crossing the backoff delay triggers connect() again: a fresh EventSource
    // plus a fresh snapshot fetch (state resync).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    await flushMicrotasks();
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(1);
    expect(MockEventSource.instances.length).toBeGreaterThan(1);
  });
});
