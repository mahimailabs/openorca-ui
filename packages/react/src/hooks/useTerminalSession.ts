import { useState, useCallback, useRef, useEffect } from 'react';

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'streaming';
  content: string;
  timestamp: Date;
}

export interface LoopContext {
  loopId: string;
  loopName: string;
  mode?: string;
  goal?: string;
  status?: string;
  iterationCount?: number;
  interventionReason?: string;
  // Agent-specific fields
  domain?: string;
  integrations?: string[];
  currentTask?: string;
  taskProgress?: number;
  machineName?: string;
  activityLevel?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseTerminalSessionOptions {
  loopId?: string;
  loopName?: string;
  loopContext?: LoopContext;
  onCommand?: (command: string) => Promise<string | void>;
  initialLines?: TerminalLine[];
}

const API_KEY_STORAGE_KEY = 'loom_anthropic_api_key';

function buildDemoResponse(command: string, loopContext?: LoopContext, loopName?: string) {
  const lower = command.toLowerCase();

  if (lower.includes("fix") || lower.includes("debug")) {
    return `Demo mode: I would inspect the failing area around ${loopContext?.currentTask || "the active task"}, review recent changes, and propose a small patch before rerunning checks.`;
  }

  if (lower.includes("summary") || lower.includes("summarize")) {
    return `Demo mode summary for ${loopName || loopContext?.loopName || "this agent"}: status is ${loopContext?.status || "unknown"}, current task is ${loopContext?.currentTask || "not set"}, and activity is ${loopContext?.activityLevel ?? "n/a"}%.`;
  }

  if (lower.includes("next")) {
    return `Suggested next actions:
1. Inspect the current task context
2. Resolve any intervention blockers
3. Continue the highest-priority workflow`;
  }

  return `Demo mode: OpenOrca is running frontend-only, so terminal chat is simulated. I can still reflect the current agent context and demonstrate the UI flow for "${command}".`;
}

export function useTerminalSession(options: UseTerminalSessionOptions = {}) {
  const { loopId, loopName, loopContext, onCommand, initialLines = [] } = options;
  
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!localStorage.getItem(API_KEY_STORAGE_KEY));
  const lineIdCounter = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const checkApiKey = () => {
      setHasApiKey(!!localStorage.getItem(API_KEY_STORAGE_KEY));
    };
    
    window.addEventListener('storage', checkApiKey);
    const interval = setInterval(checkApiKey, 1000);
    
