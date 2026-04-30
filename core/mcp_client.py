"""
🔌 MCP Client — Model Context Protocol
يربط المنصة بخوادم MCP خارجية لتوسيع قدرات الوكلاء.

المسؤول: القائد (AMR)
الإصدار: 1.0

MCP (Model Context Protocol) هو بروتوكول مفتوح من Anthropic
يسمح لأي AI بالاتصال بأدوات وبيانات خارجية بطريقة موحدة.

الاستخدام:
    client = MCPClient("npx", ["-y", "@anthropic/mcp-server-demo"])
    await client.connect()
    tools = await client.list_tools()
    result = await client.call_tool("tool_name", {"param": "value"})
    await client.disconnect()
"""

import json
import asyncio
import logging
import subprocess
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class MCPClient:
    """
    عميل MCP — يتصل بأي MCP Server عبر stdio.
    """

    def __init__(self, command: str, args: List[str] = None, env: Dict[str, str] = None):
        self.command = command
        self.args = args or []
        self.env = env
        self._process: Optional[asyncio.subprocess.Process] = None
        self._request_id = 0
        self._connected = False
        self.server_info: Dict[str, Any] = {}
        self._tools_cache: List[Dict] = []
        self._resources_cache: List[Dict] = []

    @property
    def is_connected(self) -> bool:
        return self._connected and self._process is not None

    async def connect(self) -> Dict[str, Any]:
        """الاتصال بالخادم وتهيئته."""
        try:
            self._process = await asyncio.create_subprocess_exec(
                self.command, *self.args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=self.env,
            )

            # إرسال initialize request
            init_result = await self._send_request("initialize", {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "Visual Agent Builder",
                    "version": "3.5",
                },
            })

            if init_result:
                self.server_info = init_result.get("serverInfo", {})
                # إرسال initialized notification
                await self._send_notification("notifications/initialized", {})
                self._connected = True
                logger.info(f"✅ MCP Connected: {self.server_info.get('name', 'Unknown')}")
                return {"success": True, "server": self.server_info}

            return {"success": False, "error": "فشل في تهيئة الاتصال"}

        except FileNotFoundError:
            return {"success": False, "error": f"الأمر '{self.command}' غير موجود. تأكد من تثبيته."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def disconnect(self):
        """قطع الاتصال بالخادم."""
        if self._process:
            try:
                self._process.terminate()
                await asyncio.wait_for(self._process.wait(), timeout=5)
            except Exception:
                self._process.kill()
            self._process = None
        self._connected = False
        logger.info("🔌 MCP Disconnected")

    async def list_tools(self) -> List[Dict[str, Any]]:
        """جلب قائمة الأدوات المتاحة من الخادم."""
        if not self.is_connected:
            return []

        result = await self._send_request("tools/list", {})
        if result:
            self._tools_cache = result.get("tools", [])
            return self._tools_cache
        return []

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any] = None) -> Dict[str, Any]:
        """استدعاء أداة من الخادم."""
        if not self.is_connected:
            return {"success": False, "error": "غير متصل بالخادم"}

        result = await self._send_request("tools/call", {
            "name": tool_name,
            "arguments": arguments or {},
        })

        if result:
            content = result.get("content", [])
            text_parts = [c.get("text", "") for c in content if c.get("type") == "text"]
            return {
                "success": True,
                "tool": tool_name,
                "result": "\n".join(text_parts) if text_parts else str(content),
                "raw": result,
            }
        return {"success": False, "error": "فشل في استدعاء الأداة"}

    async def list_resources(self) -> List[Dict[str, Any]]:
        """جلب الموارد المتاحة."""
        if not self.is_connected:
            return []

        result = await self._send_request("resources/list", {})
        if result:
            self._resources_cache = result.get("resources", [])
            return self._resources_cache
        return []

    async def read_resource(self, uri: str) -> Dict[str, Any]:
        """قراءة مورد من الخادم."""
        if not self.is_connected:
            return {"success": False, "error": "غير متصل بالخادم"}

        result = await self._send_request("resources/read", {"uri": uri})
        if result:
            contents = result.get("contents", [])
            return {"success": True, "uri": uri, "contents": contents}
        return {"success": False, "error": "فشل في قراءة المورد"}

    # ────────────── Internal Methods ──────────────

    async def _send_request(self, method: str, params: Dict) -> Optional[Dict]:
        """إرسال JSON-RPC request والحصول على الرد."""
        if not self._process or not self._process.stdin:
            return None

        self._request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params,
        }

        try:
            msg = json.dumps(request) + "\n"
            self._process.stdin.write(msg.encode())
            await self._process.stdin.drain()

            # قراءة الرد
            if self._process.stdout:
                line = await asyncio.wait_for(
                    self._process.stdout.readline(), timeout=30
                )
                if line:
                    response = json.loads(line.decode().strip())
                    if "error" in response:
                        logger.error(f"MCP Error: {response['error']}")
                        return None
                    return response.get("result")
        except asyncio.TimeoutError:
            logger.error(f"MCP Timeout for method: {method}")
        except Exception as e:
            logger.error(f"MCP Error: {e}")
        return None

    async def _send_notification(self, method: str, params: Dict):
        """إرسال notification (بدون انتظار رد)."""
        if not self._process or not self._process.stdin:
            return

        notification = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
        }
        try:
            msg = json.dumps(notification) + "\n"
            self._process.stdin.write(msg.encode())
            await self._process.stdin.drain()
        except Exception as e:
            logger.error(f"MCP Notification Error: {e}")


