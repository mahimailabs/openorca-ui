import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyOpenOrcaEvent,
  type OpenOrcaEvent,
  type OpenOrcaConnectionStatus,
  type OpenOrcaRuntimeInfo,
  type OpenOrcaSnapshot,
  type ResolveInterventionRequest,
} from "@openorca-ui/core/runtime";

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

  const stableConfig = useMemo(() => config, [config]);

  const resolveIntervention = useCallback(
    async (request: ResolveInterventionRequest) => {
      if (!stableConfig) {
        throw new Error("Runtime config is required to resolve interventions.");
      }

      const response = await fetch(stableConfig.resolveInterventionUrl, {
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
    [stableConfig],
  );

  useEffect(() => {
    if (!stableConfig) {
      setStatus("idle");
      setSnapshot(null);
      setRuntimeInfo(null);
      setError(undefined);
      return;
    }

    let isMounted = true;

    const loadSnapshot = async () => {
      setStatus("loading");
      setError(undefined);

      try {
        const [snapshotResponse, runtimeInfoResponse] = await Promise.all([
          fetch(stableConfig.snapshotUrl),
          stableConfig.runtimeInfoUrl
            ? fetch(stableConfig.runtimeInfoUrl)
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
        setStatus("error");
        setError(
          runtimeError instanceof Error
            ? runtimeError.message
            : "Failed to initialize OpenOrca runtime.",
        );
      }
    };

    void loadSnapshot();

    eventSourceRef.current?.close();
    const source = new EventSource(stableConfig.eventsUrl);
    eventSourceRef.current = source;

    source.onopen = () => {
      if (isMounted) {
        setStatus("connected");
      }
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

      setStatus((currentStatus) =>
        currentStatus === "loading" ? "error" : "degraded",
      );
      setError("Lost connection to the runtime event stream.");
    };

    return () => {
      isMounted = false;
      source.close();
      if (eventSourceRef.current === source) {
        eventSourceRef.current = null;
      }
    };
  }, [stableConfig]);

  return {
    snapshot,
    runtimeInfo,
    status,
    error,
    resolveIntervention,
  };
}
