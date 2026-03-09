import { useState, useMemo, useCallback, useEffect } from 'react';
import { AgentVisualization } from '@openorca-ui/react/components/AgentVisualization';
import { ActionTimeline } from '@openorca-ui/react/components/ActionTimeline';
import { AgentStream } from '@openorca-ui/react/components/AgentStream';
import { AgentInterventionPanel } from '@openorca-ui/react/components/AgentInterventionPanel';
import { AgentInspector } from '@openorca-ui/react/components/AgentInspector';
import { SwarmDashboard } from '@openorca-ui/react/components/SwarmDashboard';
import { FleetHealthPanel } from '@openorca-ui/react/components/FleetHealthPanel';
import { useOpenOrcaRuntime, type OpenOrcaRuntimeConfig } from '@openorca-ui/react';
import { SettingsPanel } from './SettingsPanel';
import { 
  generateClawData, 
  ClawOrchestratorData, 
  ClawAgent, 
  AgentTask,
} from '@openorca-ui/core/clawData';
import type { OpenOrcaConnectionStatus } from '@openorca-ui/core/runtime';
import { Button } from '@openorca-ui/react/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import { 
  Globe, Layers, AlertTriangle, Settings, Wifi, WifiOff, Zap,
  PanelLeft, PanelBottom, Bell, Users, Radio
} from 'lucide-react';

const initialData = generateClawData();

export interface OpenOrcaDashboardProps {
  mode?: 'demo' | 'runtime';
  runtimeConfig?: OpenOrcaRuntimeConfig;
}

function getRuntimeTone(status: OpenOrcaConnectionStatus) {
  if (status === 'connected') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (status === 'degraded') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  if (status === 'disconnected' || status === 'error') return 'text-red-400 border-red-500/30 bg-red-500/10';
  return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
}

