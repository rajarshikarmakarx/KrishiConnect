"""
KrishiConnect WebSocket Router
"""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.realtime import manager
from app.auth import decode_token

ws_router = APIRouter(prefix="/ws", tags=["websocket"])


@ws_router.websocket("/centre/{centre_id}")
async def centre_websocket(websocket: WebSocket, centre_id: int):
    """Connect to live queue updates for a specific centre"""
    await manager.connect_centre(websocket, centre_id)
    try:
        while True:
            # Keep connection alive; ping/pong handled by browser
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        manager.disconnect_centre(websocket, centre_id)


@ws_router.websocket("/farmer/{farmer_id}")
async def farmer_websocket(websocket: WebSocket, farmer_id: int, token: str = Query(None)):
    """Connect to personal farmer notifications"""
    if token:
        payload = decode_token(token)
        if not payload or int(payload.get("sub", 0)) != farmer_id:
            await websocket.close(code=4001)
            return

    await manager.connect_farmer(websocket, farmer_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        manager.disconnect_farmer(websocket, farmer_id)


@ws_router.websocket("/admin")
async def admin_websocket(websocket: WebSocket):
    """Connect for admin dashboard real-time updates"""
    await manager.connect_admin(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        manager.disconnect_admin(websocket)
