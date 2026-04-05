"""
Temporal Anchor — Event-Sourcing Database Schema
Immutable ledger with shadow versioning and cryptographic timestamps.
"""

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, Index, CheckConstraint, Enum
)
from sqlalchemy.orm import relationship
from database.core import Base
from datetime import datetime
import hashlib
import uuid
import json


# ── Category Enum Values ────────────────────────────────────────────
EVENT_CATEGORIES = [
    "skill_update",
    "task_completed",
    "roadmap_milestone",
    "resume_event",
    "coach_session",
    "profile_update",
    "medical_update",
    "system_event",
    "growth_twin",
]

EVENT_STATUSES = ["anchored", "shadow", "superseded"]


def _generate_anchor_hash(user_id: int, payload: str, timestamp: datetime) -> str:
    """Cryptographically secure anchor hash for each event node."""
    raw = f"{user_id}:{payload}:{timestamp.isoformat()}:{uuid.uuid4()}"
    return hashlib.sha256(raw.encode()).hexdigest()


class EventNode(Base):
    """
    Core Event-Sourcing table. Every state change is a new, immutable row.
    No UPDATE or DELETE — only INSERT (enforced at application level).
    Editing produces a new EventNode with status='shadow' and a parent_id
    pointing to the superseded node.
    """
    __tablename__ = "event_nodes"

    id              = Column(Integer, primary_key=True, index=True)
    node_id         = Column(String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # ── What happened ───────────────────────────────────────────────
    category        = Column(String(64), nullable=False)          # e.g. "skill_update"
    title           = Column(String(255), nullable=False)
    summary         = Column(Text, default="")                    # Human-readable one-liner
    payload_json    = Column(Text, nullable=False, default="{}")  # Structured event data (JSON)

    # ── Immutable Ledger & Versioning ────────────────────────────────
    anchor_hash     = Column(String(64), nullable=False, unique=True)  # SHA-256 integrity seal
    status          = Column(String(32), nullable=False, default="anchored")  # anchored | shadow | superseded
    parent_id       = Column(Integer, ForeignKey("event_nodes.id"), nullable=True)  # Shadow version chain

    # ── Temporal Metadata ────────────────────────────────────────────
    anchored_at     = Column(DateTime, nullable=False, default=datetime.utcnow)  # Immutable: set once
    client_ts       = Column(DateTime, nullable=True)   # Optimistic UI: client-reported timestamp
    timezone_offset = Column(Integer, default=0)        # Client UTC offset in minutes

    # ── Soft Tags for Search & Filter ───────────────────────────────
    tags_json       = Column(Text, default="[]")  # ["health","ai","important"]
    is_pinned       = Column(Boolean, default=False)

    # ── Relationships ────────────────────────────────────────────────
    user            = relationship("User", back_populates="event_nodes")
    shadow_versions = relationship(
        "EventNode",
        primaryjoin="EventNode.parent_id == EventNode.id",
        foreign_keys="[EventNode.parent_id]",
        back_populates="parent_node",
    )
    parent_node     = relationship(
        "EventNode",
        primaryjoin="EventNode.parent_id == EventNode.id",
        foreign_keys="[EventNode.parent_id]",
        back_populates="shadow_versions",
        remote_side="[EventNode.id]",
        uselist=False,
    )

    __table_args__ = (
        Index("ix_event_user_cat",  "user_id", "category"),
        Index("ix_event_user_time", "user_id", "anchored_at"),
        Index("ix_event_status",    "status"),
        CheckConstraint("status IN ('anchored','shadow','superseded')", name="ck_event_status"),
    )

    def to_dict(self) -> dict:
        shadow_chain = []
        for sv in (self.shadow_versions or []):
            shadow_chain.append({
                "id": sv.id,
                "node_id": sv.node_id,
                "title": sv.title,
                "summary": sv.summary,
                "payload": json.loads(sv.payload_json or "{}"),
                "anchored_at": sv.anchored_at.isoformat(),
                "anchor_hash": sv.anchor_hash[:16] + "…",
            })

        return {
            "id":             self.id,
            "node_id":        self.node_id,
            "user_id":        self.user_id,
            "category":       self.category,
            "title":          self.title,
            "summary":        self.summary,
            "payload":        json.loads(self.payload_json or "{}"),
            "anchor_hash":    self.anchor_hash[:16] + "…",  # Truncated for UI; full hash for verification
            "status":         self.status,
            "parent_id":      self.parent_id,
            "anchored_at":    self.anchored_at.isoformat(),
            "client_ts":      self.client_ts.isoformat() if self.client_ts else None,
            "tags":           json.loads(self.tags_json or "[]"),
            "is_pinned":      self.is_pinned,
            "shadow_count":   len(shadow_chain),
            "shadow_versions": shadow_chain,
        }


class EventSyncQueue(Base):
    """
    Optimistic UI sync queue. Tracks background writes for
    zero-latency UI updates before database confirmation.
    """
    __tablename__ = "event_sync_queue"

    id            = Column(Integer, primary_key=True)
    client_ref_id = Column(String(64), unique=True, nullable=False)  # Frontend temp ID
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id       = Column(String(64), ForeignKey("event_nodes.node_id"), nullable=True)  # Set after persistence
    status        = Column(String(16), nullable=False, default="pending")  # pending | synced | failed
    retry_count   = Column(Integer, default=0)
    created_at    = Column(DateTime, default=datetime.utcnow)
    synced_at     = Column(DateTime, nullable=True)
    error_msg     = Column(Text, nullable=True)
