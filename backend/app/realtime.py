"""
KrishiFlow Real-time Broadcast Engine
Uses WebSocket connections for live queue updates
"""
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by centre_id"""

    def __init__(self):
        # centre_id -> set of WebSocket connections
        self.centre_connections: Dict[int, Set[WebSocket]] = {}
        # Farmer connections: farmer_id -> set of WebSocket connections
        self.farmer_connections: Dict[int, Set[WebSocket]] = {}
        # Admin connections
        self.admin_connections: Set[WebSocket] = set()

    async def connect_centre(self, websocket: WebSocket, centre_id: int):
        await websocket.accept()
        if centre_id not in self.centre_connections:
            self.centre_connections[centre_id] = set()
        self.centre_connections[centre_id].add(websocket)
        logger.info(f"WS connected: centre={centre_id}, total={len(self.centre_connections[centre_id])}")

    async def connect_farmer(self, websocket: WebSocket, farmer_id: int):
        await websocket.accept()
        if farmer_id not in self.farmer_connections:
            self.farmer_connections[farmer_id] = set()
        self.farmer_connections[farmer_id].add(websocket)
        logger.info(f"WS connected: farmer={farmer_id}")

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.add(websocket)

    def disconnect_centre(self, websocket: WebSocket, centre_id: int):
        if centre_id in self.centre_connections:
            self.centre_connections[centre_id].discard(websocket)

    def disconnect_farmer(self, websocket: WebSocket, farmer_id: int):
        if farmer_id in self.farmer_connections:
            self.farmer_connections[farmer_id].discard(websocket)

    def disconnect_admin(self, websocket: WebSocket):
        self.admin_connections.discard(websocket)

    async def broadcast_centre_update(self, centre_id: int, event: dict):
        """Broadcast queue update to all clients watching a centre"""
        message = json.dumps(event)
        dead = set()

        connections = self.centre_connections.get(centre_id, set()).copy()
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.add(connection)

        # Cleanup dead connections
        for conn in dead:
            self.centre_connections[centre_id].discard(conn)

    async def broadcast_farmer_update(self, farmer_id: int, event: dict):
        """Send update to a specific farmer"""
        message = json.dumps(event)
        dead = set()

        connections = self.farmer_connections.get(farmer_id, set()).copy()
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.add(connection)

        for conn in dead:
            self.farmer_connections[farmer_id].discard(conn)

    async def broadcast_admin_update(self, event: dict):
        """Broadcast to all admin connections"""
        message = json.dumps(event)
        dead = set()
        for connection in self.admin_connections.copy():
            try:
                await connection.send_text(message)
            except Exception:
                dead.add(connection)
        for conn in dead:
            self.admin_connections.discard(conn)

    async def broadcast_queue_changed(self, centre_id: int, triggered_by: str = "system"):
        """Main event: queue state changed at a centre"""
        event = {
            "type": "QUEUE_CHANGED",
            "centre_id": centre_id,
            "triggered_by": triggered_by,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.broadcast_centre_update(centre_id, event)
        await self.broadcast_admin_update(event)


manager = ConnectionManager()
