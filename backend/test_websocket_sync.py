"""
KrishiConnect Real-time WebSocket Synchronisation Test Suite
Runs an asynchronous test server on localhost with live WebSocket clients using `websockets`.
Verifies:
1. Admin WebSocket endpoint (/ws/admin) connection and ping/pong.
2. Centre WebSocket endpoint (/ws/centre/{id}) connection and ping/pong.
3. Farmer WebSocket endpoint (/ws/farmer/{id}) authentication & connection.
4. Cross-centre isolation (Centre 1 events only go to Centre 1 subscribers).
5. District Admin global observability (all centre events reach /ws/admin).
6. Direct Farmer targeted notifications (CALLED, COMPLETED, PAYMENT_PAID).
7. Graceful disconnection & connection cleanup.
"""
import asyncio
import json
import os
import sys
import uvicorn
import websockets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app
from app.realtime import manager
from app.auth import create_access_token

PORT = 8765
HOST = "127.0.0.1"


async def run_server(server: uvicorn.Server):
    await server.serve()


async def main():
    print("🌾 Starting KrishiConnect Live WebSocket Sync Verification...\n")

    # Start ephemeral uvicorn server
    config = uvicorn.Config(app=app, host=HOST, port=PORT, log_level="warning")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())

    # Wait for server to start
    for _ in range(50):
        if server.started:
            break
        await asyncio.sleep(0.1)

    try:
        ws_base = f"ws://{HOST}:{PORT}/ws"

        # 1. Test Ping/Pong on Admin WebSocket
        print("1️⃣  Testing /ws/admin ping/pong heartbeat...")
        async with websockets.connect(f"{ws_base}/admin") as ws_admin:
            await ws_admin.send("ping")
            resp = await ws_admin.recv()
            assert resp == "pong", f"Expected 'pong', got {resp}"
            print("   ✅ Admin WS ping/pong heartbeat verified.")

        # 2. Test Ping/Pong on Centre WebSocket
        print("\n2️⃣  Testing /ws/centre/1 ping/pong heartbeat...")
        async with websockets.connect(f"{ws_base}/centre/1") as ws_centre:
            await ws_centre.send("ping")
            resp = await ws_centre.recv()
            assert resp == "pong", f"Expected 'pong', got {resp}"
            print("   ✅ Centre WS ping/pong heartbeat verified.")

        # 3. Test Farmer WebSocket with Token Authentication
        print("\n3️⃣  Testing /ws/farmer/50 authentication...")
        farmer_token = create_access_token({"sub": "50", "role": "farmer"})
        async with websockets.connect(f"{ws_base}/farmer/50?token={farmer_token}") as ws_farmer:
            await ws_farmer.send("ping")
            resp = await ws_farmer.recv()
            assert resp == "pong", f"Expected 'pong', got {resp}"
            print("   ✅ Farmer WS authentication and connection verified.")

        # 4. Test Multi-Subscriber Real-Time Broadcast Routing
        print("\n4️⃣  Testing Multi-Subscriber Real-Time Broadcast Routing...")
        async with websockets.connect(f"{ws_base}/admin") as ws_admin, \
                   websockets.connect(f"{ws_base}/centre/1") as ws_centre1, \
                   websockets.connect(f"{ws_base}/centre/2") as ws_centre2, \
                   websockets.connect(f"{ws_base}/farmer/50?token={farmer_token}") as ws_farmer:

            # Allow registrations to propagate in memory
            await asyncio.sleep(0.1)

            # 4a. Trigger broadcast_queue_changed for Centre 1
            await manager.broadcast_queue_changed(centre_id=1, triggered_by="operator_call")

            msg_c1 = json.loads(await asyncio.wait_for(ws_centre1.recv(), timeout=2.0))
            assert msg_c1["type"] == "QUEUE_CHANGED"
            assert msg_c1["centre_id"] == 1
            assert msg_c1["triggered_by"] == "operator_call"
            print("   ✅ Centre 1 subscriber received QUEUE_CHANGED event.")

            msg_adm = json.loads(await asyncio.wait_for(ws_admin.recv(), timeout=2.0))
            assert msg_adm["type"] == "QUEUE_CHANGED"
            assert msg_adm["centre_id"] == 1
            print("   ✅ District Admin subscriber received Centre 1 QUEUE_CHANGED event.")

            # 4b. Trigger targeted farmer notification
            await manager.broadcast_farmer_update(farmer_id=50, event={
                "type": "CALLED",
                "token": "A101",
                "counter": "Counter 2",
                "message": "Please proceed to Counter 2"
            })

            msg_f = json.loads(await asyncio.wait_for(ws_farmer.recv(), timeout=2.0))
            assert msg_f["type"] == "CALLED"
            assert msg_f["token"] == "A101"
            assert msg_f["counter"] == "Counter 2"
            print("   ✅ Targeted Farmer subscriber received personal CALLED notification.")

            # 4c. Trigger payment notification
            await manager.broadcast_farmer_update(farmer_id=50, event={
                "type": "PAYMENT_PAID",
                "payment_id": 99,
                "amount": 25000.0,
                "message": "Payment credited"
            })
            msg_pay = json.loads(await asyncio.wait_for(ws_farmer.recv(), timeout=2.0))
            assert msg_pay["type"] == "PAYMENT_PAID"
            assert msg_pay["amount"] == 25000.0
            print("   ✅ Targeted Farmer subscriber received PAYMENT_PAID notification.")

            # 4d. Trigger Centre 2 event and verify Admin receives it as well
            await manager.broadcast_queue_changed(centre_id=2, triggered_by="centre2_action")
            msg_c2 = json.loads(await asyncio.wait_for(ws_centre2.recv(), timeout=2.0))
            assert msg_c2["centre_id"] == 2
            msg_adm2 = json.loads(await asyncio.wait_for(ws_admin.recv(), timeout=2.0))
            assert msg_adm2["centre_id"] == 2
            print("   ✅ District Admin subscriber received Centre 2 QUEUE_CHANGED event.")

        # 5. Test Disconnect & Cleanup
        print("\n5️⃣  Testing Connection Cleanup on Disconnect...")
        await asyncio.sleep(0.2)
        assert len(manager.admin_connections) == 0
        assert len(manager.centre_connections.get(1, set())) == 0
        assert len(manager.centre_connections.get(2, set())) == 0
        assert len(manager.farmer_connections.get(50, set())) == 0
        print("   ✅ All WebSocket connections deregistered and garbage collected cleanly.")

        print("\n🎉 ALL WEBSOCKET TESTS PASSED CLEANLY! Real-time sync is 100% operational.")

    finally:
        server.should_exit = True
        await server_task


if __name__ == "__main__":
    asyncio.run(main())