# ═══════════════════════════════════════════════════════════════
# MCP Server Manager — إدارة عدة خوادم
# ═══════════════════════════════════════════════════════════════

class MCPServerManager:
    """مدير خوادم MCP — يدير عدة اتصالات في وقت واحد."""

    # خوادم MCP مقترحة وجاهزة للاستخدام
    SUGGESTED_SERVERS = [
        {
            "id": "filesystem",
            "name": "📁 File System",
            "description": "الوصول لملفات النظام — قراءة/كتابة/بحث",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
        },
        {
            "id": "brave_search",
            "name": "🔍 Brave Search",
            "description": "البحث على الإنترنت عبر Brave Search API",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-brave-search"],
            "env_required": ["BRAVE_API_KEY"],
        },
        {
            "id": "memory",
            "name": "🧠 Memory",
            "description": "ذاكرة طويلة المدى للوكلاء — حفظ واسترجاع المعلومات",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-memory"],
        },
        {
            "id": "sqlite",
            "name": "🗄️ SQLite",
            "description": "الاستعلام عن قواعد بيانات SQLite مباشرة",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-sqlite"],
        },
    ]

    def __init__(self):
        self._clients: Dict[str, MCPClient] = {}

    async def connect_server(self, server_id: str, command: str,
                             args: List[str] = None, env: Dict = None) -> Dict[str, Any]:
        """الاتصال بخادم MCP جديد."""
        if server_id in self._clients:
            return {"success": False, "error": "الخادم متصل مسبقاً"}

        client = MCPClient(command, args, env)
        result = await client.connect()

        if result.get("success"):
            self._clients[server_id] = client
            return result
        return result

    async def disconnect_server(self, server_id: str):
        """قطع الاتصال بخادم معين."""
        client = self._clients.pop(server_id, None)
        if client:
            await client.disconnect()

    async def disconnect_all(self):
        """قطع كل الاتصالات."""
        for client in self._clients.values():
            await client.disconnect()
        self._clients.clear()

    def get_connected_servers(self) -> List[str]:
        """قائمة الخوادم المتصلة."""
        return list(self._clients.keys())

    async def get_all_tools(self) -> Dict[str, List[Dict]]:
        """جلب كل الأدوات من كل الخوادم المتصلة."""
        all_tools = {}
        for server_id, client in self._clients.items():
            tools = await client.list_tools()
            all_tools[server_id] = tools
        return all_tools

    async def call_tool(self, server_id: str, tool_name: str,
                        arguments: Dict = None) -> Dict[str, Any]:
        """استدعاء أداة من خادم معين."""
        client = self._clients.get(server_id)
        if not client:
            return {"success": False, "error": f"الخادم '{server_id}' غير متصل"}
        return await client.call_tool(tool_name, arguments)

    def get_suggested_servers(self) -> List[Dict]:
        """إرجاع الخوادم المقترحة."""
        return self.SUGGESTED_SERVERS