export function OpenOrcaDashboard({
  mode = 'demo',
  runtimeConfig,
}: OpenOrcaDashboardProps) {
  const [demoData, setDemoData] = useState<ClawOrchestratorData>(initialData);
  const [selectedAgent, setSelectedAgent] = useState<ClawAgent | null>(null);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'interventions'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [streamMinimized, setStreamMinimized] = useState(false);
  const [interventionsHidden, setInterventionsHidden] = useState(false);
  const [swarmsCollapsed, setSwarmsCollapsed] = useState(false);

  const { snapshot, runtimeInfo, status: runtimeStatus, error: runtimeError, resolveIntervention } =
    useOpenOrcaRuntime(mode === 'runtime' ? runtimeConfig : undefined);

  const data = useMemo(
    () => (mode === 'runtime' && snapshot ? snapshot : demoData),
    [demoData, mode, snapshot],
  );
  const runtimeLabel = runtimeInfo?.runtime || snapshot?.meta.runtime || 'langgraph';

  useEffect(() => {
    if (!selectedAgent) {
      return;
    }

    const nextAgent = data.agents.find((agent) => agent.id === selectedAgent.id) || null;
    setSelectedAgent(nextAgent);

    if (nextAgent?.currentTaskId) {
      const nextTask = data.tasks.find((task) => task.id === nextAgent.currentTaskId) || null;
      setSelectedTask(nextTask);
    } else {
      setSelectedTask(null);
    }
  }, [data.agents, data.tasks, selectedAgent]);

  const activeCount = useMemo(() => 
    data.agents.filter(a => a.status === 'active').length, 
    [data.agents]
  );
  
  const interventionCount = useMemo(() => 
    data.agents.filter(a => a.interventionRequired).length, 
    [data.agents]
  );

  const offlineCount = useMemo(() => 
    data.agents.filter(a => a.status === 'offline').length, 
    [data.agents]
  );

  const handleAgentSelect = useCallback((agent: ClawAgent) => {
    setSelectedAgent(agent);
    const task = data.tasks.find(t => t.id === agent.currentTaskId);
    setSelectedTask(task || null);
  }, [data.tasks]);

  const handleTaskSelect = useCallback((task: AgentTask) => {
    setSelectedTask(task);
    const agent = data.agents.find(a => a.id === task.agentId);
    setSelectedAgent(agent || null);
  }, [data.agents]);

  const handleResolveIntervention = useCallback((interventionId: string, action: 'approve' | 'deny' | 'later') => {
    if (mode === 'runtime') {
      void resolveIntervention({
        interventionId,
        action,
        actor: {
          type: 'human',
          name: 'OpenOrca operator',
        },
      });
      return;
    }

    setDemoData(prev => {
      const intervention = prev.interventions.find((item) => item.id === interventionId);
      if (!intervention) {
        return prev;
      }

      return {
        ...prev,
        agents: prev.agents.map(a => 
          a.id === intervention.agentId
            ? { 
                ...a, 
                interventionRequired: false, 
                interventionReason: undefined,
                status: action === 'deny' ? 'idle' as const : 'active' as const,
              }
            : a
        ),
        interventions: prev.interventions.filter(i => i.id !== interventionId),
      };
    });
  }, [mode, resolveIntervention]);

  const handleWakeAgent = useCallback((agentId: string) => {
    if (mode === 'runtime') {
      return;
    }

    setDemoData(prev => ({
      ...prev,
      agents: prev.agents.map(a => 
        a.id === agentId 
          ? { ...a, status: 'active' as const, activityLevel: 60 }
          : a
      ),
    }));
  }, [mode]);

  const handlePauseAgent = useCallback((agentId: string) => {
    if (mode === 'runtime') {
      return;
    }

    setDemoData(prev => ({
      ...prev,
      agents: prev.agents.map(a => 
        a.id === agentId 
          ? { ...a, status: 'idle' as const, activityLevel: 0 }
          : a
      ),
    }));
  }, [mode]);

  const closeInspector = useCallback(() => {
    setSelectedAgent(null);
    setSelectedTask(null);
  }, []);

  const agentActions = useMemo(() => {
    if (!selectedAgent) return data.actionLog.slice(0, 20);
    return data.actionLog.filter(a => a.agentId === selectedAgent.id);
  }, [selectedAgent, data.actionLog]);

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden font-sans selection:bg-primary/20">
      
      <AgentVisualization
        agents={data.agents}
        swarms={data.swarms}
        onAgentClick={handleAgentSelect}
        selectedAgentId={selectedAgent?.id}
        filter={filter}
      />

      <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none flex justify-between items-start z-10 bg-transparent">
        <div className="pointer-events-auto flex items-start gap-6 bg-transparent">
          <div className="hud-panel p-4 w-80 hud-corner-tl">
            <div className="flex items-center gap-3 mb-2">
              <div className="status-indicator" />
              <span className="hud-text text-primary font-bold">openclaw fleet command</span>
            </div>
            <div className="h-px bg-white/5 w-full mb-3" />
            <h1 className="text-xl font-bold uppercase tracking-wider text-foreground flex items-center gap-3">
              <Layers className="h-5 w-5 text-primary" />
              Claw Orchestrator <span className="text-white/20">V.02</span>
            </h1>
            <p className="hud-text mt-1">
              Fleet: <span className="text-secondary">{data.agents.length} Agents</span> // 
              Machines: <span className="text-primary">{data.machines.length}</span>
            </p>
            {mode === 'runtime' && (
              <div className={`mt-3 inline-flex items-center gap-2 rounded border px-2 py-1 text-[10px] uppercase tracking-widest ${getRuntimeTone(runtimeStatus)}`}>
                <Radio className="h-3 w-3" />
                <span>
                  {runtimeLabel} / {runtimeStatus}
                </span>
              </div>
            )}
            {mode === 'runtime' && runtimeError && (
              <p className="mt-2 text-[11px] text-amber-300">{runtimeError}</p>
            )}
          </div>
          
          <div className="hud-panel p-3 flex gap-6 items-center">
            <div className="text-center px-2">
              <span className="block text-xl font-mono text-emerald-500">{activeCount}</span>
              <span className="hud-text text-emerald-500/70 flex items-center gap-1">
                <Zap className="w-2 h-2" /> Active
              </span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="text-center px-2">
              <span className={`block text-xl font-mono ${interventionCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {interventionCount}
              </span>
              <span className={`hud-text flex items-center gap-1 ${interventionCount > 0 ? 'text-amber-500/70' : ''}`}>
                <AlertTriangle className="w-2 h-2" /> Waiting
              </span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="text-center px-2">
              <span className={`block text-xl font-mono ${offlineCount > 0 ? 'text-gray-500' : 'text-muted-foreground'}`}>
                {offlineCount}
              </span>
              <span className="hud-text flex items-center gap-1">
                <WifiOff className="w-2 h-2" /> Offline
              </span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3 items-center">
          <div className="flex gap-1">
            {(['all', 'active', 'interventions'] as const).map((f) => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(f)}
                className={`text-[10px] uppercase h-7 px-3 ${
                  filter === f 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`filter-${f}`}
              >
                {f === 'all' && <Globe className="w-3 h-3 mr-1" />}
                {f === 'active' && <Wifi className="w-3 h-3 mr-1" />}
                {f === 'interventions' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {f}
              </Button>
            ))}
          </div>
          
          <div className="w-px h-6 bg-white/10" />
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimelineCollapsed(!timelineCollapsed)}
              className={`h-8 w-8 p-0 ${timelineCollapsed ? 'text-muted-foreground' : 'text-primary'}`}
              title="Toggle Action Log"
              data-testid="toggle-timeline-btn"
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStreamMinimized(!streamMinimized)}
              className={`h-8 w-8 p-0 ${streamMinimized ? 'text-muted-foreground' : 'text-primary'}`}
              title="Toggle Agent Stream"
              data-testid="toggle-stream-btn"
            >
              <PanelBottom className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInterventionsHidden(!interventionsHidden)}
              className={`h-8 w-8 p-0 relative ${interventionsHidden ? 'text-muted-foreground' : 'text-primary'}`}
              title="Toggle Interventions"
              data-testid="toggle-interventions-btn"
            >
              <Bell className="w-4 h-4" />
              {interventionsHidden && data.interventions.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full text-[8px] flex items-center justify-center text-black font-bold">
                  {data.interventions.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSwarmsCollapsed(!swarmsCollapsed)}
              className={`h-8 w-8 p-0 relative ${swarmsCollapsed ? 'text-muted-foreground' : 'text-primary'}`}
              title="Toggle Swarms"
              data-testid="toggle-swarms-btn"
            >
              <Users className="w-4 h-4" />
              {swarmsCollapsed && data.swarms.filter(s => s.status === 'active' || s.status === 'forming').length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-600 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
                  {data.swarms.filter(s => s.status === 'active' || s.status === 'forming').length}
                </span>
              )}
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="h-9 w-9 p-0"
            data-testid="open-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-white/10 rounded-full" />
        
        <div className="absolute top-12 left-12 w-4 h-4 border-t border-l border-white/20" />
        <div className="absolute top-12 right-12 w-4 h-4 border-t border-r border-white/20" />
        <div className="absolute bottom-12 left-12 w-4 h-4 border-b border-l border-white/20" />
        <div className="absolute bottom-12 right-12 w-4 h-4 border-b border-r border-white/20" />
      </div>

      <ActionTimeline
        actions={agentActions}
        selectedAgentId={selectedAgent?.id || null}
        agents={data.agents}
        onAgentSelect={handleAgentSelect}
        isCollapsed={timelineCollapsed}
        onToggleCollapse={() => setTimelineCollapsed(!timelineCollapsed)}
      />

      <AgentInterventionPanel
        agents={data.agents}
        interventions={data.interventions}
        onResolve={handleResolveIntervention}
        onAgentSelect={handleAgentSelect}
        isHidden={interventionsHidden}
        onToggleHidden={() => setInterventionsHidden(!interventionsHidden)}
      />

      {(interventionsHidden || data.interventions.length === 0) && (
        <div className="absolute bottom-8 right-6 z-10 pointer-events-auto space-y-4">
          <FleetHealthPanel 
            fleetHealth={data.fleetHealth}
            machines={data.machines}
          />
        </div>
      )}

      <div className="absolute bottom-44 left-6 z-10 pointer-events-none">
        <SwarmDashboard 
          swarms={data.swarms}
          agents={data.agents}
          isCollapsed={swarmsCollapsed || !timelineCollapsed}
          onToggleCollapse={() => {
            if (!timelineCollapsed) {
              setTimelineCollapsed(true);
              setSwarmsCollapsed(false);
            } else {
              setSwarmsCollapsed(!swarmsCollapsed);
            }
          }}
        />
      </div>

      <AgentStream
        agents={data.agents}
        tasks={data.tasks}
        onAgentSelect={handleAgentSelect}
        onWakeAgent={handleWakeAgent}
        onPauseAgent={handlePauseAgent}
        selectedAgentId={selectedAgent?.id}
        isMinimized={streamMinimized}
        onToggleMinimize={() => setStreamMinimized(!streamMinimized)}
      />

      <AnimatePresence>
        {selectedAgent && (
          <AgentInspector
            agent={selectedAgent}
            task={selectedTask}
            actions={agentActions}
            onClose={closeInspector}
            onWakeAgent={handleWakeAgent}
            onPauseAgent={handlePauseAgent}
          />
        )}
      </AnimatePresence>

      <SettingsPanel 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </div>
  );
}
