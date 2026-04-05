"""
Temporal Anchor — API Routes
Immutable event-sourcing REST endpoints with optimistic sync.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
import uuid

from database.core import get_db
from database.temporal_anchor import EventNode, EventSyncQueue, _generate_anchor_hash
from api.routes.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["Temporal Anchor"])


# ── Pydantic Schemas ───────────────────────────────────────────────

class AnchorEventRequest(BaseModel):
    client_ref_id: str           # Frontend optimistic temp ID
    category:      str
    title:         str
    summary:       Optional[str] = ""
    payload:       Optional[dict] = {}
    tags:          Optional[List[str]] = []
    client_ts:     Optional[str] = None  # ISO timestamp from client
    timezone_offset: Optional[int] = 0

class ShadowVersionRequest(BaseModel):
    """Edit an existing entry — creates a shadow version, never overwrites."""
    client_ref_id:  str
    parent_node_id: str          # node_id of the entry being edited
    title:          str
    summary:        Optional[str] = ""
    payload:        Optional[dict] = {}
    tags:           Optional[List[str]] = []

class PinToggleRequest(BaseModel):
    node_id:  str
    is_pinned: bool


# ── Helper ───────────────────────────────────────────────────────────

def _parse_client_ts(ts_str: Optional[str]) -> Optional[datetime]:
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except Exception:
        return None


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/anchor", status_code=status.HTTP_201_CREATED)
def anchor_event(
    body: AnchorEventRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Persist a new Event Node (Anchor). Called after optimistic UI update.
    Categories must match EVENT_CATEGORIES values.
    """
    now = datetime.utcnow()
    payload_str = json.dumps(body.payload or {})
    anchor_hash = _generate_anchor_hash(current_user.id, payload_str, now)

    node = EventNode(
        node_id         = str(uuid.uuid4()),
        user_id         = current_user.id,
        category        = body.category,
        title           = body.title,
        summary         = body.summary or "",
        payload_json    = payload_str,
        anchor_hash     = anchor_hash,
        status          = "anchored",
        parent_id       = None,
        anchored_at     = now,
        client_ts       = _parse_client_ts(body.client_ts),
        timezone_offset = body.timezone_offset or 0,
        tags_json       = json.dumps(body.tags or []),
        is_pinned       = False,
    )
    db.add(node)

    # Confirm the sync queue entry if one exists for this client_ref_id
    queue_entry = db.query(EventSyncQueue).filter_by(
        client_ref_id=body.client_ref_id,
        user_id=current_user.id,
    ).first()
    if queue_entry:
        queue_entry.node_id   = node.node_id
        queue_entry.status    = "synced"
        queue_entry.synced_at = now
    else:
        queue_entry = EventSyncQueue(
            client_ref_id = body.client_ref_id,
            user_id       = current_user.id,
            status        = "synced",
            synced_at     = now,
        )
        db.add(queue_entry)

    db.commit()
    db.refresh(node)
    return {"ok": True, "node": node.to_dict()}


@router.post("/shadow", status_code=status.HTTP_201_CREATED)
def create_shadow_version(
    body: ShadowVersionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Edit an anchored event. Creates a shadow version — original is marked 'superseded'.
    The audit trail remains intact: shadow_versions[] on the parent holds full history.
    """
    parent = db.query(EventNode).filter_by(
        node_id=body.parent_node_id,
        user_id=current_user.id,
    ).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent event node not found.")
    if parent.status == "superseded":
        raise HTTPException(status_code=409, detail="Cannot edit a superseded node. Edit the active version.")

    now = datetime.utcnow()
    payload_str = json.dumps(body.payload or {})
    anchor_hash = _generate_anchor_hash(current_user.id, payload_str, now)

    # Mark parent as superseded (immutable ledger — never deleted)
    parent.status = "superseded"

    # Create the new active shadow version
    shadow = EventNode(
        node_id         = str(uuid.uuid4()),
        user_id         = current_user.id,
        category        = parent.category,  # Category is immutable
        title           = body.title,
        summary         = body.summary or "",
        payload_json    = payload_str,
        anchor_hash     = anchor_hash,
        status          = "anchored",  # New version is the active anchored one
        parent_id       = parent.id,
        anchored_at     = now,
        client_ts       = None,
        timezone_offset = parent.timezone_offset,
        tags_json       = json.dumps(body.tags or []),
        is_pinned       = parent.is_pinned,
    )
    db.add(shadow)
    db.commit()
    db.refresh(shadow)
    return {"ok": True, "node": shadow.to_dict(), "superseded_node_id": parent.node_id}


@router.get("/timeline")
def get_timeline(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    category:   Optional[str] = Query(None),
    search:     Optional[str] = Query(None),
    from_date:  Optional[str] = Query(None),
    to_date:    Optional[str] = Query(None),
    pinned_only: bool = Query(False),
    limit:      int = Query(30, ge=1, le=100),
    offset:     int = Query(0, ge=0),
):
    """
    Paginated, filterable timeline. Returns only active (anchored) nodes,
    newest-first. Superseded nodes are accessible via shadow_versions[].
    Uses windowing via limit+offset for performance.
    """
    q = db.query(EventNode).filter(
        EventNode.user_id == current_user.id,
        EventNode.status  == "anchored",
    )

    if category and category != "all":
        q = q.filter(EventNode.category == category)

    if pinned_only:
        q = q.filter(EventNode.is_pinned == True)

    if search:
        term = f"%{search.lower()}%"
        q = q.filter(
            or_(
                EventNode.title.ilike(term),
                EventNode.summary.ilike(term),
                EventNode.tags_json.ilike(term),
            )
        )

    if from_date:
        try:
            dt = datetime.fromisoformat(from_date)
            q = q.filter(EventNode.anchored_at >= dt)
        except ValueError:
            pass

    if to_date:
        try:
            dt = datetime.fromisoformat(to_date)
            q = q.filter(EventNode.anchored_at <= dt)
        except ValueError:
            pass

    total  = q.count()
    nodes  = q.order_by(desc(EventNode.anchored_at)).offset(offset).limit(limit).all()

    return {
        "ok":     True,
        "total":  total,
        "offset": offset,
        "limit":  limit,
        "nodes":  [n.to_dict() for n in nodes],
    }


@router.get("/node/{node_id}")
def get_node(
    node_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve full audit trail for a single node including all shadow versions."""
    node = db.query(EventNode).filter_by(node_id=node_id, user_id=current_user.id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Event node not found.")
    return {"ok": True, "node": node.to_dict()}


@router.patch("/pin")
def toggle_pin(
    body: PinToggleRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Pin/unpin a history entry for quick access."""
    node = db.query(EventNode).filter_by(node_id=body.node_id, user_id=current_user.id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Event node not found.")
    node.is_pinned = body.is_pinned
    db.commit()
    return {"ok": True, "node_id": node.node_id, "is_pinned": node.is_pinned}


@router.get("/stats")
def get_history_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Aggregate stats for the history dashboard panel."""
    from sqlalchemy import func

    base = db.query(EventNode).filter(
        EventNode.user_id == current_user.id,
        EventNode.status  == "anchored",
    )
    total       = base.count()
    by_category = (
        db.query(EventNode.category, func.count(EventNode.id))
        .filter(EventNode.user_id == current_user.id, EventNode.status == "anchored")
        .group_by(EventNode.category)
        .all()
    )
    pinned = base.filter(EventNode.is_pinned == True).count()
    return {
        "ok":          True,
        "total_events": total,
        "pinned":       pinned,
        "by_category":  {cat: cnt for cat, cnt in by_category},
    }
