from pydantic import BaseModel
from typing import Optional


class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    user_uid: str
    user_email: str
    document_id: str
    action: str           # ALLOW | DENY
    reason_code: Optional[str]
    client_ip: str
    metadata: dict = {}


class AuditLogFilter(BaseModel):
    user_uid: Optional[str] = None
    document_id: Optional[str] = None
    action: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    page: int = 1
    page_size: int = 50
