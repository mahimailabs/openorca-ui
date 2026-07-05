import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyOpenOrcaEvent,
  type OpenOrcaEvent,
  type OpenOrcaConnectionStatus,
  type OpenOrcaRuntimeInfo,
  type OpenOrcaSnapshot,
  type ResolveInterventionRequest,
} from "@openorca-ui/react/core/runtime";

export interface OpenOrcaRuntimeConfig {
  snapshotUrl: string;
  eventsUrl: string;
  resolveInterventionUrl: string;
  runtimeInfoUrl?: string;
}

interface UseOpenOrcaRuntimeResult {
  snapshot: OpenOrcaSnapshot | null;
  runtimeInfo: OpenOrcaRuntimeInfo | null;
  status: OpenOrcaConnectionStatus;
  error?: string;
  resolveIntervention: (request: ResolveInterventionRequest) => Promise<void>;
}

export function useOpenOrcaRuntime(
  config?: OpenOrcaRuntimeConfig,
): UseOpenOrcaRuntimeResult {
  const [snapshot, setSnapshot] = useState<OpenOrcaSnapshot | null>(null);
  const [runtimeInfo, setRuntimeInfo] = useState<OpenOrcaRuntimeInfo | null>(null);
  const [status, setStatus] = useState<OpenOrcaConnectionStatus>(
    config ? "loading" : "idle",
  );
  const [error, setError] = useState<string>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  // Flips true the first time the stream opens. Gates the failure status so
  // "error" is only shown before we have ever connected; after that a drop
  // degrades the badge instead (see the loadSnapshot catch and onerror below).
  const hasConnectedRef = useRef(false);

  const resolveIntervention = useCallback(
    async (request: ResolveInterventionRequest) => {
      if (!config) {
        throw new Error("Runtime config is required to resolve interventions.");
      }

      const response = await fetch(config.resolveInterventionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const message = (await response.text()) || "Failed to resolve intervention.";
        throw new Error(message);
      }
    },
    [config],
  );

  useEffect(() => {
    if (!config) {
      setStatus("idle");
      setSnapshot(null);
      setRuntimeInfo(null);
      setError(undefined);
      return;
    }

    let isMounted = true;
    attemptRef.current = 0;

    // Capped exponential backoff: 1000 * 2**attempt, ceiling at 5000ms.
    const backoffMs = () => Math.min(5000, 1000 * 2 ** attemptRef.current);

    const loadSnapshot = async (isInitial: boolean) => {
      // Only flip to "loading" on the first connect. Backoff reconnects keep
      // the current badge so a resync does not churn the connection state.
      if (isInitial) {
        setStatus("loading");
      }
      setError(undefined);

      try {
        const [snapshotResponse, runtimeInfoResponse] = await Promise.all([
          fetch(config.snapshotUrl),
          config.runtimeInfoUrl
            ? fetch(config.runtimeInfoUrl)
            : Promise.resolve(null),
        ]);

        if (!snapshotResponse.ok) {
          throw new Error((await snapshotResponse.text()) || "Failed to load runtime snapshot.");
        }

        const nextSnapshot = (await snapshotResponse.json()) as OpenOrcaSnapshot;
        if (!isMounted) {
          return;
        }

        setSnapshot(nextSnapshot);
        setStatus("connected");

        if (runtimeInfoResponse) {
          if (!runtimeInfoResponse.ok) {
            throw new Error((await runtimeInfoResponse.text()) || "Failed to load runtime info.");
          }
          const info = (await runtimeInfoResponse.json()) as OpenOrcaRuntimeInfo;
          if (isMounted) {
            setRuntimeInfo(info);
          }
        }
      } catch (runtimeError) {
        if (!isMounted) {
          return;
        }
        // "error" is sticky until the first successful connect; once we have
        // connected, a failed resync degrades the badge instead of hard
        // erroring so the retry loop does not oscillate.
        setStatus(hasConnectedRef.current ? "degraded" : "error");
        setError(
          runtimeError instanceof Error
            ? runtimeError.message
            : "Failed to initialize OpenOrca runtime.",
        );
      }
    };

    const connect = (isInitial: boolean) => {
      if (!isMounted) {
        return;
      }

      // Tear down any prior stream first, then resync, then open the new one.
      // Opening the EventSource only after the snapshot fetch settles keeps the
      // fetched snapshot in state before any live delta is applied, so no SSE
      // events are dropped during a resync. loadSnapshot catches its own errors
      // (never rejects), so .finally always opens the stream and the onerror
      // retry path still drives reconnects.
      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      void loadSnapshot(isInitial).finally(() => {
        if (!isMounted) {
          return;
        }

        const source = new EventSource(config.eventsUrl);
        eventSourceRef.current = source;

        source.onopen = () => {
          if (!isMounted) {
            return;
          }
          hasConnectedRef.current = true;
          attemptRef.current = 0;
          setStatus("connected");
        };

        source.onmessage = (message) => {
          if (!isMounted) {
            return;
          }

          try {
            const event = JSON.parse(message.data) as OpenOrcaEvent;
            setSnapshot((currentSnapshot) =>
              currentSnapshot
                ? applyOpenOrcaEvent(currentSnapshot, event)
                : event.type === "snapshot.replace"
                  ? event.snapshot
                  : currentSnapshot,
            );

            // runtime.status frames double as keepalives: refresh the badge
            // without any further state churn.
            if (event.type === "runtime.status") {
              setStatus(event.status);
            }
          } catch (parseError) {
            setStatus("degraded");
            setError(
              parseError instanceof Error
                ? parseError.message
                : "Failed to process runtime event.",
            );
          }
        };

        source.onerror = () => {
          if (!isMounted) {
            return;
          }

          // Same rule as the loadSnapshot catch: "error" before the first
          // connect, "degraded" afterwards so reconnect churn stays quiet.
          setStatus(hasConnectedRef.current ? "degraded" : "error");
          setError("Lost connection to the runtime event stream.");

          source.close();
          if (eventSourceRef.current === source) {
            eventSourceRef.current = null;
          }

          // Clear any pending retry so repeated onerror calls do not stack
          // timers, then schedule this reconnect with capped backoff.
          if (retryTimerRef.current !== null) {
            clearTimeout(retryTimerRef.current);
          }
          const delay = backoffMs();
          attemptRef.current += 1;
          retryTimerRef.current = setTimeout(() => connect(false), delay);
        };
      });
    };

    connect(true);

    return () => {
      isMounted = false;
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
    // config is read inside the effect, but re-subscribing only when a URL
    // actually changes avoids reconnect churn from unstable config identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config?.snapshotUrl,
    config?.eventsUrl,
    config?.resolveInterventionUrl,
    config?.runtimeInfoUrl,
  ]);

  return {
    snapshot,
    runtimeInfo,
    status,
    error,
    resolveIntervention,
  };
}
