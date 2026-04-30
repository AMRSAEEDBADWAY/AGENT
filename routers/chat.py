"""
💬 Chat Router — AI Chat & Workflow Execution
===============================================
Handles chat messages, workflow runs, and chat history.
"""

import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any, List
from core.firebase_config import get_db
import datetime

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    project_id: str = ""
    node_id: str = ""

class WorkflowRequest(BaseModel):
    project_id: str

class RunRequest(BaseModel):
    project_id: str
    input_text: str


# ═══════════════════════════════════════════════════════════
# POST /message  — Send a chat message
# ═══════════════════════════════════════════════════════════
@router.post("/message")
async def send_message(req: ChatRequest, request: Request):
    uid = request.headers.get("X-User-ID")
    if not uid:
        raise HTTPException(status_code=401)
        
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY غير مضبوط في ملف .env")
    os.environ["GROQ_API_KEY"] = api_key
    
    system_prompt = "أنت مساعد ذكي. ساعد المستخدم في مهمته. رد بالعربي."
    model = "groq/llama-3.3-70b-versatile"
    
    if req.project_id and req.node_id:
        db = get_db()
        if db:
            doc = db.collection("projects").document(req.project_id).get()
            if doc.exists:
                data = doc.to_dict()
                nodes = data.get("nodes", [])
                for node in nodes:
                    if node.get("id") == req.node_id:
                        ndata = node.get("data", {}) if isinstance(node.get("data"), dict) else node.get("data_json", {})
                        system_prompt = ndata.get("instructions", system_prompt)
                        break

    import litellm
    try:
        response = litellm.completion(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ]
        )
        reply = response.choices[0].message.content
        
        # Save to chat history in Firestore
        if req.project_id:
            try:
                db = get_db()
                if db:
                    db.collection("chat_history").document().set({
                        "project_id": req.project_id,
                        "user_id": uid,
                        "user_message": req.message,
                        "ai_reply": reply,
                        "node_id": req.node_id,
                        "timestamp": datetime.datetime.now().isoformat(),
                    })
            except Exception:
                pass  # Don't fail the chat if history saving fails
        
        return {"success": True, "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════
# GET /history/{project_id}  — Get chat history for a project
# ═══════════════════════════════════════════════════════════
@router.get("/history/{project_id}")
async def get_chat_history(project_id: str, request: Request):
    uid = request.headers.get("X-User-ID")
    if not uid:
        raise HTTPException(status_code=401)
    
    db = get_db()
    if not db:
        return {"messages": []}
    
    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
        docs = (
            db.collection("chat_history")
            .where(filter=FieldFilter("project_id", "==", project_id))
            .where(filter=FieldFilter("user_id", "==", uid))
            .get()
        )
        
        messages = []
        for doc in docs:
            d = doc.to_dict()
            messages.append({
                "id": doc.id,
                "user_message": d.get("user_message", ""),
                "ai_reply": d.get("ai_reply", ""),
                "node_id": d.get("node_id", ""),
                "timestamp": d.get("timestamp", ""),
            })
        
        # Sort by timestamp
        messages.sort(key=lambda m: m.get("timestamp", ""))
        
        return {"messages": messages}
    except Exception as e:
        # Return empty if collection doesn't exist yet
        return {"messages": []}


# ═══════════════════════════════════════════════════════════
# POST /run  — Execute a workflow
# ═══════════════════════════════════════════════════════════
@router.post("/run")
async def run_workflow_simple(req: RunRequest, request: Request):
    uid = request.headers.get("X-User-ID")
    if not uid:
        raise HTTPException(status_code=401)
    
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="قاعدة البيانات غير متاحة")
    
    doc = db.collection("projects").document(req.project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    
    data = doc.to_dict()
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    
    if not nodes:
        return {"success": True, "result": "لا توجد عقد في المشروع. أضف بلوكات أولاً."}
    
    # Simple sequential execution: process nodes in order based on edges
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY غير مضبوط")
    os.environ["GROQ_API_KEY"] = api_key
    
    # Build execution order from edges
    source_nodes = {e.get("source_node_id") or e.get("source") for e in edges}
    target_nodes = {e.get("target_node_id") or e.get("target") for e in edges}
    
    # Find starting nodes (those that are sources but not targets)
    start_ids = source_nodes - target_nodes
    if not start_ids:
        # No edges, just use the first node
        start_ids = {nodes[0].get("id")}
    
    # Build adjacency list
    adj = {}
    for e in edges:
        src = e.get("source_node_id") or e.get("source")
        tgt = e.get("target_node_id") or e.get("target")
        if src:
            adj.setdefault(src, []).append(tgt)
    
    # BFS to get execution order
    visited = set()
    queue = list(start_ids)
    exec_order = []
    while queue:
        nid = queue.pop(0)
        if nid in visited:
            continue
        visited.add(nid)
        exec_order.append(nid)
        for child in adj.get(nid, []):
            queue.append(child)
    
    # Add any nodes not reached by edges
    all_ids = {n.get("id") for n in nodes}
    for nid in all_ids - visited:
        exec_order.append(nid)
    
    # Create node lookup
    node_map = {}
    for n in nodes:
        node_map[n.get("id")] = n
    
    # Execute nodes sequentially
    import litellm
    current_input = req.input_text
    results = []
    
    for nid in exec_order:
        node = node_map.get(nid)
        if not node:
            continue
        
        node_data = node.get("data_json", node.get("data", {}))
        node_name = node.get("name", node_data.get("name", "عقدة"))
        system_prompt = node_data.get("instructions", node_data.get("system_prompt", "أنت مساعد ذكي. نفّذ المهمة التالية."))
        
        try:
            response = litellm.completion(
                model="groq/llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": current_input}
                ]
            )
            output = response.choices[0].message.content
            results.append({
                "node_id": nid,
                "node_name": node_name,
                "output": output,
            })
            # Pass output to next node as input
            current_input = output
        except Exception as e:
            results.append({
                "node_id": nid,
                "node_name": node_name,
                "error": str(e),
            })
    
    final_result = results[-1].get("output", results[-1].get("error", "")) if results else "لم يتم تنفيذ أي عقدة"
    
    return {
        "success": True,
        "result": final_result,
        "node_results": results,
        "message": f"تم تشغيل {len(results)} عقدة بنجاح",
    }


# ═══════════════════════════════════════════════════════════
# POST /workflow  — Execute workflow (legacy endpoint)
# ═══════════════════════════════════════════════════════════
@router.post("/workflow")
async def run_workflow(req: WorkflowRequest, request: Request):
    uid = request.headers.get("X-User-ID")
    if not uid:
        raise HTTPException(status_code=401)
        
    db = get_db()
    if not db:
        raise HTTPException(status_code=500)
        
    doc = db.collection("projects").document(req.project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
        
    data = doc.to_dict()
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    
    try:
        from core.agent_engine import AgentEngine
        engine = AgentEngine(req.project_id, api_key=os.getenv("GROQ_API_KEY", ""))
        engine.load_flow_from_data(nodes, edges)
        engine.build_all_agents()
        results = engine.execute_flow("بدء المسار")
    except ImportError:
        # Fallback if AgentEngine not available
        results = {"message": "تم استقبال الطلب. محرك التنفيذ غير متوفر حالياً."}
    except Exception as e:
        results = {"error": str(e)}
    
    return {
        "success": True,
        "results": results,
        "message": "تم تشغيل المسار بنجاح"
    }
