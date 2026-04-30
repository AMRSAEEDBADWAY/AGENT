import { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useParams } from 'react-router-dom';

import { Play, Save, Plus, X, Download } from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';
import { CustomNode } from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

export const FlowEditor = () => {
  const { id: projectId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [catalog, setCatalog] = useState<any>({});
  const [showCatalog, setShowCatalog] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
    loadCatalog();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await client.get(`/api/projects/${projectId}`);
      const project = res.data;
      
      const loadedNodes = project.nodes.map((n: any) => ({
        id: n.id,
        type: 'custom',
        position: { x: n.x_position || 100, y: n.y_position || 100 },
        data: { name: n.name, type: n.type, ...n.data_json }
      }));
      setNodes(loadedNodes);

      const loadedEdges = project.edges.map((e: any) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      }));
      setEdges(loadedEdges);
    } catch (err) {
      console.error('Failed to load project', err);
    }
  };

  const loadCatalog = async () => {
    try {
      const res = await client.get('/api/projects/catalog/nodes');
      console.log('Catalog API response:', res.data);
      console.log('Catalog keys:', Object.keys(res.data));
      console.log('First category:', Object.values(res.data)[0]);
      setCatalog(res.data);
    } catch (err) {
      console.error('Failed to load catalog', err);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } } as any, eds)),
    [setEdges]
  );

  const handleSave = async () => {
    if (!projectId) return;
    toast.promise(
      client.post(`/api/projects/${projectId}/save`, { nodes, edges }),
      {
        loading: 'جاري الحفظ...',
        success: 'تم حفظ المشروع بنجاح!',
        error: 'فشل في حفظ المشروع',
      }
    );
  };

  const handleExport = async () => {
    try {
      const res = await client.get(`/api/projects/${projectId}/export`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `project_${res.data.name}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success('تم تصدير المشروع بنجاح!');
    } catch (err) {
      toast.error('فشل في تصدير المشروع');
    }
  };

  const handleExecute = async () => {
    if (!projectId) return;
    const input = prompt('أدخل نص البداية لتشغيل التدفق (Workflow Input):');
    if (!input) return;

    toast.promise(
      client.post('/api/chat/run', { project_id: projectId, input_text: input }),
      {
        loading: 'جاري تشغيل التدفق...',
        success: (res) => `تم التشغيل! النتيجة: ${res.data.result?.substring(0, 50)}...`,
        error: 'فشل التشغيل',
      }
    );
  };

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeDataRaw = event.dataTransfer.getData('application/reactflow-data');
      if (typeof type === 'undefined' || !type) return;

      const nodeData = JSON.parse(nodeDataRaw);

      const position = {
        x: event.clientX - 300, // naive approx
        y: event.clientY - 100,
      };

      const newNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <div className="h-[calc(100vh-2rem)] w-full flex relative overflow-hidden rounded-[2rem] shadow-2xl glass-panel border-brand-primary/10" dir="ltr">
      
      {/* Node Catalog Sidebar */}
      <div className={`absolute top-0 bottom-0 right-0 z-20 w-80 bg-[#020B18]/80 backdrop-blur-xl border-l border-brand-primary/10 transition-transform duration-300 transform ${showCatalog ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10" dir="rtl">
          <h2 className="font-bold text-lg text-white">كتالوج العُقَد</h2>
          <button onClick={() => setShowCatalog(false)} className="p-2 hover:bg-white/10 rounded-lg text-text-muted transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-60px)] custom-scrollbar" dir="rtl">
          {Object.values(catalog).map((cat: any) => (
            <div key={cat.info?.label}>
              <div className="text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: cat.info?.color }} />
                {cat.info?.label}
              </div>
              <div className="space-y-2">
                {cat.nodes?.map((n: any) => (
                  <div
                    key={n.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'custom');
                      e.dataTransfer.setData('application/reactflow-data', JSON.stringify({ name: n.name, type: n.category, description: n.description }));
                    }}
                    className="flex items-center gap-3 p-3 glass-card rounded-xl cursor-grab hover:border-brand-primary/30 transition-all hover:-translate-y-1"
                  >
                    <span className="text-xl">{n.icon}</span>
                    <div className="flex-1 text-right">
                      <div className="text-sm font-bold text-white mb-1">{n.name}</div>
                      <div className="text-xs text-text-muted leading-tight">{n.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Node Editing Sidebar */}
      {selectedNode && (
        <div className={`absolute top-0 bottom-0 left-0 z-20 w-80 bg-[#020B18]/80 backdrop-blur-xl border-r border-brand-primary/10 transition-transform duration-300 transform`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10" dir="rtl">
            <h2 className="font-bold text-lg text-white">تعديل العقدة</h2>
            <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/10 rounded-lg text-text-muted transition">
              <X size={18} />
            </button>
          </div>
          <div className="p-4 space-y-4" dir="rtl">
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2">اسم الوكيل / العقدة</label>
              <input 
                type="text" 
                value={selectedNode.data?.name || ''} 
                onChange={(e) => {
                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, name: e.target.value } } : n));
                  setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, name: e.target.value } }));
                }}
                className="w-full glass-input rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2">تعليمات System Prompt</label>
              <textarea 
                value={selectedNode.data?.instructions || ''} 
                onChange={(e) => {
                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, instructions: e.target.value } } : n));
                  setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, instructions: e.target.value } }));
                }}
                rows={10}
                className="w-full glass-input rounded-xl px-4 py-3 text-white outline-none resize-none"
                placeholder="اكتب تعليمات للذكاء الاصطناعي هنا..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Flow Editor Area */}
      <div className="flex-1 relative h-full">
        {/* Top Toolbar */}
        <div className="absolute top-4 right-4 left-4 z-10 flex justify-between items-center pointer-events-none">
          {/* Left Side Controls (because ltr) */}
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => setShowCatalog(!showCatalog)}
              className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl hover:border-brand-primary/40 font-medium shadow-lg transition text-white"
            >
              <Plus size={18} />
              <span>Add Node</span>
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="flex gap-3 pointer-events-auto">
            <button onClick={handleExport} title="Export Project" className="p-2 glass-card rounded-xl hover:border-brand-primary/40 text-text-muted hover:text-white transition shadow-lg">
              <Download size={20} />
            </button>
            <button onClick={handleSave} title="Save Project" className="p-2 glass-card rounded-xl hover:border-brand-primary/40 text-text-muted hover:text-white transition shadow-lg">
              <Save size={20} />
            </button>
            <button onClick={handleExecute} className="flex items-center gap-2 px-6 py-2 btn-neon-solid shadow-[0_0_15px_rgba(26,255,162,0.3)]">
              <Play size={18} fill="currentColor" />
              <span>Execute Workflow</span>
            </button>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
          fitView
          className="bg-transparent"
          minZoom={0.2}
        >
          <Background 
            color="#1AFFA2" 
            gap={24} 
            size={1.5} 
            style={{ opacity: 0.1 }} 
          />
          <Controls 
            className="glass-card fill-brand-primary rounded-xl overflow-hidden" 
            showInteractive={false}
          />
          <MiniMap 
            className="glass-card rounded-xl" 
            maskColor="rgba(2,11,24,0.7)"
            nodeColor={(n) => {
              if (n.data?.type === 'integration') return '#22D3EE';
              if (n.data?.type === 'mcp') return '#FBBF24';
              return '#1AFFA2';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};
