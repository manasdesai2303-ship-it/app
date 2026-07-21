"""GoldSmith Pro ERP - FastAPI Backend."""
import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Annotated, List, Optional, Literal

import jwt
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pwdlib import PasswordHash
from pydantic import BaseModel, EmailStr, Field
from pymongo import ASCENDING

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET", "goldsmith-pro-erp-super-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "owner@goldsmith.pro")
OWNER_PASSWORD = os.environ.get("OWNER_PASSWORD", "Owner@12345")
OWNER_NAME = os.environ.get("OWNER_NAME", "Rajesh Sharma")

password_hash = PasswordHash.recommended()
DUMMY_HASH = password_hash.hash("dummypassword")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="GoldSmith Pro ERP")
api = APIRouter(prefix="/api")

# ---------- Enums ----------
class Role(str, Enum):
    Owner = "Owner"
    Manager = "Manager"
    Staff = "Staff"
    Karigar = "Karigar"
    Client = "Client"


class ClientType(str, Enum):
    Wholesaler = "Wholesaler"
    Retail = "Retail"
    Supplier = "Supplier"


class Stage(str, Enum):
    OrderReceived = "Order Received"
    Designing = "Designing"
    CADApproval = "CAD Approval"
    Casting = "Casting"
    Filing = "Filing"
    PrePolish = "Pre Polish"
    StoneSetting = "Stone Setting"
    FinalPolish = "Final Polish"
    QualityCheck = "Quality Check"
    Packing = "Packing"
    Ready = "Ready"
    Delivered = "Delivered"


STAGES = [s.value for s in Stage]


# ---------- Models ----------
def now_utc():
    return datetime.now(timezone.utc)


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: Role = Role.Staff


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ClientIn(BaseModel):
    name: str
    type: ClientType = ClientType.Wholesaler
    company: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    gst: Optional[str] = ""
    pan: Optional[str] = ""
    notes: Optional[str] = ""


class KarigarIn(BaseModel):
    name: str
    phone: Optional[str] = ""
    address: Optional[str] = ""
    speciality: Optional[str] = ""
    labour_rate: float = 0.0  # per gram


class OrderIn(BaseModel):
    client_id: str
    jewellery_type: str  # Ring, Pendant, Chain, Necklace, Bracelet, Bangle, Earrings, Custom
    description: Optional[str] = ""
    karat: str = "22K"  # 9K..24K
    custom_purity: Optional[float] = None  # optional percentage override
    expected_weight: float = 0.0
    stone_setting_charges: float = 0.0
    other_charges: float = 0.0
    labour_rate: float = 0.0
    expected_delivery: Optional[str] = None
    design_image: Optional[str] = ""  # base64 or url
    karigar_id: Optional[str] = None
    remarks: Optional[str] = ""


class OrderStageUpdate(BaseModel):
    stage: Stage
    karigar_id: Optional[str] = None
    remarks: Optional[str] = ""


class GoldEntryIn(BaseModel):
    client_id: str
    order_id: Optional[str] = None
    karat: str = "22K"
    purity: Optional[float] = None  # percentage
    gross_weight: float = 0.0
    stone_weight: float = 0.0
    received: float = 0.0
    issued: float = 0.0
    returned: float = 0.0
    wastage: float = 0.0
    recovery: float = 0.0
    remarks: Optional[str] = ""


class SilverEntryIn(BaseModel):
    client_id: str
    order_id: Optional[str] = None
    purity: float = 92.5
    weight: float = 0.0
    received: float = 0.0
    issued: float = 0.0
    returned: float = 0.0
    remarks: Optional[str] = ""


class DiamondEntryIn(BaseModel):
    client_id: str
    order_id: Optional[str] = None
    diamond_type: str = "Round"
    carat: float = 0.0
    pieces: int = 0
    weight: float = 0.0
    received: float = 0.0
    issued: float = 0.0
    returned: float = 0.0
    cost: float = 0.0
    remarks: Optional[str] = ""


class GemstoneEntryIn(BaseModel):
    client_id: str
    order_id: Optional[str] = None
    stone_type: str = ""
    pieces: int = 0
    weight: float = 0.0
    received: float = 0.0
    issued: float = 0.0
    returned: float = 0.0
    cost: float = 0.0
    remarks: Optional[str] = ""


class CashEntryIn(BaseModel):
    client_id: str
    order_id: Optional[str] = None
    type: Literal["advance", "payment", "invoice", "refund"] = "payment"
    amount: float = 0.0
    method: Optional[str] = "Cash"  # Cash, Bank, UPI, Cheque
    remarks: Optional[str] = ""


