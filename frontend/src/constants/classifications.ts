import type { Classification } from '../types/document';

export const CLASSIFICATIONS: Record<Classification, { label: string; color: string }> = {
  public:       { label: 'Public',       color: 'info' },
  internal:     { label: 'Internal',     color: 'neutral' },
  confidential: { label: 'Confidential', color: 'warning' },
  restricted:   { label: 'Restricted',   color: 'danger' },
};

export const SPECIAL_TAGS = [
  { value: 'HOD',               label: 'HOD (Head of Department)',  scope: 'Department-wide academic access' },
  { value: 'financial_auditor', label: 'Financial Auditor',         scope: 'Cross-dept financial documents only' },
  { value: 'exam_controller',   label: 'Exam Controller',           scope: 'All exam papers institution-wide' },
];

export const DOCUMENT_CATEGORIES = [
  { value: 'exam_paper',  label: 'Examination Paper' },
  { value: 'circular',    label: 'Circular' },
  { value: 'syllabus',    label: 'Syllabus' },
  { value: 'financial',   label: 'Financial Record' },
  { value: 'research',    label: 'Research Document' },
  { value: 'general',     label: 'General' },
];
