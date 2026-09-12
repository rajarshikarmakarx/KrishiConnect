"""
KrishiConnect Real-time Broadcast Engine (Redis Pub/Sub Enabled)
Supports multi-worker horizontal scaling across Uvicorn processes and Docker instances,
with automatic cache invalidation on queue changes.
"""
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Set, Optional
from fastapi import WebSocket
from app.redis_client import redis_manager

logger = logging.getLogger("krishiconnect.realtime")

REDIS_CHANNEL_CENTRE_PREFIX = "krishi:events:centre:"
REDIS_CHANNEL_FARMER_PREFIX = "krishi:events:farmer:"
REDIS_CHANNEL_ADMIN = "krishi:events:admin"


class ConnectionManager:
    """Manages local WebSocket connections and synchronizes across nodes using Redis Pub/Sub."""

    def __init__(self):
        # centre_id -> set of WebSocket connections
        self.centre_connections: Dict[int, Set[WebSocket]] = {}
        # farmer_id -> set of WebSocket connections
        self.farmer_connections: Dict[int, Set[WebSocket]] = {}
        # Admin connections
        self.admin_connections: Set[WebSocket] = set()
        self._listener_task: Optional[asyncio.Task] = None

    async def start_pubsub_listener(self):
        """Background coroutine listening to Redis Pub/Sub channels and routing to local sockets."""
        if not redis_manager.is_available:
            logger.info("ℹ️ Standalone local WebSocket broadcaster active (Redis Pub/Sub not connected).")
            return

        try:
            pubsub = redis_manager.redis.pubsub()
            await pubsub.psubscribe("krishi:events:*")
            logger.info("📡 Subscribed to Redis Pub/Sub channel pattern: krishi:events:*")

            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message.get("type") == "pmessage":
                    channel = message.get("channel", "")
                    raw_data = message.get("data", "")
                    try:
                        event = json.loads(raw_data) if isinstance(raw_data, str) else raw_data

                        if channel.startswith(REDIS_CHANNEL_CENTRE_PREFIX):
                            centre_id_str = channel.replace(REDIS_CHANNEL_CENTRE_PREFIX, "")
                            if centre_id_str.isdigit():
                                await self._local_broadcast_centre(int(centre_id_str), event)
                        elif channel.startswith(REDIS_CHANNEL_FARMER_PREFIX):
                            farmer_id_str = channel.replace(REDIS_CHANNEL_FARMER_PREFIX, "")
                            if farmer_id_str.isdigit():
                                await self._local_broadcast_farmer(int(farmer_id_str), event)
                        elif channel == REDIS_CHANNEL_ADMIN:
                            await self._local_broadcast_admin(event)
                    except Exception as ex:
                        logger.error("Error processing Redis pub/sub message on %s: %s", channel, ex)

                await asyncio.sleep(0.01)
        except asyncio.CancelledError:
            logger.info("Redis Pub/Sub listener cancelled on shutdown.")
        except Exception as e:
            logger.error("Error in Redis Pub/Sub listener loop: %s", e)

    async def connect_centre(self, websocket: WebSocket, centre_id: int):
        await websocket.accept()
        if centre_id not in self.centre_connections:
            self.centre_connections[centre_id] = set()
        self.centre_connections[centre_id].add(websocket)
        logger.info(f"WS connected: centre={centre_id}, local_total={len(self.centre_connections[centre_id])}")

    async def connect_farmer(self, websocket: WebSocket, farmer_id: int):
        await websocket.accept()
        if farmer_id not in self.farmer_connections:
            self.farmer_connections[farmer_id] = set()
        self.farmer_connections[farmer_id].add(websocket)
        logger.info(f"WS connected: farmer={farmer_id}")

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.add(websocket)
        logger.info(f"WS connected: admin, local_total={len(self.admin_connections)}")

    def disconnect_centre(self, websocket: WebSocket, centre_id: int):
        if centre_id in self.centre_connections:
            self.centre_connections[centre_id].discard(websocket)

    def disconnect_farmer(self, websocket: WebSocket, farmer_id: int):
        if farmer_id in self.farmer_connections:
            self.farmer_connections[farmer_id].discard(websocket)

    def disconnect_admin(self, websocket: WebSocket):
        self.admin_connections.discard(websocket)

    async def _local_broadcast_centre(self, centre_id: int, event: dict):
        """Send message to local WebSocket connections for a centre."""
        message = json.dumps(event)
        dead = set()
        connections = self.centre_connections.get(centre_id, set()).copy()
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.add(connection)

        for conn in dead:
            self.centre_connections[centre_id].discard(conn)

    async def _local_broadcast_farmer(self, farmer_id: int, event: dict):
        """Send message to local WebSocket connections for a farmer."""
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

    async def _local_broadcast_admin(self, event: dict):
        """Send message to local admin WebSocket connections."""
        message = json.dumps(event)
        dead = set()
        for connection in self.admin_connections.copy():
            try:
                await connection.send_text(message)
            except Exception:
                dead.add(connection)
        for conn in dead:
            self.admin_connections.discard(conn)

    async def broadcast_centre_update(self, centre_id: int, event: dict):
        """Broadcast queue update to centre subscribers (local and distributed via Redis)."""
        # Always deliver to local workers immediately for zero local latency
        await self._local_broadcast_centre(centre_id, event)
        # Publish to Redis so other worker processes receive it
        if redis_manager.is_available:
            await redis_manager.publish(f"{REDIS_CHANNEL_CENTRE_PREFIX}{centre_id}", event)

    async def broadcast_farmer_update(self, farmer_id: int, event: dict):
        """Send update to a specific farmer (local and distributed via Redis)."""
        await self._local_broadcast_farmer(farmer_id, event)
        if redis_manager.is_available:
            await redis_manager.publish(f"{REDIS_CHANNEL_FARMER_PREFIX}{farmer_id}", event)

    async def broadcast_admin_update(self, event: dict):
        """Broadcast to all admin connections (local and distributed via Redis)."""
        await self._local_broadcast_admin(event)
        if redis_manager.is_available:
            await redis_manager.publish(REDIS_CHANNEL_ADMIN, event)

    async def broadcast_queue_changed(self, centre_id: int, triggered_by: str = "system"):
        """
        Main event: queue state changed at a centre.
        1. Invalidate hot Redis caches for fast freshness.
        2. Broadcast event across WebSockets.
        """
        if redis_manager.is_available:
            # Invalidate cached centre stats, lists, district analytics, and AI estimates
            await redis_manager.delete(
                f"centre:stats:{centre_id}",
                f"centre:detail:{centre_id}",
                "analytics:district",
                "analytics:impact",
                f"ai:eta:{centre_id}"
            )
            await redis_manager.delete_pattern("centres:list:*")
            await redis_manager.delete_pattern("ai:recommend:*")

        event = {
            "type": "QUEUE_CHANGED",
            "centre_id": centre_id,
            "triggered_by": triggered_by,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.broadcast_centre_update(centre_id, event)
        await self.broadcast_admin_update(event)


manager = ConnectionManager()
