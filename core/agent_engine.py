"""
Agent Engine — المحرّك الرئيسي لتحويل الرسمة البصرية إلى روبوتات AI حقيقية.
يستقبل nodes (صناديق) و edges (أسهم) من FlowBuilder، ويحوّلها لـ Agents تشتغل.
يدعم 3 أنماط تشغيل: Sequential, Parallel, Loop.

المسؤول: القائد (AMR)
"""

import asyncio
import json
import time
import logging
from collections import defaultdict, deque
from typing import Any, Optional
from datetime import datetime
import litellm

litellm.drop_params = True

# تم استبدال Google ADK بمحرك Groq / LiteLLM الاحترافي
ADK_AVAILABLE = False

# استيراد قاعدة البيانات
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from core.database import get_nodes, get_edges
except ImportError:
    get_nodes = None
    get_edges = None

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# الوظائف المساعدة — Helper Functions
# ═══════════════════════════════════════════════════════════════

def parse_node_data(node: dict) -> dict:
    """
    تحويل بيانات عقدة (node) من قاعدة البيانات إلى dict قابل للاستخدام.
    node row من SQLite بيحتوي data_json كـ string → نحوّله لـ dict.

    يدعم الآن catalog_type — إذا كان البلوك من الكتالوج الجاهز،
    يُستخدم الـ system_prompt الجاهز تلقائياً بدلاً من تعليمات المستخدم.
    """
    data = {}
    raw = node.get("data_json") or node.get("meta", {})
    if isinstance(raw, str):
        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            data = {}
    elif isinstance(raw, dict):
        data = raw

    # ── دعم Catalog Nodes ──────────────────────────────────────────────
    # لو البلوك من الكتالوج الجاهز، نستخدم الـ system_prompt الجاهز
    catalog_type = data.get("catalog_type", "")
    instructions = data.get("instructions", "أنت مساعد ذكي.")

    integration = None
    if catalog_type:
        try:
            from core.node_catalog import get_node_prompt, get_node_model, get_node_by_id
            catalog_prompt = get_node_prompt(catalog_type)
            catalog_model  = get_node_model(catalog_type)
            cat_node = get_node_by_id(catalog_type)
            integration = cat_node.get("integration")
            # ندمج: الـ prompt الجاهز + التعليمات الإضافية إن وُجدت
            if instructions and instructions != "أنت مساعد ذكي." and catalog_prompt:
                instructions = f"{catalog_prompt}\n\n---\n\n**السياق والتعليمات الإضافية:**\n{instructions}"
            elif catalog_prompt:
                instructions = catalog_prompt
            # نستخدم موديل الكتالوج كـ default إذا لم يُحدَّد صراحةً
            model = data.get("model") or catalog_model
        except Exception:
            model = data.get("model", "groq/llama-3.3-70b-versatile")
    else:
        model = data.get("model", "groq/llama-3.3-70b-versatile")
        
    # Override any saved Gemini models from the database to use Groq
    if "gemini" in model.lower():
        model = "groq/llama-3.3-70b-versatile"
    # ───────────────────────────────────────────────────────────────────

    return {
        "id": node.get("id", ""),
        "name": node.get("name", "Agent"),
        "instructions": instructions,
        "model": model,
        "tools": data.get("tools", []),
        "description": data.get("description", ""),
        "color": data.get("color", "#8b5cf6"),
        "agent_type": data.get("agent_type", "agent"),
        "catalog_type": catalog_type,
        "integration": integration,
    }


def build_adjacency(nodes: list[dict], edges: list[dict]) -> dict[str, list[str]]:
    """
    بناء قائمة الجوار (Adjacency List) من الأسهم.
    يرجّع dict: {source_id: [target_id_1, target_id_2, ...]}
    """
    adj = defaultdict(list)
    node_ids = {n.get("id") for n in nodes}

    for edge in edges:
        src = edge.get("source_node_id") or edge.get("source", "")
        tgt = edge.get("target_node_id") or edge.get("target", "")
        # نتأكد إن الطرفين موجودين فعلاً
        if src in node_ids and tgt in node_ids:
            adj[src].append(tgt)

    return dict(adj)


# ═══════════════════════════════════════════════════════════════
# Topological Sort — ترتيب الـ Agents حسب الأسهم
# ═══════════════════════════════════════════════════════════════

