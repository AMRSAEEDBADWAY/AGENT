import { Handle, Position } from '@xyflow/react';
import { Bot, Link2, Brain, Zap, Wrench, Boxes } from 'lucide-react';

// Maps node type to styling and icon
const typeConfig: Record<string, any> = {
  agent: {
    color: '#1AFFA2', // Neon Teal
    icon: <Bot size={18} className="text-[#020B18]" />,
    label: 'AI Agent'
  },
  integration: {
    color: '#22D3EE', // Cyan
    icon: <Link2 size={18} className="text-[#020B18]" />,
    label: 'Integration'
  },
  mcp: {
    color: '#FBBF24', // Amber
    icon: <Boxes size={18} className="text-[#020B18]" />,
    label: 'MCP Server'
  },
  control: {
    color: '#F87171', // Red
    icon: <Zap size={18} className="text-[#020B18]" />,
    label: 'Control'
  },
  ml: {
    color: '#38BDF8', // Blue
    icon: <Brain size={18} className="text-[#020B18]" />,
    label: 'ML Model'
  },
  tool: {
    color: '#34D399', // Emerald
    icon: <Wrench size={18} className="text-[#020B18]" />,
    label: 'Tool'
  }
};

export function CustomNode({ data, selected }: { data: any, selected: boolean }) {
  const t = data.type || 'agent';
  const config = typeConfig[t] || typeConfig['agent'];

  return (
    <div 
      className={`
        relative w-64 rounded-2xl transition-all duration-200 glass-card
        ${selected ? 'border-brand-primary shadow-[0_0_20px_rgba(26,255,162,0.4)] scale-105' : ''}
        group
      `}
    >
      {/* Target handle (Input) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-brand-primary border-2 border-bg-dark shadow-[0_0_10px_rgba(26,255,162,0.5)]" 
      />

      {/* Header */}
      <div 
        className="flex items-center gap-3 p-3 rounded-t-2xl"
        style={{ background: `linear-gradient(to right, ${config.color}20, transparent)` }}
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.color }}
        >
          {config.icon}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: config.color }}>
            {config.label}
          </div>
          <div className="text-sm font-bold text-white truncate">
            {data.name || 'Untitled'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 text-xs text-text-muted border-t border-white/5">
        {data.description ? (
          <div className="line-clamp-2">{data.description}</div>
        ) : (
          <div className="italic opacity-50">No description provided...</div>
        )}
      </div>

      {/* Status indicator */}
      {data.status && (
        <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bg-dark">
          <div className={`h-3 w-3 rounded-full ${data.status === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]'} animate-pulse`} />
        </div>
      )}

      {/* Source handle (Output) */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-brand-primary border-2 border-bg-dark shadow-[0_0_10px_rgba(26,255,162,0.5)]" 
      />
    </div>
  );
}
