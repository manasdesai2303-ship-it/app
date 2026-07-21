"""GoldSmith Pro ERP - Backend integration tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://goldsmith-pro-erp.preview.emergentagent.com",
).rstrip("/")

OWNER_EMAIL = "owner@goldsmith.pro"
OWNER_PASSWORD = "Owner@12345"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login-json",
                 json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == OWNER_EMAIL
    return data["access_token"]


@pytest.fixture(scope="session")
def auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Auth ----------------
class TestAuth:
    def test_login_json_success(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login-json",
                     json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
        assert r.status_code == 200
        body = r.json()
        assert body["token_type"] == "bearer"
        assert body["user"]["role"] == "Owner"

    def test_login_json_bad_password(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login-json",
                     json={"email": OWNER_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me(self, api, auth):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth)
        assert r.status_code == 200
        assert r.json()["email"] == OWNER_EMAIL


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_dashboard_shape(self, auth):
        r = requests.get(f"{BASE_URL}/api/dashboard", headers=auth)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["total_clients", "gold_balance", "silver_balance",
                  "diamond_balance", "pending_deliveries",
                  "revenue_chart", "low_stock_count"]:
            assert k in d, f"missing {k}"
        assert isinstance(d["revenue_chart"], list) and len(d["revenue_chart"]) == 6
        assert d["total_clients"] >= 4


# ---------------- Clients ----------------
class TestClients:
    def test_list_clients(self, auth):
        r = requests.get(f"{BASE_URL}/api/clients", headers=auth)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 4
        assert all("id" in c and "name" in c for c in items)

    def test_filter_by_type(self, auth):
        for t in ["Wholesaler", "Retail", "Supplier"]:
            r = requests.get(f"{BASE_URL}/api/clients?type={t}", headers=auth)
            assert r.status_code == 200
            items = r.json()
            assert all(c["type"] == t for c in items), f"filter failed for {t}"

    def test_create_and_get_client(self, auth):
        payload = {
            "name": "TEST_ClientCo",
            "type": "Retail",
            "company": "TEST Co",
            "phone": "+919999999999",
            "email": "test@test.com",
            "address": "Test",
            "gst": "", "pan": "", "notes": "",
        }
        r = requests.post(f"{BASE_URL}/api/clients", headers=auth, json=payload)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]
        # GET single
        r2 = requests.get(f"{BASE_URL}/api/clients/{cid}", headers=auth)
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST_ClientCo"
        # Cleanup
        requests.delete(f"{BASE_URL}/api/clients/{cid}", headers=auth)


# ---------------- Orders ----------------
class TestOrders:
    def test_list_orders_enriched(self, auth):
        r = requests.get(f"{BASE_URL}/api/orders", headers=auth)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        for o in items:
            assert "client_name" in o
            assert "current_stage" in o
            assert "stage_history" in o

    def test_create_order_with_custom_purity_and_image(self, auth):
        clients = requests.get(f"{BASE_URL}/api/clients", headers=auth).json()
        cid = clients[0]["id"]
        b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII="
        payload = {
            "client_id": cid,
            "jewellery_type": "Ring",
            "description": "TEST custom purity order",
            "karat": "22K",
            "custom_purity": 91.6,
            "expected_weight": 10.0,
            "stone_setting_charges": 500,
            "other_charges": 200,
            "labour_rate": 400,
            "design_image": b64,
            "remarks": "TEST",
        }
        r = requests.post(f"{BASE_URL}/api/orders", headers=auth, json=payload)
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["custom_purity"] == 91.6
        assert o["design_image"].startswith("data:image/png;base64,")
        assert o["current_stage"] == "Order Received"
        assert o["status"] == "In Progress"
        oid = o["id"]

        # GET single order returns embedded client
        r2 = requests.get(f"{BASE_URL}/api/orders/{oid}", headers=auth)
        assert r2.status_code == 200
        detail = r2.json()
        assert detail["client"] and detail["client"]["id"] == cid

        # Advance stage
        r3 = requests.post(f"{BASE_URL}/api/orders/{oid}/advance-stage",
                           headers=auth,
                           json={"stage": "Designing", "remarks": "moving forward"})
        assert r3.status_code == 200, r3.text
        adv = r3.json()
        assert adv["current_stage"] == "Designing"
        assert len(adv["stage_history"]) == 2
        assert adv["status"] == "In Progress"

        # Advance to Delivered
        r4 = requests.post(f"{BASE_URL}/api/orders/{oid}/advance-stage",
                           headers=auth,
                           json={"stage": "Delivered"})
        assert r4.status_code == 200
        assert r4.json()["status"] == "Delivered"


# ---------------- Ledgers ----------------
class TestLedgers:
    def _client_id(self, auth):
        return requests.get(f"{BASE_URL}/api/clients", headers=auth).json()[0]["id"]

    def test_gold_entry_auto_purity(self, auth):
        cid = self._client_id(auth)
        r = requests.post(f"{BASE_URL}/api/gold-entries", headers=auth, json={
            "client_id": cid, "karat": "22K", "gross_weight": 10.0,
            "stone_weight": 0.5, "received": 10.0, "remarks": "TEST auto",
        })
        assert r.status_code == 200, r.text
        e = r.json()
        # 22K -> 22/24 = 0.9166..; net = 9.5 -> fine ~= 8.708
        assert abs(e["fine_gold"] - round(9.5 * (22 / 24), 4)) < 0.01
        assert abs(e["purity"] - round((22 / 24) * 100, 2)) < 0.1

    def test_gold_entry_custom_purity(self, auth):
        cid = self._client_id(auth)
        r = requests.post(f"{BASE_URL}/api/gold-entries", headers=auth, json={
            "client_id": cid, "karat": "22K", "purity": 91.6,
            "gross_weight": 10.0, "stone_weight": 0.0, "received": 10.0,
        })
        assert r.status_code == 200
        e = r.json()
        assert abs(e["fine_gold"] - round(10.0 * 0.916, 4)) < 0.01
        assert e["purity"] == 91.6

    def test_silver_diamond_gemstone_cash(self, auth):
        cid = self._client_id(auth)
        r = requests.post(f"{BASE_URL}/api/silver-entries", headers=auth, json={
            "client_id": cid, "purity": 92.5, "weight": 20.0, "received": 20.0})
        assert r.status_code == 200
        r = requests.post(f"{BASE_URL}/api/diamond-entries", headers=auth, json={
            "client_id": cid, "diamond_type": "Round", "carat": 0.3,
            "pieces": 4, "weight": 1.2, "received": 1.2, "cost": 15000})
        assert r.status_code == 200
        r = requests.post(f"{BASE_URL}/api/gemstone-entries", headers=auth, json={
            "client_id": cid, "stone_type": "Ruby", "pieces": 2,
            "weight": 0.8, "received": 0.8, "cost": 5000})
        assert r.status_code == 200
        r = requests.post(f"{BASE_URL}/api/cash-entries", headers=auth, json={
            "client_id": cid, "type": "advance", "amount": 5000, "method": "UPI"})
        assert r.status_code == 200

    def test_ledger_filters(self, auth):
        cid = self._client_id(auth)
        for ep in ["gold-entries", "silver-entries", "diamond-entries",
                   "gemstone-entries", "cash-entries"]:
            r = requests.get(f"{BASE_URL}/api/{ep}?client_id={cid}", headers=auth)
            assert r.status_code == 200, ep
            items = r.json()
            assert all(it["client_id"] == cid for it in items), ep


# ---------------- Invoices ----------------
class TestInvoices:
    def test_create_invoice_math(self, auth):
        cid = requests.get(f"{BASE_URL}/api/clients", headers=auth).json()[0]["id"]
        r = requests.post(f"{BASE_URL}/api/invoices", headers=auth, json={
            "client_id": cid, "labour_charges": 1000,
            "stone_setting_charges": 500, "other_charges": 100, "gst_percent": 3.0,
        })
        assert r.status_code == 200, r.text
        inv = r.json()
        assert inv["subtotal"] == 1600
        assert inv["gst_amount"] == round(1600 * 0.03, 2)
        assert inv["total"] == round(1600 + inv["gst_amount"], 2)
        assert inv["status"] == "Unpaid"


# ---------------- Inventory ----------------
class TestInventory:
    def test_inventory_low_stock_flag(self, auth):
        r = requests.get(f"{BASE_URL}/api/inventory", headers=auth)
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        for it in items:
            assert "low_stock" in it
            assert it["low_stock"] == (it["stock"] <= it.get("low_stock_alert", 0))


# ---------------- Notifications ----------------
class TestNotifications:
    def test_notifications(self, auth):
        r = requests.get(f"{BASE_URL}/api/notifications", headers=auth)
        assert r.status_code == 200
        notes = r.json()
        assert isinstance(notes, list)
        types = {n["type"] for n in notes}
        # Expect at least pending_payment or low_stock in seeded env
        assert types.issubset({"overdue_order", "pending_payment", "low_stock"})


# ---------------- Search ----------------
class TestSearch:
    def test_search_kalyan(self, auth):
        r = requests.get(f"{BASE_URL}/api/search?q=Kalyan", headers=auth)
        assert r.status_code == 200
        res = r.json()
        assert any("Kalyan" in c["name"] for c in res["clients"])


# ---------------- Karigars ----------------
class TestKarigars:
    def test_list_karigars_enriched(self, auth):
        r = requests.get(f"{BASE_URL}/api/karigars", headers=auth)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 3
        for k in items:
            for f in ["work_assigned", "work_completed", "material_balance"]:
                assert f in k