    return () => {
      window.removeEventListener('storage', checkApiKey);
      clearInterval(interval);
    };
  }, []);

  const generateLineId = useCallback(() => {
    lineIdCounter.current += 1;
    return `line-${loopId || 'global'}-${lineIdCounter.current}-${Date.now()}`;
  }, [loopId]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: generateLineId(),
      type,
      content,
      timestamp: new Date(),
    };
    setLines(prev => [...prev, newLine]);
    return newLine;
  }, [generateLineId]);

  const updateStreamingLine = useCallback((lineId: string, content: string) => {
    setLines(prev => prev.map(line => 
      line.id === lineId ? { ...line, content } : line
    ));
  }, []);

  const finalizeStreamingLine = useCallback((lineId: string) => {
    setLines(prev => prev.map(line => 
      line.id === lineId ? { ...line, type: 'output' as const } : line
    ));
  }, []);

  const getApiKey = useCallback((): string | null => {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }, []);

  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim() || isProcessing) return;

    const trimmedCommand = command.trim();
    
    setCommandHistory(prev => [...prev.filter(c => c !== trimmedCommand), trimmedCommand]);
    setHistoryIndex(-1);
    
    addLine('input', trimmedCommand);

    if (trimmedCommand.toLowerCase() === 'clear') {
      setLines([]);
      messagesRef.current = [];
      return;
    }

    if (trimmedCommand.toLowerCase() === 'help') {
      addLine('system', `OpenOrca Agent Terminal

Commands:
  help     - Show this help message
  clear    - Clear terminal history
  status   - Show agent status and current task
  context  - Display full agent context
  
Or type any message to chat with Claude about this agent.

${!getApiKey() ? '⚠️  No API key configured. Go to Settings to add your Anthropic API key.' : '✓ API key configured - Ready to chat'}`);
      return;
    }

    if (trimmedCommand.toLowerCase() === 'status') {
      const statusLines = [
        `Agent: ${loopName || loopId || 'unknown'}`,
        `Status: ${loopContext?.status || 'unknown'}`,
      ];
      if (loopContext?.domain) statusLines.push(`Domain: ${loopContext.domain}`);
      if (loopContext?.currentTask) {
        statusLines.push(`Task: ${loopContext.currentTask}`);
        if (loopContext?.taskProgress !== undefined) {
          statusLines.push(`Progress: ${loopContext.taskProgress}%`);
        }
      }
      if (loopContext?.activityLevel !== undefined) {
        statusLines.push(`Activity: ${loopContext.activityLevel}%`);
      }
      if (loopContext?.mode) statusLines.push(`Mode: ${loopContext.mode}`);
      if (loopContext?.iterationCount) statusLines.push(`Iterations: ${loopContext.iterationCount}`);
      addLine('system', statusLines.join('\n'));
      return;
    }

    if (trimmedCommand.toLowerCase() === 'context') {
      const contextLines = [
        'Agent Context:',
        `  ID: ${loopId || 'N/A'}`,
        `  Name: ${loopName || 'N/A'}`,
      ];
      if (loopContext?.machineName) contextLines.push(`  Machine: ${loopContext.machineName}`);
      if (loopContext?.domain) contextLines.push(`  Domain: ${loopContext.domain}`);
      if (loopContext?.integrations?.length) {
        contextLines.push(`  Integrations: ${loopContext.integrations.join(', ')}`);
      }
      contextLines.push(`  Status: ${loopContext?.status || 'N/A'}`);
      if (loopContext?.currentTask) {
        contextLines.push(`  Current Task: ${loopContext.currentTask}`);
        if (loopContext?.taskProgress !== undefined) {
          contextLines.push(`  Task Progress: ${loopContext.taskProgress}%`);
        }
      }
      if (loopContext?.mode) contextLines.push(`  Mode: ${loopContext.mode}`);
      if (loopContext?.goal) contextLines.push(`  Goal: ${loopContext.goal}`);
      if (loopContext?.iterationCount) contextLines.push(`  Iterations: ${loopContext.iterationCount}`);
      if (loopContext?.interventionReason) {
        contextLines.push(`  Intervention: ${loopContext.interventionReason}`);
      }
      addLine('system', contextLines.join('\n'));
      return;
    }

    if (onCommand) {
      setIsProcessing(true);
      try {
        const response = await onCommand(trimmedCommand);
        if (response) {
          addLine('output', response);
        }
      } catch (error) {
        addLine('error', error instanceof Error ? error.message : 'Command failed');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!getApiKey()) {
      addLine('error', 'No API key configured. Open Settings (gear icon in top bar) to add your Anthropic API key.');
      return;
    }

    setIsProcessing(true);
    
    messagesRef.current.push({ role: 'user', content: trimmedCommand });
    
    const streamingLine = addLine('streaming', '');
    const streamedContent = buildDemoResponse(trimmedCommand, loopContext, loopName);

    try {
      abortControllerRef.current = new AbortController();
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      updateStreamingLine(streamingLine.id, streamedContent);
      finalizeStreamingLine(streamingLine.id);
      messagesRef.current.push({ role: 'assistant', content: streamedContent });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        updateStreamingLine(streamingLine.id, `${streamedContent}\n[Cancelled]`);
        finalizeStreamingLine(streamingLine.id);
      } else {
        setLines(prev => prev.filter(l => l.id !== streamingLine.id));
        addLine('error', error.message || 'Failed to get response');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [loopId, loopName, loopContext, onCommand, isProcessing, addLine, updateStreamingLine, finalizeStreamingLine, getApiKey]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return '';

    let newIndex: number;
    if (direction === 'up') {
      newIndex = historyIndex === -1 
        ? commandHistory.length - 1 
        : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 
        ? -1 
        : Math.min(commandHistory.length - 1, historyIndex + 1);
    }

    setHistoryIndex(newIndex);
    return newIndex === -1 ? '' : commandHistory[newIndex];
  }, [commandHistory, historyIndex]);

  const clearTerminal = useCallback(() => {
    setLines([]);
    messagesRef.current = [];
  }, []);

  const addSystemMessage = useCallback((message: string) => {
    addLine('system', message);
  }, [addLine]);

  return {
    lines,
    isProcessing,
    commandHistory,
    executeCommand,
    cancelRequest,
    navigateHistory,
    clearTerminal,
    addSystemMessage,
    addLine,
    hasApiKey,
  };
}