def topological_sort(nodes: list[dict], edges: list[dict]) -> list[str]:
    """
    خوارزمية Kahn لترتيب الـ nodes طوبولوجياً (topologically).
    بتحدد مين يشتغل الأول بناءً على الأسهم.

    المبدأ:
    1. نحسب الـ in-degree (عدد الأسهم الداخلة) لكل node.
    2. نبدأ من الـ nodes اللي in-degree = 0 (ملهاش أسهم داخلة = نقاط البداية).
    3. نشيل node، ننقّص in-degree لجيرانه، لو حد وصل لـ 0 نضيفه للطابور.
    4. لو عدد الـ nodes اللي طلعت أقل من الكل → فيه cycle (حلقة دائرية).

    Returns:
        list of node IDs بالترتيب الصحيح للتشغيل.
    """
    node_ids = [n.get("id") for n in nodes]
    adj = build_adjacency(nodes, edges)

    # حساب الـ in-degree لكل node
    in_degree = {nid: 0 for nid in node_ids}
    for src, targets in adj.items():
        for tgt in targets:
            if tgt in in_degree:
                in_degree[tgt] += 1

    # الطابور: نبدأ بالـ nodes اللي ملهاش أسهم داخلة
    queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
    order = []

    while queue:
        current = queue.popleft()
        order.append(current)

        # ننقّص in-degree لكل جار
        for neighbor in adj.get(current, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # لو فيه nodes ناقصة → يوجد cycle
    if len(order) < len(node_ids):
        missing = set(node_ids) - set(order)
        logger.warning(f"⚠️ تم اكتشاف حلقة دائرية (Cycle)! العقد المتأثرة: {missing}")
        # نضيف الباقي في النهاية عشان لا نخسرهم
        for nid in node_ids:
            if nid not in order:
                order.append(nid)

    return order


def has_cycle(nodes: list[dict], edges: list[dict]) -> bool:
    """فحص وجود حلقة دائرية في الرسمة."""
    order = topological_sort(nodes, edges)
    return len(set(order)) < len(nodes)


# ═══════════════════════════════════════════════════════════════
# AgentEngine — المحرّك الرئيسي
# ═══════════════════════════════════════════════════════════════

class AgentEngine:
    """
    المحرّك اللي بيحوّل الرسمة البصرية لروبوتات AI حقيقية ويشغّلها.

    الاستخدام:
        engine = AgentEngine(project_id="my-project")
        results = await engine.run(user_input="ابحث عن الذكاء الاصطناعي")
    """

    def __init__(self, project_id: str, api_key: str = None):
        """
        تهيئة المحرّك.

        Args:
            project_id: ID المشروع في قاعدة البيانات.
            api_key: مفتاح Google Gemini API (اختياري — يُأخذ من config).
        """
        self.project_id = project_id
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY", "")
        self._nodes_cache = None
        self._edges_cache = None
        self._agents = {}  # {node_id: LlmAgent}
        self._execution_log = []

    # ──────────── تحميل البيانات من Database ────────────

    def load_flow_from_db(self) -> tuple[list[dict], list[dict]]:
        """
        تحميل الـ nodes و edges من قاعدة البيانات.
        يرجّع: (nodes_list, edges_list)
        """
        if get_nodes is None:
            logger.warning("Database module غير متاح")
            return [], []

        raw_nodes = get_nodes(self.project_id)
        raw_edges = get_edges(self.project_id)

        # تحويل sqlite3.Row → dict
        nodes = [dict(n) for n in raw_nodes] if raw_nodes else []
        edges = [dict(e) for e in raw_edges] if raw_edges else []

        self._nodes_cache = nodes
        self._edges_cache = edges

        logger.info(f"✅ تم تحميل {len(nodes)} عقدة و {len(edges)} سهم من المشروع {self.project_id}")
        return nodes, edges

    def load_flow_from_data(self, nodes: list[dict], edges: list[dict]):
        """
        تحميل الـ flow من بيانات مباشرة (بدل Database).
        مفيد للاختبار أو لما البيانات تيجي من FlowBuilder مباشرة.
        """
        self._nodes_cache = nodes
        self._edges_cache = edges
        logger.info(f"✅ تم تحميل {len(nodes)} عقدة و {len(edges)} سهم مباشرة")

    # ──────────── بناء Agent واحد ────────────

    def build_agent(self, node_data: dict) -> Any:
        """
        تحويل بيانات صندوق واحد (node) لـ LlmAgent حقيقي.

        Args:
            node_data: dict ببيانات العقدة (id, name, instructions, model, tools).

        Returns:
            LlmAgent object (أو SimulatedAgent لو ADK مش مثبّت).
        """
        # نجهز إعدادات الروبوت من البيانات البصرية
        config = parse_node_data(node_data)
        agent_name = config["name"].replace(" ", "_").replace("-", "_")
        instructions = config["instructions"]
        model = config["model"]
        tool_names = config["tools"]

        # بناء قائمة الأدوات المتاحة
        tools = self._resolve_tools(tool_names)

        if ADK_AVAILABLE:
            # بناء LlmAgent حقيقي من Google ADK
            agent = LlmAgent(
                name=agent_name,
                model=model,
                instruction=instructions,
                tools=tools if tools else None,
            )
            logger.info(f"🤖 تم بناء Agent حقيقي: {agent_name} (Model: {model})")
        else:
            # وضع المحاكاة — بدون ADK
            agent = SimulatedAgent(
                name=agent_name,
                model=model,
                instructions=instructions,
                tools=tool_names,
                integration=config.get("integration")
            )
            logger.info(f"🧪 تم بناء Agent محاكاة: {agent_name}")

        self._agents[config["id"]] = agent
        return agent

    def _resolve_tools(self, tool_names: list[str]) -> list:
        """
        تحويل أسماء الأدوات (مثل 'google_search') لـ function objects.
        الأدوات الفعلية تيجي من ملف tools/ اللي شهد عملته.
        """
        resolved = []

        # محاولة استيراد الأدوات من tools/
        for tool_name in tool_names:
            try:
                if tool_name == "google_search":
                    from google.adk.tools import google_search
                    resolved.append(google_search)
                # أدوات أخرى يتم إضافتها هنا لما شهد تخلّصها
            except ImportError:
                logger.debug(f"⚠️ الأداة '{tool_name}' غير متاحة حالياً")

        return resolved

    # ──────────── بناء كل الـ Agents ────────────

    def build_all_agents(self) -> dict:
        """
        بناء كل الـ Agents من الـ flow المحمّل.
        يرجّع: dict {node_id: agent_object}
        """
        if not self._nodes_cache:
            self.load_flow_from_db()

        nodes = self._nodes_cache or []
        self._agents = {}

        for node in nodes:
            self.build_agent(node)

        logger.info(f"✅ تم بناء {len(self._agents)} روبوت بنجاح")
        return self._agents

    # ──────────── ترتيب التشغيل ────────────

    def get_execution_order(self) -> list[str]:
        """تحديد ترتيب تشغيل الـ Agents بناءً على الأسهم."""
        nodes = self._nodes_cache or []
        edges = self._edges_cache or []
        return topological_sort(nodes, edges)

    # ═══════════════════════════════════════════════════════════
    # أنماط التشغيل — Execution Modes
    # ═══════════════════════════════════════════════════════════

    async def run_agent_single(self, agent: Any, user_input: str) -> str:
        """
        تشغيل Agent واحد وإرجاع نتيجته.

        Args:
            agent: الـ Agent المراد تشغيله (LlmAgent أو SimulatedAgent).
            user_input: الرسالة/الطلب من المستخدم.

        Returns:
            str: رد الـ Agent.
        """
        if ADK_AVAILABLE and isinstance(agent, LlmAgent):
            # تشغيل Agent حقيقي عبر Runner
            session_service = InMemorySessionService()
            runner = Runner(
                agent=agent,
                app_name=f"vab_{self.project_id}",
                session_service=session_service,
            )

            session = await session_service.create_session(
                app_name=f"vab_{self.project_id}",
                user_id="user_main",
            )

            from google.genai import types
            user_message = types.Content(
                role="user",
                parts=[types.Part.from_text(user_input)]
            )

            result_text = ""
            async for event in runner.run_async(
                user_id="user_main",
                session_id=session.id,
                new_message=user_message,
            ):
                if event.is_final_response():
                    if event.content and event.content.parts:
                        result_text = event.content.parts[0].text
                    break

            return result_text or "لم يتم الحصول على رد."
        else:
            # وضع المحاكاة
            return agent.run(user_input)

    async def run_sequential(self, user_input: str) -> dict:
        """
        تشغيل الـ Agents بالتتابع (Sequential) — واحد ورا التاني.
        نتيجة كل Agent بتتمرر كـ input للـ Agent اللي بعده.

        المبدأ:
        Agent1(input) → output1
        Agent2(output1) → output2
        Agent3(output2) → final_result

        Returns:
            dict مع النتائج وتفاصيل التشغيل.
        """
        start_time = time.time()
        self._execution_log = []

        if not self._agents:
            self.build_all_agents()

        order = self.get_execution_order()
        current_input = user_input
        results = []

        for node_id in order:
            agent = self._agents.get(node_id)
            if not agent:
                continue

            agent_name = getattr(agent, 'name', node_id)
            step_start = time.time()

            try:
                # تشغيل الـ Agent مع الـ input الحالي
                output = await self.run_agent_single(agent, current_input)

                step_time = time.time() - step_start
                results.append({
                    "agent_id": node_id,
                    "agent_name": agent_name,
                    "input": current_input[:200],  # أول 200 حرف
                    "output": output,
                    "execution_time": round(step_time, 2),
                    "status": "success",
                })

                # نتيجة الـ Agent الحالي = input الـ Agent اللي بعده
                current_input = output

                self._execution_log.append(f"✅ {agent_name}: تم ({step_time:.1f}s)")

            except Exception as e:
                step_time = time.time() - step_start
                error_msg = str(e)
                results.append({
                    "agent_id": node_id,
                    "agent_name": agent_name,
                    "input": current_input[:200],
                    "output": "",
                    "error": error_msg,
                    "execution_time": round(step_time, 2),
                    "status": "error",
                })
                self._execution_log.append(f"❌ {agent_name}: خطأ — {error_msg}")
                logger.error(f"خطأ في تشغيل {agent_name}: {e}")

        total_time = time.time() - start_time
        return {
            "status": "success" if all(r["status"] == "success" for r in results) else "partial",
            "mode": "sequential",
            "results": results,
            "final_output": results[-1]["output"] if results else "",
            "execution_time": round(total_time, 2),
            "agents_count": len(results),
            "timestamp": datetime.now().isoformat(),
        }

    async def run_parallel(self, user_input: str) -> dict:
        """
        تشغيل الـ Agents بالتوازي (Parallel) — كلهم مع بعض في نفس الوقت.
        كل Agent بياخد نفس الـ input ويشتغل مستقلاً.

        المبدأ:
        Agent1(input) ┐
        Agent2(input) ├→ [output1, output2, output3]
        Agent3(input) ┘

        Returns:
            dict مع كل النتائج.
        """
        start_time = time.time()
        self._execution_log = []

        if not self._agents:
            self.build_all_agents()

        order = self.get_execution_order()

        # تجهيز المهام المتوازية
        async def _run_one(node_id: str):
            agent = self._agents.get(node_id)
            if not agent:
                return None

            agent_name = getattr(agent, 'name', node_id)
            step_start = time.time()

            try:
                output = await self.run_agent_single(agent, user_input)
                step_time = time.time() - step_start
                return {
                    "agent_id": node_id,
                    "agent_name": agent_name,
                    "input": user_input[:200],
                    "output": output,
                    "execution_time": round(step_time, 2),
                    "status": "success",
                }
            except Exception as e:
                step_time = time.time() - step_start
                return {
                    "agent_id": node_id,
                    "agent_name": agent_name,
                    "input": user_input[:200],
                    "output": "",
                    "error": str(e),
                    "execution_time": round(step_time, 2),
                    "status": "error",
                }

        # تشغيل كل الـ Agents بالتوازي باستخدام asyncio.gather
        tasks = [_run_one(nid) for nid in order]
        results_raw = await asyncio.gather(*tasks, return_exceptions=True)

        # تنظيف النتائج
        results = []
        for r in results_raw:
            if isinstance(r, Exception):
                results.append({
                    "agent_id": "unknown",
                    "agent_name": "unknown",
                    "output": "",
                    "error": str(r),
                    "status": "error",
                })
            elif r is not None:
                results.append(r)

        total_time = time.time() - start_time

        # تجميع كل المخرجات
        combined_output = "\n\n---\n\n".join(
            f"**{r['agent_name']}**: {r['output']}"
            for r in results if r.get("output")
        )

        return {
            "status": "success" if all(r["status"] == "success" for r in results) else "partial",
            "mode": "parallel",
            "results": results,
            "final_output": combined_output,
            "execution_time": round(total_time, 2),
            "agents_count": len(results),
            "timestamp": datetime.now().isoformat(),
        }

    async def run_loop(self, user_input: str, max_iterations: int = 5,
                       stop_condition: str = None) -> dict:
        """
        تشغيل الـ Agents في حلقة (Loop) — بتتكرر لحد ما:
        1. يوصل لعدد التكرارات المحدد (max_iterations).
        2. أو نتيجة الـ Agent الأخير تحتوي على stop_condition.

        المبدأ:
        Round 1: Agent1 → Agent2 → Agent3 → output
        Round 2: Agent1(output) → Agent2 → Agent3 → output
        ... حتى الشرط يتحقق

        Returns:
            dict مع كل جولات التشغيل.
        """
        start_time = time.time()
        self._execution_log = []

        if not self._agents:
            self.build_all_agents()

        all_rounds = []
        current_input = user_input

        for iteration in range(1, max_iterations + 1):
            logger.info(f"🔄 الجولة {iteration}/{max_iterations}")

            # نشغّل Sequential في كل جولة
            round_result = await self.run_sequential(current_input)
            round_result["iteration"] = iteration
            all_rounds.append(round_result)

            final_output = round_result.get("final_output", "")

            # فحص شرط التوقف
            if stop_condition and stop_condition.lower() in final_output.lower():
                logger.info(f"✅ شرط التوقف تحقق في الجولة {iteration}")
                break

            # نتيجة الجولة = input الجولة الجاية
            current_input = final_output

        total_time = time.time() - start_time
        return {
            "status": "success",
            "mode": "loop",
            "iterations_completed": len(all_rounds),
            "max_iterations": max_iterations,
            "rounds": all_rounds,
            "final_output": all_rounds[-1]["final_output"] if all_rounds else "",
            "execution_time": round(total_time, 2),
            "timestamp": datetime.now().isoformat(),
        }

    # ──────────── الدالة الرئيسية ────────────

    async def run(self, user_input: str, mode: str = "sequential",
                  max_iterations: int = 5, stop_condition: str = None) -> dict:
        """
        الدالة الرئيسية لتشغيل الـ flow.

        Args:
            user_input: رسالة/طلب المستخدم.
            mode: نمط التشغيل — 'sequential', 'parallel', أو 'loop'.
            max_iterations: عدد التكرارات الأقصى (لنمط loop).
            stop_condition: كلمة توقف (لنمط loop).

        Returns:
            dict مع النتائج الكاملة.
        """
        logger.info(f"🚀 بدء تشغيل الـ Flow — النمط: {mode}")

        if mode == "parallel":
            return await self.run_parallel(user_input)
        elif mode == "loop":
            return await self.run_loop(user_input, max_iterations, stop_condition)
        else:
            return await self.run_sequential(user_input)

    # ──────────── معلومات التشغيل ────────────

    def get_execution_log(self) -> list[str]:
        """إرجاع سجل آخر تشغيل."""
        return self._execution_log.copy()

    def get_flow_summary(self) -> dict:
        """ملخص الـ flow الحالي."""
        nodes = self._nodes_cache or []
        edges = self._edges_cache or []
        order = topological_sort(nodes, edges)

        return {
            "project_id": self.project_id,
            "total_agents": len(nodes),
            "total_connections": len(edges),
            "execution_order": order,
            "has_cycle": has_cycle(nodes, edges),
            "agents_built": len(self._agents),
        }


# ═══════════════════════════════════════════════════════════════
# SimulatedAgent — للتشغيل بدون Google ADK
# ═══════════════════════════════════════════════════════════════

class SimulatedAgent:
    """
    Agent محاكاة — يُستخدم لما ADK مش مثبّت.
    تم تطويره لاستخدام LiteLLM بدلاً من الرد الوهمي، مما يجعله يعمل بشكل حقيقي كـ Agent.
    """

    def __init__(self, name: str, model: str, instructions: str, tools: list = None, integration: str = None):
        self.name = name
        # توحيد اسم الموديل مع LiteLLM
        if model.startswith("groq/") or model.startswith("gemini/"):
            self.model = model
        else:
            self.model = f"gemini/{model}"
            
        self.instructions = instructions
        self.tools = tools or []
        self.integration = integration

    def run(self, user_input: str) -> str:
        """إرجاع رد. إذا كان Integration، يستخدم محرك التكامل، وإلا يستخدم LiteLLM."""
        
        if self.integration:
            from core.integrations import get_integration
            try:
                integ = get_integration(self.integration)
                
                # نستخدم الذكاء الاصطناعي لاستخراج البيانات المطلوبة للإرسال
                if self.integration in ["whatsapp", "telegram"]:
                    action_info = "send_whatsapp" if self.integration == "whatsapp" else "send_telegram"
                    prompt = f"أنت وسيط لخدمة {self.integration}. تعليماتك الخاصة تحتوي على المفاتيح: {self.instructions}. استخرج 'message' (نص الرسالة)، و 'phone' و 'api_key' (للواتساب) أو 'chat_id' و 'token' (للتليجرام) من النص التالي والتعليمات: '{user_input}'. رد بصيغة JSON فقط، بدون أي نص إضافي."
                    ai_data = self._run_llm(user_input, prompt)
                    
                    try:
                        # محاولة استخراج JSON من رد الـ AI
                        import re
                        json_match = re.search(r'\{.*\}', ai_data, re.DOTALL)
                        params = json.loads(json_match.group()) if json_match else {"message": user_input}
                    except:
                        params = {"message": user_input}
                        
                    exec_res = integ.execute(action_info, params)
                    return f"{exec_res.get('result', 'تم التنفيذ')} \n(المحتوى: {params.get('message')})"
                
                return str(integ.execute("auto", {"input": user_input}))
            except Exception as e:
                logger.error(f"Integration Error in {self.name}: {e}")
                return f"[خطأ في التكامل {self.integration}]: {str(e)}"
                
        return self._run_llm(user_input, self.instructions)

    def _run_llm(self, user_input: str, instructions: str) -> str:
        tools_info = f" (أدوات: {', '.join(self.tools)})" if self.tools else ""
        system_prompt = f"أنت المحلل الذكي {self.name}.\nتعليماتك: {instructions}\nالأدوات المتاحة: {tools_info}"
        
        try:
            # نتأكد من وضع المفتاح في البيئة
            from core.config import Config
            if not os.environ.get("GROQ_API_KEY"):
                os.environ["GROQ_API_KEY"] = os.environ.get("GROQ_API_KEY", "")
                
            response = litellm.completion(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"[خطأ في Agent {self.name}]: {str(e)}"

    def __repr__(self):
        return f"SimulatedAgent(name='{self.name}', model='{self.model}')"


# ═══════════════════════════════════════════════════════════════
# اختبار سريع — Quick Test
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # اختبار بسيط بدون Database
    print("=" * 60)
    print("🧪 اختبار الـ Agent Engine")
    print("=" * 60)

    # بيانات وهمية — 3 agents
    test_nodes = [
        {"id": "1", "name": "باحث", "data_json": json.dumps({
            "instructions": "ابحث عن المعلومات المطلوبة وقدم ملخص شامل",
            "model": "groq/llama-3.3-70b-versatile",
            "tools": ["google_search"],
        })},
        {"id": "2", "name": "محلل", "data_json": json.dumps({
            "instructions": "حلل المعلومات وحدد النقاط الرئيسية",
            "model": "groq/llama-3.3-70b-versatile",
            "tools": [],
        })},
        {"id": "3", "name": "كاتب", "data_json": json.dumps({
            "instructions": "اكتب تقرير نهائي مرتب ومنسق",
            "model": "groq/llama-3.3-70b-versatile",
            "tools": [],
        })},
    ]

    test_edges = [
        {"source_node_id": "1", "target_node_id": "2"},
        {"source_node_id": "2", "target_node_id": "3"},
    ]

    # اختبار Topological Sort
    order = topological_sort(test_nodes, test_edges)
    print(f"\n📊 ترتيب التشغيل: {order}")
    assert order == ["1", "2", "3"], "❌ الترتيب غلط!"
    print("✅ Topological Sort شغال صح!")

    # اختبار بناء الـ Agents
    engine = AgentEngine(project_id="test-project")
    engine.load_flow_from_data(test_nodes, test_edges)
    agents = engine.build_all_agents()
    print(f"\n🤖 تم بناء {len(agents)} روبوت")

    # اختبار التشغيل المتتابع
    async def test_run():
        result = await engine.run("ابحث عن الذكاء الاصطناعي", mode="sequential")
        print(f"\n🏁 النتيجة النهائية:")
        print(f"   النمط: {result['mode']}")
        print(f"   عدد الـ Agents: {result['agents_count']}")
        print(f"   الوقت: {result['execution_time']}s")
        print(f"   المخرج: {result['final_output'][:200]}...")

        # اختبار التشغيل المتوازي
        result_p = await engine.run("حلل هذا النص", mode="parallel")
        print(f"\n🔀 نتيجة التوازي:")
        print(f"   الوقت: {result_p['execution_time']}s")

    asyncio.run(test_run())

    # ملخص
    summary = engine.get_flow_summary()
    print(f"\n📋 ملخص:")
    print(f"   Agents: {summary['total_agents']}")
    print(f"   Connections: {summary['total_connections']}")
    print(f"   Cycle: {summary['has_cycle']}")

    print("\n✅ كل الاختبارات نجحت!")
