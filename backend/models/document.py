from pydantic import BaseModel
from typing import Optional


class DocumentResponse(BaseModel):
    document_id: str
    title: str
    department: str
    subject_id: Optional[str]
    category: str
    classification: str
    uploaded_by: str
    emergency_locked: bool
    status: str


class AccessGrantResponse(BaseModel):
    allowed: bool
    reason_code: Optional[str] = None
    reason: Optional[str] = None
    download: bool = False
    share: bool = False
    document: Optional[DocumentResponse] = None
