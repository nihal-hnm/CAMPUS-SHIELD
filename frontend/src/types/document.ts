export type Classification = 'public' | 'internal' | 'confidential' | 'restricted';
export type DocumentStatus = 'active' | 'archived' | 'locked';
export type DocumentCategory = 'exam_paper' | 'circular' | 'syllabus' | 'financial' | 'research' | 'general';

export interface Document {
  document_id: string;
  title: string;
  department: string;
  subject_id?: string;
  category: DocumentCategory;
  classification: Classification;
  uploaded_by: string;
  uploader_name?: string;
  storage_path?: string;
  emergency_locked: boolean;
  status: DocumentStatus;
  created_at: string;
  updated_at?: string;
  file_size?: number;
  file_type?: string;
  required_tag?: string;
}

export interface SharedLink {
  id: string;
  document_id: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  ttl_minutes: number;
  uses: number;
  is_active: boolean;
}
