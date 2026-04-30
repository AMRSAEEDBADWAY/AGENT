from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from core.firebase_config import get_db
from core.node_catalog import get_all_nodes, get_categories_with_nodes
import datetime

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: str = ""

class ProjectUpdate(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class NodeCreate(BaseModel):
    id: str
    name: str
    type: str
    x_position: float = 100
    y_position: float = 100
    data_json: Dict[str, Any] = {}

class EdgeCreate(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str

class ProjectImport(BaseModel):
    name: str
    description: str = ""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []


# ═══════════════════════════════════════════════════════════
# GET /  — List all projects for user
# ═══════════════════════════════════════════════════════════
@router.get("/")
async def get_projects(req: Request):
    db = get_db()
    if not db:
        return []
    
    uid = req.headers.get("X-User-ID")
    if not uid:
        raise HTTPException(status_code=401)
        
    projects = []
    from google.cloud.firestore_v1.base_query import FieldFilter
    docs = db.collection("projects").where(filter=FieldFilter("user_id", "==", uid)).get()
    for doc in docs:
        p = doc.to_dict()
        p["id"] = doc.id
        projects.append(p)
    return projects


# ═══════════════════════════════════════════════════════════
# GET /catalog/nodes  — Node catalog (grouped by category)
# ═══════════════════════════════════════════════════════════
@router.get("/catalog/nodes")
async def get_catalog_nodes():
    """Returns the list of available blocks (nodes) grouped by category for the builder."""
    return get_categories_with_nodes()


# ═══════════════════════════════════════════════════════════
# POST /  — Create new project
# ═══════════════════════════════════════════════════════════
@router.post("/")
async def create_project(req: ProjectCreate, request: Request):
    db = get_db()
    uid = request.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
        
    data = {
        "name": req.name,
        "description": req.description,
        "user_id": uid,
        "nodes": [],
        "edges": [],
        "created_at": datetime.datetime.now().isoformat()
    }
    
    doc_ref = db.collection("projects").document()
    doc_ref.set(data)
    
    return {"success": True, "id": doc_ref.id}


# ═══════════════════════════════════════════════════════════
# POST /import  — Import a project from JSON
# ═══════════════════════════════════════════════════════════
@router.post("/import")
async def import_project(req: ProjectImport, request: Request):
    db = get_db()
    uid = request.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
    
    data = {
        "name": req.name or "مشروع مستورد",
        "description": req.description,
        "user_id": uid,
        "nodes": req.nodes,
        "edges": req.edges,
        "created_at": datetime.datetime.now().isoformat(),
        "imported": True,
    }
    
    doc_ref = db.collection("projects").document()
    doc_ref.set(data)
    
    return {"success": True, "id": doc_ref.id, "message": "تم استيراد المشروع بنجاح"}


# ═══════════════════════════════════════════════════════════
# GET /{project_id}  — Get single project
# ═══════════════════════════════════════════════════════════
@router.get("/{project_id}")
async def get_project(project_id: str, req: Request):
    db = get_db()
    uid = req.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
        
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
        
    data = doc.to_dict()
    data["id"] = doc.id
    return data


# ═══════════════════════════════════════════════════════════
# PUT /{project_id}  — Update project nodes/edges
# ═══════════════════════════════════════════════════════════
@router.put("/{project_id}")
async def update_project(project_id: str, req: ProjectUpdate, request: Request):
    db = get_db()
    uid = request.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
        
    doc_ref = db.collection("projects").document(project_id)
    doc_ref.update({
        "nodes": req.nodes,
        "edges": req.edges,
        "updated_at": datetime.datetime.now().isoformat()
    })
    
    return {"success": True}


# ═══════════════════════════════════════════════════════════
# DELETE /{project_id}  — Delete project
# ═══════════════════════════════════════════════════════════
@router.delete("/{project_id}")
async def delete_project(project_id: str, req: Request):
    db = get_db()
    uid = req.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
        
    db.collection("projects").document(project_id).delete()
    return {"success": True}


# ═══════════════════════════════════════════════════════════
# POST /{project_id}/save  — Save flow (nodes + edges)
# ═══════════════════════════════════════════════════════════
@router.post("/{project_id}/save")
async def save_project(project_id: str, req: ProjectUpdate, request: Request):
    db = get_db()
    uid = request.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
    
    # Convert ReactFlow nodes to storable format
    nodes_data = []
    for n in req.nodes:
        nodes_data.append({
            "id": n.get("id"),
            "name": n.get("data", {}).get("name", ""),
            "type": n.get("data", {}).get("type", "custom"),
            "x_position": n.get("position", {}).get("x", 100),
            "y_position": n.get("position", {}).get("y", 100),
            "data_json": n.get("data", {}),
        })
    
    edges_data = []
    for e in req.edges:
        edges_data.append({
            "id": e.get("id"),
            "source_node_id": e.get("source"),
            "target_node_id": e.get("target"),
        })
    
    doc_ref = db.collection("projects").document(project_id)
    doc_ref.update({
        "nodes": nodes_data,
        "edges": edges_data,
        "updated_at": datetime.datetime.now().isoformat()
    })
    
    return {"success": True, "message": "تم حفظ المشروع بنجاح"}


# ═══════════════════════════════════════════════════════════
# GET /{project_id}/export  — Export project as JSON
# ═══════════════════════════════════════════════════════════
@router.get("/{project_id}/export")
async def export_project(project_id: str, req: Request):
    db = get_db()
    uid = req.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
    
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    
    data = doc.to_dict()
    data["id"] = doc.id
    
    return {
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "nodes": data.get("nodes", []),
        "edges": data.get("edges", []),
        "exported_at": datetime.datetime.now().isoformat(),
    }


# ═══════════════════════════════════════════════════════════
# POST /{project_id}/nodes  — Add node to project
# ═══════════════════════════════════════════════════════════
@router.post("/{project_id}/nodes")
async def add_node(project_id: str, req: NodeCreate, request: Request):
    db = get_db()
    uid = request.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
    
    doc_ref = db.collection("projects").document(project_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    
    data = doc.to_dict()
    nodes = data.get("nodes", [])
    
    new_node = {
        "id": req.id,
        "name": req.name,
        "type": req.type,
        "x_position": req.x_position,
        "y_position": req.y_position,
        "data_json": req.data_json,
    }
    nodes.append(new_node)
    
    doc_ref.update({
        "nodes": nodes,
        "updated_at": datetime.datetime.now().isoformat()
    })
    
    return {"success": True, "node": new_node}


# ═══════════════════════════════════════════════════════════
# POST /{project_id}/edges  — Add edge to project
# ═══════════════════════════════════════════════════════════
@router.post("/{project_id}/edges")
async def add_edge(project_id: str, req: EdgeCreate, request: Request):
    db = get_db()
    uid = request.headers.get("X-User-ID")
    if not db or not uid:
        raise HTTPException(status_code=401)
    
    doc_ref = db.collection("projects").document(project_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="المشروع غير موجود")
    
    data = doc.to_dict()
    edges = data.get("edges", [])
    
    new_edge = {
        "id": req.id,
        "source_node_id": req.source_node_id,
        "target_node_id": req.target_node_id,
    }
    edges.append(new_edge)
    
    doc_ref.update({
        "edges": edges,
        "updated_at": datetime.datetime.now().isoformat()
    })
    
    return {"success": True, "edge": new_edge}
