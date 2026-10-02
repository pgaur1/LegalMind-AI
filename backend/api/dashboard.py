"""
Dashboard & Analytics API
Dashboard stats and activity monitoring
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta

# Create router
router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models
class DashboardStats(BaseModel):
    total_cases: int
    active_cases: int
    pending_orders: int
    overdue_orders: int
    drafts_pending: int
    recent_research_queries: int

class ActivityLog(BaseModel):
    activity_id: str
    activity_type: str  # research, draft, order, case, precedent
    description: str
    timestamp: str
    user: str

class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_activity: List[ActivityLog]

def get_dashboard_stats() -> DashboardStats:
    """
    Get dashboard statistics

    In production, this would query the database
    """
    return DashboardStats(
        total_cases=25,
        active_cases=12,
        pending_orders=8,
        overdue_orders=3,
        drafts_pending=5,
        recent_research_queries=47
    )

def get_recent_activity() -> List[ActivityLog]:
    """
    Get recent activity feed

    In production, this would query activity logs
    """
    now = datetime.now()

    activities = [
        ActivityLog(
            activity_id=f"act_{i}",
            activity_type=["research", "draft", "order", "precedent", "case"][i % 5],
            description=[
                "Researched RERA Section 18 penalty provisions",
                "Generated legal notice for property dispute",
                "Created court order tracking for Case #2024/123",
                "Searched precedents for consumer protection",
                "Updated case status and timeline"
            ][i % 5],
            timestamp=(now - timedelta(minutes=i*15)).isoformat(),
            user="demo_user"
        )
        for i in range(10)
    ]

    return activities

@router.get("/stats")
async def get_stats():
    """
    Get dashboard statistics

    Returns:
    - Total and active cases
    - Pending and overdue orders
    - Draft status
    - Research activity
    """
    stats = get_dashboard_stats()
    return {
        "stats": stats.dict(),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/recent-activity")
async def get_activity(limit: int = 10):
    """
    Get recent activity feed

    Shows latest user actions across all features
    """
    activities = get_recent_activity()

    # Limit results
    activities = activities[:limit]

    return {
        "total": len(activities),
        "activities": [a.dict() for a in activities]
    }

@router.get("/")
async def get_dashboard():
    """
    Get complete dashboard data

    Combines stats and recent activity
    """
    stats = get_dashboard_stats()
    activities = get_recent_activity()

    return DashboardResponse(
        stats=stats,
        recent_activity=activities[:5]
    ).dict()

@router.get("/analytics/usage")
async def get_usage_analytics(days: int = 7):
    """
    Get usage analytics for past N days

    Tracks feature usage over time
    """
    now = datetime.now()

    # Generate usage data (in production, query from database)
    usage_by_day = []
    for i in range(days):
        date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        usage_by_day.append({
            "date": date,
            "research_queries": 5 + (i % 3),
            "drafts_generated": 2 + (i % 2),
            "precedents_searched": 3 + (i % 4),
            "orders_tracked": 1 + (i % 2)
        })

    return {
        "period_days": days,
        "usage_by_day": usage_by_day,
        "totals": {
            "research_queries": sum(d["research_queries"] for d in usage_by_day),
            "drafts_generated": sum(d["drafts_generated"] for d in usage_by_day),
            "precedents_searched": sum(d["precedents_searched"] for d in usage_by_day),
            "orders_tracked": sum(d["orders_tracked"] for d in usage_by_day)
        }
    }
