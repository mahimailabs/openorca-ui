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

  emitOpen() {
    this.onopen?.();
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
    for (let i = 0; i < 12; i += 1) {
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
    const { result } = renderHook(() => useOpenOrcaRuntime(config));

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

    // The resync fetch repopulates snapshot state; opening the reconnected
    // stream marks the badge connected and the snapshot reflects the runtime.
    act(() => {
      MockEventSource.latest().emitOpen();
    });
    expect(result.current.status).toBe("connected");
    expect(result.current.snapshot).not.toBeNull();
    expect(result.current.snapshot?.meta.runtime).toBe("voicegateway");
  });

  it("resets the backoff to 1000ms after a successful reconnect", async () => {
    const fetchSpy = vi.mocked(fetch);
    const config = createConfig();
    renderHook(() => useOpenOrcaRuntime(config));

    await flushMicrotasks();
    expect(MockEventSource.instances.length).toBe(1);

    // First drop schedules a 1000ms backoff reconnect.
    act(() => {
      MockEventSource.latest().emitError();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await flushMicrotasks();
    expect(MockEventSource.instances.length).toBe(2);

    // The reconnected stream opens successfully, resetting the attempt counter.
    act(() => {
      MockEventSource.latest().emitOpen();
    });

    const fetchesBeforeSecondDrop = fetchSpy.mock.calls.length;

    // Second drop. Because the counter reset, the next backoff is 1000ms again
    // (not 2000ms as it would be without the reset).
    act(() => {
      MockEventSource.latest().emitError();
    });

    // At 900ms the reconnect has not fired yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(MockEventSource.instances.length).toBe(2);
    expect(fetchSpy.mock.calls.length).toBe(fetchesBeforeSecondDrop);

    // Crossing 1000ms total fires it, proving the backoff reset to 1000ms.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    await flushMicrotasks();
    expect(MockEventSource.instances.length).toBe(3);
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(fetchesBeforeSecondDrop);
  });

  it("cancels a pending retry timer on unmount", async () => {
    const fetchSpy = vi.mocked(fetch);
    const config = createConfig();
    const { unmount } = renderHook(() => useOpenOrcaRuntime(config));

    await flushMicrotasks();
    const fetchesAfterConnect = fetchSpy.mock.calls.length;
    expect(MockEventSource.instances.length).toBe(1);

    // A drop schedules a backoff reconnect.
    act(() => {
      MockEventSource.latest().emitError();
    });

    // Unmounting must clear the pending retry timer.
    unmount();

    // Advancing well past the backoff window does nothing: no extra snapshot
    // fetch and no new EventSource are created.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    await flushMicrotasks();
    expect(fetchSpy.mock.calls.length).toBe(fetchesAfterConnect);
    expect(MockEventSource.instances.length).toBe(1);
  });
});
