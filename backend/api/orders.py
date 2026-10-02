"""
Order Tracking API
Court order tracking and compliance monitoring
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

# Create router
router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models
class OrderCreate(BaseModel):
    case_id: str
    order_title: str
    order_description: str
    due_date: str  # ISO format
    priority: str = "medium"  # low, medium, high

class OrderResponse(BaseModel):
    order_id: str
    case_id: str
    order_title: str
    order_description: str
    due_date: str
    priority: str
    status: str  # pending, completed, overdue
    created_at: str

class OrderUpdate(BaseModel):
    order_title: Optional[str] = None
    order_description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

# In-memory storage (production should use database)
orders_db = {}

def calculate_status(due_date_str: str, current_status: str) -> str:
    """Calculate order status based on due date"""
    if current_status == "completed":
        return "completed"

    try:
        due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
        now = datetime.now(due_date.tzinfo) if due_date.tzinfo else datetime.now()

        if now > due_date:
            return "overdue"
        return "pending"
    except:
        return "pending"

@router.post("/", response_model=OrderResponse)
async def create_order(order: OrderCreate):
    """
    Create new court order for tracking

    Track compliance deadlines:
    - Document submissions
    - Hearing appearances
    - Filing deadlines
    - Action items
    """

    order_id = f"order_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    new_order = {
        "order_id": order_id,
        "case_id": order.case_id,
        "order_title": order.order_title,
        "order_description": order.order_description,
        "due_date": order.due_date,
        "priority": order.priority,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }

    # Calculate actual status
    new_order["status"] = calculate_status(order.due_date, "pending")

    orders_db[order_id] = new_order
    return OrderResponse(**new_order)

@router.get("/")
async def list_orders(status: Optional[str] = None, limit: int = 10):
    """
    List all orders with optional status filter

    Statuses: pending, completed, overdue
    """

    all_orders = list(orders_db.values())

    # Update statuses
    for order in all_orders:
        order["status"] = calculate_status(order["due_date"], order["status"])

    # Filter by status
    if status:
        all_orders = [o for o in all_orders if o["status"] == status]

    # Sort by due date
    all_orders.sort(key=lambda x: x["due_date"])

    return {
        "total": len(all_orders),
        "orders": all_orders[:limit]
    }

@router.get("/overdue")
async def get_overdue_orders():
    """
    Get all overdue orders

    Returns orders past their due date
    """

    overdue = []

    for order in orders_db.values():
        order["status"] = calculate_status(order["due_date"], order["status"])
        if order["status"] == "overdue":
            overdue.append(order)

    # Sort by due date (oldest first)
    overdue.sort(key=lambda x: x["due_date"])

    return {
        "total": len(overdue),
        "overdue_orders": overdue
    }

@router.get("/due-this-week")
async def get_due_this_week():
    """
    Get orders due this week

    Helps prioritize upcoming deadlines
    """

    now = datetime.now()
    week_end = now + timedelta(days=7)

    due_soon = []

    for order in orders_db.values():
        order["status"] = calculate_status(order["due_date"], order["status"])

        if order["status"] == "pending":
            try:
                due_date = datetime.fromisoformat(order["due_date"].replace('Z', '+00:00'))
                due_date = due_date.replace(tzinfo=None)

                if now <= due_date <= week_end:
                    days_left = (due_date - now).days
                    order["days_left"] = days_left
                    due_soon.append(order)
            except:
                continue

    # Sort by due date
    due_soon.sort(key=lambda x: x["due_date"])

    return {
        "total": len(due_soon),
        "due_this_week": due_soon
    }

@router.get("/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""

    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders_db[order_id].copy()
    order["status"] = calculate_status(order["due_date"], order["status"])

    return order

@router.put("/{order_id}")
async def update_order(order_id: str, updates: OrderUpdate):
    """Update order details or status"""

    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders_db[order_id]

    # Update fields
    if updates.order_title:
        order["order_title"] = updates.order_title
    if updates.order_description:
        order["order_description"] = updates.order_description
    if updates.due_date:
        order["due_date"] = updates.due_date
    if updates.priority:
        order["priority"] = updates.priority
    if updates.status:
        order["status"] = updates.status

    # Recalculate status if not explicitly set
    if not updates.status:
        order["status"] = calculate_status(order["due_date"], order["status"])

    return order

@router.delete("/{order_id}")
async def delete_order(order_id: str):
    """Delete order"""

    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    del orders_db[order_id]
    return {"message": "Order deleted successfully"}