class InvoiceIn(BaseModel):
    client_id: str
    order_id: Optional[str] = None
    labour_charges: float = 0.0
    stone_setting_charges: float = 0.0
    other_charges: float = 0.0
    gst_percent: float = 3.0
    due_date: Optional[str] = None
    notes: Optional[str] = ""


class InventoryItemIn(BaseModel):
    category: str  # Gold, Silver, Diamond, Gemstone, Finding, Chain, Lock, Packaging
    name: str
    unit: str = "gram"
    stock: float = 0.0
    low_stock_alert: float = 0.0
    cost: float = 0.0
    remarks: Optional[str] = ""


# ---------- Auth Helpers ----------
def create_token(email: str, role: str) -> str:
    payload = {
        "sub": email,
        "role": role,
        "iat": now_utc(),
        "exp": now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def user_public(u: dict) -> UserOut:
    return UserOut(id=u["id"], name=u["name"], email=u["email"], role=u["role"])


async def get_user_by_email(email: str):
    return await db.users.find_one({"email": email.lower()}, {"_id": 0})


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    exc = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise exc
    except jwt.InvalidTokenError:
        raise exc
    u = await get_user_by_email(email)
    if not u:
        raise exc
    return u


CurrentUser = Annotated[dict, Depends(get_current_user)]


# ---------- Business Helpers ----------
def karat_to_purity(karat: str) -> float:
    """Map karat label -> purity fraction (0-1)."""
    try:
        k = int(karat.replace("K", "").strip())
    except Exception:
        k = 22
    return round(k / 24.0, 6)


def compute_fine_gold(gross: float, stone: float, karat: str, purity_pct: Optional[float]) -> dict:
    net = max(0.0, gross - stone)
    if purity_pct is not None and purity_pct > 0:
        pf = purity_pct / 100.0
    else:
        pf = karat_to_purity(karat)
    fine = round(net * pf, 4)
    return {"net_weight": round(net, 4), "purity_fraction": pf, "fine_gold": fine}


def make_order_number() -> str:
    return "GSO-" + datetime.now().strftime("%y%m%d") + "-" + uuid.uuid4().hex[:5].upper()


def make_invoice_number() -> str:
    return "INV-" + datetime.now().strftime("%y%m%d") + "-" + uuid.uuid4().hex[:5].upper()


# ---------- Startup: indexes + seed ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index([("email", ASCENDING)], unique=True)
    await db.clients.create_index([("name", ASCENDING)])
    await db.orders.create_index([("order_number", ASCENDING)], unique=True)
    await db.orders.create_index([("client_id", ASCENDING)])
    for col in ("gold_entries", "silver_entries", "diamond_entries",
                "gemstone_entries", "cash_entries", "invoices"):
        await db[col].create_index([("client_id", ASCENDING), ("created_at", ASCENDING)])

    # Seed Owner (idempotent)
    await db.users.update_one(
        {"email": OWNER_EMAIL.lower()},
        {"$setOnInsert": {
            "id": str(uuid.uuid4()),
            "name": OWNER_NAME,
            "email": OWNER_EMAIL.lower(),
            "password_hash": password_hash.hash(OWNER_PASSWORD),
            "role": Role.Owner.value,
            "created_at": now_utc(),
        }},
        upsert=True,
    )
    # Seed demo data if empty
    if await db.clients.count_documents({}) == 0:
        await seed_demo_data()


async def seed_demo_data():
    """Seed a rich, realistic demo dataset."""
    logger.info("Seeding demo data...")
    # Karigars
    karigars = [
        {"id": str(uuid.uuid4()), "name": "Suresh Kumar", "phone": "+919812345601",
         "address": "Zaveri Bazaar, Mumbai", "speciality": "Stone Setting", "labour_rate": 450.0,
         "gold_issued": 0.0, "gold_returned": 0.0, "created_at": now_utc()},
        {"id": str(uuid.uuid4()), "name": "Manoj Verma", "phone": "+919812345602",
         "address": "Karol Bagh, Delhi", "speciality": "Casting & Filing", "labour_rate": 380.0,
         "gold_issued": 0.0, "gold_returned": 0.0, "created_at": now_utc()},
        {"id": str(uuid.uuid4()), "name": "Ramesh Bhai", "phone": "+919812345603",
         "address": "Rajkot, Gujarat", "speciality": "Polishing", "labour_rate": 320.0,
         "gold_issued": 0.0, "gold_returned": 0.0, "created_at": now_utc()},
    ]
    await db.karigars.insert_many([k.copy() for k in karigars])

    # Clients
    clients = [
        {"id": str(uuid.uuid4()), "name": "Kalyan Jewellers", "type": "Wholesaler",
         "company": "Kalyan Jewellers Pvt Ltd", "phone": "+919820011111",
         "email": "purchase@kalyan.com", "address": "T. Nagar, Chennai",
         "gst": "33AABCK1234R1Z5", "pan": "AABCK1234R", "notes": "Priority wholesale client",
         "created_at": now_utc()},
        {"id": str(uuid.uuid4()), "name": "Tanishq Retail", "type": "Wholesaler",
         "company": "Titan Company Ltd", "phone": "+919820022222",
         "email": "orders@tanishq.co.in", "address": "Bengaluru",
         "gst": "29AAACT2727Q1ZQ", "pan": "AAACT2727Q", "notes": "Monthly bulk orders",
         "created_at": now_utc()},
        {"id": str(uuid.uuid4()), "name": "Priya Mehta", "type": "Retail",
         "company": "", "phone": "+919820033333", "email": "priya@example.com",
         "address": "Andheri West, Mumbai", "gst": "", "pan": "AXPPM1234K",
         "notes": "Bridal collection order", "created_at": now_utc()},
        {"id": str(uuid.uuid4()), "name": "MMTC-PAMP Refinery", "type": "Supplier",
         "company": "MMTC-PAMP India Pvt Ltd", "phone": "+911244567890",
         "email": "sales@mmtcpamp.com", "address": "Nemrana, Rajasthan",
         "gst": "08AABCM5678P1Z3", "pan": "AABCM5678P", "notes": "99.99 fine gold supplier",
         "created_at": now_utc()},
    ]
    await db.clients.insert_many([c.copy() for c in clients])

    # Orders + stages
    sample_orders = [
        {"client_idx": 0, "type": "Necklace", "karat": "22K", "wt": 45.0,
         "stage_idx": 6, "stone": 8000, "other": 2500, "lrate": 380},
        {"client_idx": 1, "type": "Ring", "karat": "18K", "wt": 6.5,
         "stage_idx": 3, "stone": 1200, "other": 500, "lrate": 420},
        {"client_idx": 2, "type": "Bangle", "karat": "22K", "wt": 22.0,
         "stage_idx": 9, "stone": 0, "other": 800, "lrate": 350},
        {"client_idx": 0, "type": "Earrings", "karat": "18K", "wt": 8.0,
         "stage_idx": 11, "stone": 3500, "other": 400, "lrate": 400},
    ]
    orders_docs = []
    for i, o in enumerate(sample_orders):
        client_id = clients[o["client_idx"]]["id"]
        karigar_id = karigars[i % len(karigars)]["id"]
        stage_history = []
        for si in range(o["stage_idx"] + 1):
            stage_history.append({
                "stage": STAGES[si],
                "karigar_id": karigar_id if si >= 3 else None,
                "started_at": (now_utc() - timedelta(days=(o["stage_idx"] - si))).isoformat(),
                "completed_at": (now_utc() - timedelta(days=max(0, (o["stage_idx"] - si) - 1))).isoformat() if si < o["stage_idx"] else None,
                "remarks": "",
            })
        orders_docs.append({
            "id": str(uuid.uuid4()),
            "order_number": make_order_number() + f"-{i}",
            "client_id": client_id,
            "jewellery_type": o["type"],
            "description": f"Custom {o['type'].lower()} order",
            "karat": o["karat"],
            "expected_weight": o["wt"],
            "stone_setting_charges": o["stone"],
            "other_charges": o["other"],
            "labour_rate": o["lrate"],
            "expected_delivery": (now_utc() + timedelta(days=10)).isoformat(),
            "design_image": "",
            "karigar_id": karigar_id,
            "current_stage": STAGES[o["stage_idx"]],
            "stage_history": stage_history,
            "remarks": "",
            "status": "Delivered" if o["stage_idx"] == 11 else "In Progress",
            "created_at": now_utc(),
        })
    await db.orders.insert_many([d.copy() for d in orders_docs])

    # Gold entries
    for od in orders_docs:
        fine = compute_fine_gold(od["expected_weight"] + 2.0, 2.0, od["karat"], None)
        await db.gold_entries.insert_one({
            "id": str(uuid.uuid4()),
            "client_id": od["client_id"],
            "order_id": od["id"],
            "karat": od["karat"],
            "purity": round(fine["purity_fraction"] * 100, 2),
            "gross_weight": od["expected_weight"] + 2.0,
            "stone_weight": 2.0,
            "net_weight": fine["net_weight"],
            "fine_gold": fine["fine_gold"],
            "received": od["expected_weight"] + 2.0,
            "issued": 0.0,
            "returned": 0.0,
            "wastage": 0.15,
            "recovery": 0.0,
            "remarks": "Client supplied gold",
            "created_at": now_utc(),
        })

    # Silver entry
    await db.silver_entries.insert_one({
        "id": str(uuid.uuid4()), "client_id": clients[2]["id"], "order_id": None,
        "purity": 92.5, "weight": 50.0, "received": 50.0, "issued": 0.0, "returned": 0.0,
        "remarks": "Sterling silver bar", "created_at": now_utc(),
    })
    # Diamond entry
    await db.diamond_entries.insert_one({
        "id": str(uuid.uuid4()), "client_id": clients[0]["id"], "order_id": orders_docs[0]["id"],
        "diamond_type": "Round Brilliant", "carat": 0.25, "pieces": 12,
        "weight": 3.0, "received": 3.0, "issued": 3.0, "returned": 0.0,
        "cost": 45000.0, "remarks": "VVS1/EF", "created_at": now_utc(),
    })

    # Invoices + payments
    for od in orders_docs[:3]:
        labour = round(od["expected_weight"] * od["labour_rate"], 2)
        subtotal = labour + od["stone_setting_charges"] + od["other_charges"]
        gst = round(subtotal * 0.03, 2)
        total = round(subtotal + gst, 2)
        inv_id = str(uuid.uuid4())
        await db.invoices.insert_one({
            "id": inv_id, "invoice_number": make_invoice_number(),
            "client_id": od["client_id"], "order_id": od["id"],
            "labour_charges": labour, "stone_setting_charges": od["stone_setting_charges"],
            "other_charges": od["other_charges"], "gst_percent": 3.0, "gst_amount": gst,
            "subtotal": subtotal, "total": total, "paid": total * 0.4 if od["status"] != "Delivered" else total,
            "balance": total * 0.6 if od["status"] != "Delivered" else 0.0,
            "due_date": (now_utc() + timedelta(days=15)).isoformat(),
            "status": "Paid" if od["status"] == "Delivered" else "Partial",
            "notes": "", "created_at": now_utc(),
        })
        await db.cash_entries.insert_one({
            "id": str(uuid.uuid4()), "client_id": od["client_id"], "order_id": od["id"],
            "type": "advance", "amount": total * 0.4, "method": "Bank",
            "remarks": "Advance received", "created_at": now_utc() - timedelta(days=5),
        })

    # Inventory
    inventory = [
        {"category": "Gold", "name": "22K Gold Bar", "unit": "gram", "stock": 850.5, "low_stock_alert": 200, "cost": 6800},
        {"category": "Gold", "name": "18K Gold Grain", "unit": "gram", "stock": 320.0, "low_stock_alert": 150, "cost": 5500},
        {"category": "Silver", "name": "Sterling Silver 925", "unit": "gram", "stock": 1200.0, "low_stock_alert": 500, "cost": 78},
        {"category": "Diamond", "name": "Round VVS1", "unit": "carat", "stock": 15.5, "low_stock_alert": 5, "cost": 220000},
        {"category": "Gemstone", "name": "Emerald", "unit": "carat", "stock": 8.0, "low_stock_alert": 3, "cost": 25000},
        {"category": "Finding", "name": "18K Jump Rings", "unit": "piece", "stock": 45, "low_stock_alert": 100, "cost": 120},
        {"category": "Chain", "name": "18K Rope Chain", "unit": "gram", "stock": 180.0, "low_stock_alert": 50, "cost": 5500},
        {"category": "Lock", "name": "S-Lock 18K", "unit": "piece", "stock": 8, "low_stock_alert": 20, "cost": 850},
        {"category": "Packaging", "name": "Velvet Ring Box", "unit": "piece", "stock": 250, "low_stock_alert": 50, "cost": 45},
    ]
    await db.inventory.insert_many([{"id": str(uuid.uuid4()), "created_at": now_utc(), **i} for i in inventory])
    logger.info("Demo data seeded.")


# ---------- Auth routes ----------
@api.post("/auth/register", response_model=UserOut)
async def register(data: RegisterIn):
    if await get_user_by_email(data.email):
        raise HTTPException(409, "Email already registered")
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email.lower(),
        "password_hash": password_hash.hash(data.password),
        "role": data.role.value,
        "created_at": now_utc(),
    }
    await db.users.insert_one(doc)
    return user_public(doc)


