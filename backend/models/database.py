"""
LegalMind AI - Database Models
SQLAlchemy ORM models for all tables
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, JSON,
    DateTime, ForeignKey, Index, Table
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json as json_module

Base = declarative_base()

# ============================================================================
# USER MANAGEMENT
# ============================================================================

class User(Base):
    """User accounts and profiles"""
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)  # user_001
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    role = Column(String(100))  # Legal Lead, Counsel, Manager
    department = Column(String(100))
    phone = Column(String(50))
    avatar = Column(String(10))  # Initials
    permissions = Column(JSON)  # List of permissions
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="active")  # active, inactive

    # Relationships
    cases = relationship("Case", back_populates="assigned_user")
    drafts_created = relationship("Draft", foreign_keys="Draft.created_by", back_populates="creator")
    notifications = relationship("Notification", back_populates="user")

    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_status', 'status'),
    )


# ============================================================================
# CASE MANAGEMENT
# ============================================================================

class Case(Base):
    """Legal cases"""
    __tablename__ = "cases"

    id = Column(String(50), primary_key=True)  # case_001
    title = Column(String(500), nullable=False)
    type = Column(String(100))  # RERA, Insurance, Consumer, etc.
    status = Column(String(50), default="active")  # active, closed, pending
    client_name = Column(String(200))
    opponent_name = Column(String(200))
    case_number = Column(String(100))
    filed_date = Column(DateTime)
    court = Column(String(200))
    assigned_to = Column(String(50), ForeignKey('users.id'))
    priority = Column(String(20))  # high, medium, low
    description = Column(Text)
    key_facts = Column(JSON)  # Array of key facts
    next_hearing = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_user = relationship("User", back_populates="cases")
    drafts = relationship("Draft", back_populates="case")
    orders = relationship("Order", back_populates="case")

    __table_args__ = (
        Index('idx_case_type', 'type'),
        Index('idx_case_status', 'status'),
        Index('idx_case_assigned', 'assigned_to'),
    )


# ============================================================================
# DRAFT MANAGEMENT
# ============================================================================

class Draft(Base):
    """Legal drafts and documents"""
    __tablename__ = "drafts"

    id = Column(String(50), primary_key=True)  # draft_001
    title = Column(String(500), nullable=False)
    draft_type = Column(String(100))  # legal_notice, complaint, affidavit
    case_id = Column(String(50), ForeignKey('cases.id'))
    status = Column(String(50), default="draft")  # draft, under_review, approved, rejected
    version = Column(Integer, default=1)
    created_by = Column(String(50), ForeignKey('users.id'))
    content = Column(Text)  # Full draft content
    content_preview = Column(String(1000))  # First 500 chars
    word_count = Column(Integer)
    sources_used = Column(JSON)  # Array of source references
    planner_decision = Column(JSON)  # Decision metadata
    tags = Column(JSON)  # Array of tags
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reviewed_by = Column(String(50), ForeignKey('users.id'))
    reviewed_at = Column(DateTime)
    review_comments = Column(Text)

    # Relationships
    case = relationship("Case", back_populates="drafts")
    creator = relationship("User", foreign_keys=[created_by], back_populates="drafts_created")

    __table_args__ = (
        Index('idx_draft_status', 'status'),
        Index('idx_draft_case', 'case_id'),
        Index('idx_draft_created_by', 'created_by'),
    )


# ============================================================================
# COMPLIANCE TRACKING
# ============================================================================

class Order(Base):
    """Court orders and compliance tracking"""
    __tablename__ = "orders"

    id = Column(String(50), primary_key=True)  # order_001
    order_number = Column(String(100))
    case_id = Column(String(50), ForeignKey('cases.id'))
    title = Column(String(500), nullable=False)
    court = Column(String(200))
    order_date = Column(DateTime)
    order_type = Column(String(100))  # compliance_order, interim, final
    priority = Column(String(20))  # high, medium, low
    status = Column(String(50), default="pending")  # pending, in_progress, completed, overdue
    summary = Column(Text)
    directions = Column(JSON)  # Array of directions
    next_hearing = Column(DateTime)
    attachments = Column(JSON)  # File paths
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="orders")
    actions = relationship("OrderAction", back_populates="order")

    __table_args__ = (
        Index('idx_order_status', 'status'),
        Index('idx_order_case', 'case_id'),
        Index('idx_order_date', 'order_date'),
    )


class OrderAction(Base):
    """Actions required for order compliance"""
    __tablename__ = "order_actions"

    id = Column(String(50), primary_key=True)  # action_001
    order_id = Column(String(50), ForeignKey('orders.id'))
    description = Column(Text, nullable=False)
    deadline = Column(DateTime)
    assigned_to = Column(String(50), ForeignKey('users.id'))
    status = Column(String(50), default="pending")  # pending, in_progress, completed, overdue
    progress = Column(Integer, default=0)  # 0-100
    completed_at = Column(DateTime)
    days_overdue = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="actions")

    __table_args__ = (
        Index('idx_action_status', 'status'),
        Index('idx_action_deadline', 'deadline'),
    )


# ============================================================================
# PRECEDENTS & JUDGMENTS
# ============================================================================

class Precedent(Base):
    """Court judgments and precedents"""
    __tablename__ = "precedents"

    id = Column(String(50), primary_key=True)  # precedent_001
    case_name = Column(String(500), nullable=False)
    court = Column(String(200))
    citation = Column(String(200))
    case_number = Column(String(100))
    judgment_date = Column(DateTime)
    bench = Column(String(500))
    petitioner = Column(String(200))
    respondent = Column(String(200))
    acts_involved = Column(JSON)  # Array of act names
    summary = Column(Text)
    key_takeaways = Column(JSON)  # Array of key points
    facts = Column(Text)
    held = Column(Text)
    relevance_score = Column(Float, default=0.0)
    cited_by_count = Column(Integer, default=0)
    status = Column(String(50), default="good_law")  # good_law, overruled, pending
    tags = Column(JSON)  # Array of tags
    source = Column(String(50))  # manual, scraped, uploaded
    added_at = Column(DateTime, default=datetime.utcnow)
    full_text_path = Column(String(500))  # Path to full judgment

    __table_args__ = (
        Index('idx_precedent_court', 'court'),
        Index('idx_precedent_date', 'judgment_date'),
        Index('idx_precedent_relevance', 'relevance_score'),
    )


# ============================================================================
# RESEARCH & QUERIES
# ============================================================================

class ResearchSession(Base):
    """Research chat sessions"""
    __tablename__ = "research_sessions"

    id = Column(String(50), primary_key=True)  # session_001
    user_id = Column(String(50), ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    total_queries = Column(Integer, default=0)
    status = Column(String(20), default="active")  # active, archived

    # Relationships
    queries = relationship("ResearchQuery", back_populates="session")

    __table_args__ = (
        Index('idx_session_user', 'user_id'),
        Index('idx_session_status', 'status'),
    )


class ResearchQuery(Base):
    """Individual research queries"""
    __tablename__ = "research_queries"

    id = Column(String(50), primary_key=True)  # research_001
    session_id = Column(String(50), ForeignKey('research_sessions.id'))
    user_id = Column(String(50), ForeignKey('users.id'))
    query = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    planner_decision = Column(JSON)  # Planner agent decision
    sources_searched = Column(JSON)  # {rag: 3, graph: 2, web: 1}
    results_count = Column(Integer)
    response = Column(Text)
    response_preview = Column(String(500))
    satisfaction_rating = Column(Integer)  # 1-5
    used_for_draft = Column(Boolean, default=False)
    draft_id = Column(String(50), ForeignKey('drafts.id'))

    # Relationships
    session = relationship("ResearchSession", back_populates="queries")

    __table_args__ = (
        Index('idx_query_session', 'session_id'),
        Index('idx_query_user', 'user_id'),
    )


# ============================================================================
# NOTIFICATIONS
# ============================================================================

class Notification(Base):
    """User notifications"""
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True)  # notif_001
    user_id = Column(String(50), ForeignKey('users.id'))
    type = Column(String(50))  # reminder, status_update, new_precedent
    title = Column(String(500))
    message = Column(Text)
    priority = Column(String(20))  # high, medium, low
    read = Column(Boolean, default=False)
    action_url = Column(String(500))
    related_entity_type = Column(String(50))  # order, draft, case
    related_entity_id = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index('idx_notif_user', 'user_id'),
        Index('idx_notif_read', 'read'),
    )


# ============================================================================
# DOCUMENTS
# ============================================================================

class Document(Base):
    """Uploaded/processed documents"""
    __tablename__ = "documents"

    id = Column(String(50), primary_key=True)  # doc_001
    filename = Column(String(500))
    original_filename = Column(String(500))
    category = Column(String(100))  # rera, irdai, court_orders, etc.
    file_type = Column(String(20))  # pdf, docx, txt
    file_size = Column(Integer)  # bytes
    file_path = Column(String(1000))
    uploaded_by = Column(String(50), ForeignKey('users.id'))
    upload_date = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    text_extracted = Column(Boolean, default=False)
    chunk_count = Column(Integer, default=0)
    vectorized = Column(Boolean, default=False)
    graph_added = Column(Boolean, default=False)
    doc_metadata = Column(JSON)  # Renamed from 'metadata' to avoid SQLAlchemy conflict
    tags = Column(JSON)

    __table_args__ = (
        Index('idx_doc_category', 'category'),
        Index('idx_doc_processed', 'processed'),
    )


# ============================================================================
# ACTIVITY LOGS
# ============================================================================

class ActivityLog(Base):
    """System activity logs"""
    __tablename__ = "activity_logs"

    id = Column(String(50), primary_key=True)  # activity_001
    user_id = Column(String(50), ForeignKey('users.id'))
    action = Column(String(100))  # draft_created, order_updated, etc.
    entity_type = Column(String(50))
    entity_id = Column(String(50))
    description = Column(String(1000))
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50))

    __table_args__ = (
        Index('idx_activity_user', 'user_id'),
        Index('idx_activity_timestamp', 'timestamp'),
    )


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_database(engine):
    """Create all tables"""
    Base.metadata.create_all(engine)
    print("SUCCESS: Database tables created!")


def get_table_names():
    """Get list of all table names"""
    return [
        'users', 'cases', 'drafts', 'orders', 'order_actions',
        'precedents', 'research_sessions', 'research_queries',
        'notifications', 'documents', 'activity_logs'
    ]


if __name__ == "__main__":
    """Test database models"""
    from sqlalchemy import create_engine

    print("=" * 70)
    print("LEGALMIND AI - DATABASE SCHEMA")
    print("=" * 70)

    print("\nTables to be created:")
    for i, table_name in enumerate(get_table_names(), 1):
        print(f"  {i:2d}. {table_name}")

    print(f"\nTotal tables: {len(get_table_names())}")

    # Test schema creation
    print("\nTesting schema creation...")
    engine = create_engine("sqlite:///test_legalmind.db")
    init_database(engine)

    print("\n" + "=" * 70)
    print("SUCCESS: Database schema validated!")
    print("=" * 70)