@api.post("/auth/login", response_model=TokenOut)
async def login_form(form: Annotated[OAuth2PasswordRequestForm, Depends()]):
    u = await get_user_by_email(form.username)
    if not u or not password_hash.verify(form.password, u["password_hash"]):
        if not u:
            password_hash.verify(form.password, DUMMY_HASH)
        raise HTTPException(401, "Incorrect email or password")
    token = create_token(u["email"], u["role"])
    return TokenOut(access_token=token, user=user_public(u))


@api.post("/auth/login-json", response_model=TokenOut)
async def login_json(data: LoginIn):
    u = await get_user_by_email(data.email)
    if not u or not password_hash.verify(data.password, u["password_hash"]):
        if not u:
            password_hash.verify(data.password, DUMMY_HASH)
        raise HTTPException(401, "Incorrect email or password")
    token = create_token(u["email"], u["role"])
    return TokenOut(access_token=token, user=user_public(u))


@api.get("/auth/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user_public(user)


# ---------- Clients ----------
@api.get("/clients")
async def list_clients(user: CurrentUser, type: Optional[ClientType] = None, q: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type.value
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"company": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
        ]
    items = await db.clients.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api.post("/clients")
async def create_client(data: ClientIn, user: CurrentUser):
    doc = {"id": str(uuid.uuid4()), "created_at": now_utc(), **data.model_dump()}
    doc["type"] = data.type.value
    await db.clients.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/clients/{cid}")
async def get_client(cid: str, user: CurrentUser):
    c = await db.clients.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Client not found")
    return c


@api.put("/clients/{cid}")
async def update_client(cid: str, data: ClientIn, user: CurrentUser):
    payload = data.model_dump()
    payload["type"] = data.type.value
    r = await db.clients.update_one({"id": cid}, {"$set": payload})
    if r.matched_count == 0:
        raise HTTPException(404, "Client not found")
    return await db.clients.find_one({"id": cid}, {"_id": 0})


@api.delete("/clients/{cid}")
async def delete_client(cid: str, user: CurrentUser):
    await db.clients.delete_one({"id": cid})
    return {"ok": True}


# ---------- Karigars ----------
@api.get("/karigars")
async def list_karigars(user: CurrentUser):
    items = await db.karigars.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Enrich with material balance
    for k in items:
        assigned = await db.orders.count_documents({"karigar_id": k["id"], "status": "In Progress"})
        completed = await db.orders.count_documents({"karigar_id": k["id"], "status": "Delivered"})
        k["work_assigned"] = assigned
        k["work_completed"] = completed
        k["material_balance"] = round(k.get("gold_issued", 0) - k.get("gold_returned", 0), 4)
    return items


@api.post("/karigars")
async def create_karigar(data: KarigarIn, user: CurrentUser):
    doc = {"id": str(uuid.uuid4()), "created_at": now_utc(),
           "gold_issued": 0.0, "gold_returned": 0.0, **data.model_dump()}
    await db.karigars.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/karigars/{kid}")
async def get_karigar(kid: str, user: CurrentUser):
    k = await db.karigars.find_one({"id": kid}, {"_id": 0})
    if not k:
        raise HTTPException(404, "Not found")
    orders = await db.orders.find({"karigar_id": kid}, {"_id": 0}).to_list(200)
    k["orders"] = orders
    k["material_balance"] = round(k.get("gold_issued", 0) - k.get("gold_returned", 0), 4)
    return k


# ---------- Orders ----------
@api.get("/orders")
async def list_orders(user: CurrentUser, client_id: Optional[str] = None,
                      status_filter: Optional[str] = Query(None, alias="status"),
                      q: Optional[str] = None):
    query = {}
    if client_id:
        query["client_id"] = client_id
    if status_filter:
        query["status"] = status_filter
    if q:
        query["$or"] = [
            {"order_number": {"$regex": q, "$options": "i"}},
            {"jewellery_type": {"$regex": q, "$options": "i"}},
        ]
    items = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Enrich with client name
    for o in items:
        c = await db.clients.find_one({"id": o["client_id"]}, {"_id": 0, "name": 1})
        o["client_name"] = c["name"] if c else "Unknown"
    return items


@api.post("/orders")
async def create_order(data: OrderIn, user: CurrentUser):
    order_id = str(uuid.uuid4())
    doc = {
        "id": order_id,
        "order_number": make_order_number(),
        "current_stage": Stage.OrderReceived.value,
        "stage_history": [{
            "stage": Stage.OrderReceived.value,
            "karigar_id": data.karigar_id,
            "started_at": now_utc().isoformat(),
            "completed_at": None,
            "remarks": "",
        }],
        "status": "In Progress",
        "created_at": now_utc(),
        **data.model_dump(),
    }
    await db.orders.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/orders/{oid}")
async def get_order(oid: str, user: CurrentUser):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    c = await db.clients.find_one({"id": o["client_id"]}, {"_id": 0})
    o["client"] = c
    if o.get("karigar_id"):
        k = await db.karigars.find_one({"id": o["karigar_id"]}, {"_id": 0})
        o["karigar"] = k
    return o


@api.post("/orders/{oid}/advance-stage")
async def advance_stage(oid: str, data: OrderStageUpdate, user: CurrentUser):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    now_iso = now_utc().isoformat()
    history = o.get("stage_history", [])
    # complete current stage
    if history:
        history[-1]["completed_at"] = now_iso
    history.append({
        "stage": data.stage.value,
        "karigar_id": data.karigar_id or o.get("karigar_id"),
        "started_at": now_iso,
        "completed_at": now_iso if data.stage == Stage.Delivered else None,
        "remarks": data.remarks or "",
    })
    new_status = "Delivered" if data.stage == Stage.Delivered else "In Progress"
    await db.orders.update_one(
        {"id": oid},
        {"$set": {"current_stage": data.stage.value,
                  "stage_history": history,
                  "status": new_status,
                  "karigar_id": data.karigar_id or o.get("karigar_id")}}
    )
    return await db.orders.find_one({"id": oid}, {"_id": 0})


# ---------- Ledger entries generic ----------
async def _add_gold(data: GoldEntryIn):
    fine = compute_fine_gold(data.gross_weight, data.stone_weight, data.karat, data.purity)
    doc = {
        "id": str(uuid.uuid4()),
        "created_at": now_utc(),
        **data.model_dump(),
        "net_weight": fine["net_weight"],
        "fine_gold": fine["fine_gold"],
    }
    if data.purity is None:
        doc["purity"] = round(fine["purity_fraction"] * 100, 2)
    await db.gold_entries.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.post("/gold-entries")
async def add_gold(data: GoldEntryIn, user: CurrentUser):
    return await _add_gold(data)


@api.get("/gold-entries")
async def list_gold(user: CurrentUser, client_id: Optional[str] = None):
    q = {"client_id": client_id} if client_id else {}
    items = await db.gold_entries.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Compute running balance per karat
    return items


@api.post("/silver-entries")
async def add_silver(data: SilverEntryIn, user: CurrentUser):
    doc = {"id": str(uuid.uuid4()), "created_at": now_utc(), **data.model_dump()}
    await db.silver_entries.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/silver-entries")
async def list_silver(user: CurrentUser, client_id: Optional[str] = None):
    q = {"client_id": client_id} if client_id else {}
    return await db.silver_entries.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.post("/diamond-entries")
async def add_diamond(data: DiamondEntryIn, user: CurrentUser):
    doc = {"id": str(uuid.uuid4()), "created_at": now_utc(), **data.model_dump()}
    await db.diamond_entries.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/diamond-entries")
async def list_diamond(user: CurrentUser, client_id: Optional[str] = None):
    q = {"client_id": client_id} if client_id else {}
    return await db.diamond_entries.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.post("/gemstone-entries")
async def add_gemstone(data: GemstoneEntryIn, user: CurrentUser):
    doc = {"id": str(uuid.uuid4()), "created_at": now_utc(), **data.model_dump()}
    await db.gemstone_entries.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/gemstone-entries")
async def list_gemstone(user: CurrentUser, client_id: Optional[str] = None):
    q = {"client_id": client_id} if client_id else {}
    return await db.gemstone_entries.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.post("/cash-entries")
async def add_cash(data: CashEntryIn, user: CurrentUser):
    doc = {"id": str(uuid.uuid4()), "created_at": now_utc(), **data.model_dump()}
    await db.cash_entries.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/cash-entries")
async def list_cash(user: CurrentUser, client_id: Optional[str] = None):
    q = {"client_id": client_id} if client_id else {}
    return await db.cash_entries.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


# ---------- Invoices ----------
@api.post("/invoices")
async def create_invoice(data: InvoiceIn, user: CurrentUser):
    subtotal = data.labour_charges + data.stone_setting_charges + data.other_charges
    gst = round(subtotal * (data.gst_percent / 100.0), 2)
    total = round(subtotal + gst, 2)
    doc = {
        "id": str(uuid.uuid4()),
        "invoice_number": make_invoice_number(),
        "created_at": now_utc(),
        **data.model_dump(),
        "subtotal": subtotal,
        "gst_amount": gst,
        "total": total,
        "paid": 0.0,
        "balance": total,
        "status": "Unpaid",
    }
    await db.invoices.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/invoices")
async def list_invoices(user: CurrentUser, client_id: Optional[str] = None):
    q = {"client_id": client_id} if client_id else {}
    items = await db.invoices.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        c = await db.clients.find_one({"id": it["client_id"]}, {"_id": 0, "name": 1})
        it["client_name"] = c["name"] if c else ""
    return items


# ---------- Inventory ----------
@api.get("/inventory")
async def list_inventory(user: CurrentUser):
    items = await db.inventory.find({}, {"_id": 0}).sort("category", 1).to_list(500)
    for it in items:
        it["low_stock"] = it["stock"] <= it.get("low_stock_alert", 0)
    return items


@api.post("/inventory")
async def add_inventory(data: InventoryItemIn, user: CurrentUser):
    doc = {"id": str(uuid.uuid4()), "created_at": now_utc(), **data.model_dump()}
    await db.inventory.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


# ---------- Dashboard ----------
@api.get("/dashboard")
async def dashboard(user: CurrentUser):
    total_clients = await db.clients.count_documents({})
    total_wholesalers = await db.clients.count_documents({"type": "Wholesaler"})
    total_suppliers = await db.clients.count_documents({"type": "Supplier"})
    running_orders = await db.orders.count_documents({"status": "In Progress"})
    completed_orders = await db.orders.count_documents({"status": "Delivered"})
    today_start = datetime.combine(datetime.now().date(), datetime.min.time())
    today_jobs = await db.orders.count_documents({"created_at": {"$gte": today_start}})

    # Balances
    gold_agg = await db.gold_entries.aggregate([
        {"$group": {"_id": None,
                    "received": {"$sum": "$received"},
                    "issued": {"$sum": "$issued"},
                    "returned": {"$sum": "$returned"},
                    "fine": {"$sum": "$fine_gold"}}}
    ]).to_list(1)
    silver_agg = await db.silver_entries.aggregate([
        {"$group": {"_id": None, "received": {"$sum": "$received"},
                    "issued": {"$sum": "$issued"}, "returned": {"$sum": "$returned"}}}
    ]).to_list(1)
    diamond_agg = await db.diamond_entries.aggregate([
        {"$group": {"_id": None, "received": {"$sum": "$received"},
                    "issued": {"$sum": "$issued"}, "returned": {"$sum": "$returned"}}}
    ]).to_list(1)

    def bal(a):
        if not a:
            return 0.0
        r = a[0]
        return round(r.get("received", 0) - r.get("issued", 0) + r.get("returned", 0), 4)

    gold_balance = bal(gold_agg)
    silver_balance = bal(silver_agg)
    diamond_balance = bal(diamond_agg)
    fine_gold = round(gold_agg[0]["fine"], 4) if gold_agg else 0.0

    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    pending_payments = round(sum(i.get("balance", 0) for i in invoices), 2)
    monthly_revenue = round(sum(i.get("total", 0) for i in invoices
                                if i.get("created_at") and i["created_at"].month == datetime.now().month), 2)
    monthly_labour = round(sum(i.get("labour_charges", 0) for i in invoices
                                if i.get("created_at") and i["created_at"].month == datetime.now().month), 2)

    pending_deliveries = await db.orders.find(
        {"status": "In Progress"}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    for o in pending_deliveries:
        c = await db.clients.find_one({"id": o["client_id"]}, {"_id": 0, "name": 1})
        o["client_name"] = c["name"] if c else ""

    # Chart: last 6 months revenue
    chart = []
    for i in range(5, -1, -1):
        d = datetime.now() - timedelta(days=i * 30)
        total = sum(inv.get("total", 0) for inv in invoices
                    if inv.get("created_at") and inv["created_at"].month == d.month
                    and inv["created_at"].year == d.year)
        chart.append({"label": d.strftime("%b"), "value": round(total, 2)})

    low_stock = await db.inventory.find(
        {"$expr": {"$lte": ["$stock", "$low_stock_alert"]}}, {"_id": 0}
    ).to_list(100)

    return {
        "total_clients": total_clients,
        "total_wholesalers": total_wholesalers,
        "total_suppliers": total_suppliers,
        "running_orders": running_orders,
        "completed_orders": completed_orders,
        "today_jobs": today_jobs,
        "gold_balance": gold_balance,
        "fine_gold": fine_gold,
        "silver_balance": silver_balance,
        "diamond_balance": diamond_balance,
        "pending_payments": pending_payments,
        "monthly_revenue": monthly_revenue,
        "monthly_labour": monthly_labour,
        "pending_deliveries": pending_deliveries,
        "revenue_chart": chart,
        "low_stock_count": len(low_stock),
    }


# ---------- Client Statement ----------
@api.get("/clients/{cid}/statement")
async def client_statement(cid: str, user: CurrentUser):
    c = await db.clients.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Client not found")

    gold = await db.gold_entries.find({"client_id": cid}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    silver = await db.silver_entries.find({"client_id": cid}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    diamond = await db.diamond_entries.find({"client_id": cid}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    cash = await db.cash_entries.find({"client_id": cid}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    invs = await db.invoices.find({"client_id": cid}, {"_id": 0}).sort("created_at", 1).to_list(1000)

    # Gold balance per karat
    per_karat: dict = {}
    total_fine = 0.0
    for g in gold:
        k = g.get("karat", "22K")
        d = per_karat.setdefault(k, {"karat": k, "received": 0.0, "issued": 0.0,
                                     "returned": 0.0, "wastage": 0.0, "fine": 0.0})
        d["received"] += g.get("received", 0)
        d["issued"] += g.get("issued", 0)
        d["returned"] += g.get("returned", 0)
        d["wastage"] += g.get("wastage", 0)
        d["fine"] += g.get("fine_gold", 0)
        total_fine += g.get("fine_gold", 0)
    for d in per_karat.values():
        d["balance"] = round(d["received"] - d["issued"] + d["returned"], 4)
        for k in ("received", "issued", "returned", "wastage", "fine"):
            d[k] = round(d[k], 4)

    silver_bal = round(sum(s["received"] - s["issued"] + s["returned"] for s in silver), 4)
    diamond_bal = round(sum(d["received"] - d["issued"] + d["returned"] for d in diamond), 4)

    total_invoiced = round(sum(i.get("total", 0) for i in invs), 2)
    total_paid = round(sum(c["amount"] for c in cash if c.get("type") != "invoice"), 2)
    balance_due = round(sum(i.get("balance", 0) for i in invs), 2)

    # Recent cash rows
    recent_cash = [{
        "date": c["created_at"].isoformat() if hasattr(c.get("created_at"), "isoformat") else str(c.get("created_at")),
        "type": c.get("type"),
        "amount": c.get("amount"),
        "method": c.get("method"),
        "remarks": c.get("remarks", ""),
    } for c in cash[-20:]]

    return {
        "client": c,
        "generated_at": now_utc().isoformat(),
        "gold": {
            "per_karat": list(per_karat.values()),
            "total_fine": round(total_fine, 4),
        },
        "silver_balance": silver_bal,
        "diamond_balance": diamond_bal,
        "cash": {
            "total_invoiced": total_invoiced,
            "total_paid": total_paid,
            "balance_due": balance_due,
            "recent": recent_cash,
        },
    }


# ---------- Notifications ----------
@api.get("/notifications")
async def notifications(user: CurrentUser):
    notes = []
    now = now_utc()
    # Overdue orders
    overdue = await db.orders.find(
        {"status": "In Progress"}, {"_id": 0}
    ).to_list(1000)
    for o in overdue:
        exp = o.get("expected_delivery")
        try:
            if exp and datetime.fromisoformat(exp.replace("Z", "+00:00")) < now:
                notes.append({
                    "id": f"od-{o['id']}",
                    "type": "overdue_order",
                    "severity": "error",
                    "title": f"Order {o['order_number']} overdue",
                    "message": f"Currently at {o['current_stage']}",
                    "created_at": now.isoformat(),
                })
        except Exception:
            pass
    # Pending payments
    invs = await db.invoices.find({"balance": {"$gt": 0}}, {"_id": 0}).to_list(200)
    for i in invs:
        c = await db.clients.find_one({"id": i["client_id"]}, {"_id": 0, "name": 1})
        notes.append({
            "id": f"pp-{i['id']}",
            "type": "pending_payment",
            "severity": "warning",
            "title": f"Payment pending: ₹{i['balance']:,.0f}",
            "message": f"{c['name'] if c else ''} - Invoice {i['invoice_number']}",
            "created_at": now.isoformat(),
        })
    # Low stock
    low = await db.inventory.find(
        {"$expr": {"$lte": ["$stock", "$low_stock_alert"]}}, {"_id": 0}
    ).to_list(100)
    for l in low:
        notes.append({
            "id": f"ls-{l['id']}",
            "type": "low_stock",
            "severity": "warning",
            "title": f"Low stock: {l['name']}",
            "message": f"{l['stock']} {l['unit']} remaining",
            "created_at": now.isoformat(),
        })
    return notes


# ---------- Global Search ----------
@api.get("/search")
async def search_all(user: CurrentUser, q: str):
    if not q or len(q) < 1:
        return {"clients": [], "orders": [], "karigars": [], "invoices": []}
    rx = {"$regex": q, "$options": "i"}
    clients = await db.clients.find(
        {"$or": [{"name": rx}, {"company": rx}, {"phone": rx}]}, {"_id": 0}
    ).to_list(20)
    orders = await db.orders.find(
        {"$or": [{"order_number": rx}, {"jewellery_type": rx}]}, {"_id": 0}
    ).to_list(20)
    karigars = await db.karigars.find(
        {"$or": [{"name": rx}, {"speciality": rx}]}, {"_id": 0}
    ).to_list(20)
    invoices = await db.invoices.find({"invoice_number": rx}, {"_id": 0}).to_list(20)
    return {"clients": clients, "orders": orders, "karigars": karigars, "invoices": invoices}


# Root
@api.get("/")
async def root():
    return {"app": "GoldSmith Pro ERP", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("goldsmith")


@app.on_event("shutdown")
async def shutdown():
    client.close()
