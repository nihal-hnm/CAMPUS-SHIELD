import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Download, ArrowLeft, ShieldCheck, ShieldX, Clock, RefreshCw } from 'lucide-react';
import { ClassificationBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { useAuth } from '../../context/AuthContext';
import { DENIAL_REASONS } from '../../constants/denialReasons';
import { formatDateTime, formatBytes } from '../../utils/format';
import type { DenialReasonCode } from '../../types/permission';
import {
  checkDocumentAccess,
  downloadDocument,
  type AccessDecisionResponse,
} from '../../services/apiClient';
import type { Document } from '../../types/document';

export default function DocumentViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<AccessDecisionResponse | null>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const runAccessCheck = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await checkDocumentAccess(id);
      setDecision(result);
      if (result.document) setDoc(result.document);
    } catch (err: any) {
      setError(err?.reason ?? err?.message ?? 'Access check failed.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { runAccessCheck(); }, [runAccessCheck]);

  const handleDownload = async () => {
    if (!id || !decision?.allowed) return;
    setDownloading(true);
    try {
      const blob = await downloadDocument(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.reason ?? err?.message ?? 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="card p-6 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
            <p className="text-sm text-text-muted">Running Zero-Trust access check…</p>
            <p className="text-xs text-text-muted mt-1 font-mono">10-step verification pipeline</p>
          </div>
        </div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="card p-10 text-center">
        <FileText className="w-10 h-10 text-text-muted mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-text">Could not evaluate access</h2>
        <p className="text-sm text-text-muted mt-1">{error ?? 'Unknown error. Please try again.'}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={runAccessCheck}>
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  const denial =
    !decision.allowed && decision.reason_code
      ? DENIAL_REASONS[decision.reason_code as DenialReasonCode]
      : null;

  // Use doc from decision response, or fall back to id-based placeholder
  const docTitle = doc?.title ?? id ?? 'Document';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/library" className="p-1.5 rounded hover:bg-bg text-text-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-text truncate">{docTitle}</h1>
          {doc && (
            <div className="flex items-center gap-2 mt-1">
              <ClassificationBadge classification={doc.classification} />
              <span className="text-xs text-text-muted">{doc.department}</span>
              {(doc as any).subject_id && (
                <span className="text-xs font-mono text-text-muted">{(doc as any).subject_id}</span>
              )}
            </div>
          )}
        </div>
        {decision.allowed && (
          <Button variant="primary" size="sm" onClick={handleDownload} disabled={downloading}>
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading…' : 'Download'}
          </Button>
        )}
      </div>

      {error && <InlineAlert type="error" message={error} />}

      <div className="flex gap-5">
        {/* Preview area */}
        <div className="flex-1 min-w-0">
          {decision.allowed ? (
            <div className="card p-0 overflow-hidden">
              <div className="bg-neutral-soft h-[600px] flex flex-col items-center justify-center gap-4 relative">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
                  <div className="text-6xl font-bold text-text rotate-[-30deg]">
                    {user?.name}<br />{user?.uid}
                  </div>
                </div>
                <ShieldCheck className="w-12 h-12 text-success" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-base font-semibold text-text">{docTitle}</p>
                  <p className="text-sm text-text-muted mt-1">
                    PDF Preview — {doc && (doc as any).file_size ? formatBytes((doc as any).file_size) : 'Available'}
                  </p>
                  <p className="text-xs text-text-muted mt-2 font-mono">
                    Watermarked for {user?.name} · {new Date().toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="primary" size="sm" onClick={handleDownload} disabled={downloading}>
                    <Download className="w-4 h-4" />
                    {downloading ? 'Downloading…' : 'Download (64KB chunks)'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Access Denied */
            <div className="card p-10">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-full bg-danger-soft flex items-center justify-center mb-4">
                    <ShieldX className="w-7 h-7 text-danger" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-semibold text-danger mb-2">Access denied</h2>
                  <p className="text-sm font-medium text-text mb-1">
                    {denial?.title ?? 'No permission to view this document'}
                  </p>
                  <p className="text-sm text-text-muted mb-3">
                    {decision.reason ?? denial?.explanation}
                  </p>
                  {decision.reason_code && (
                    <span className="font-mono text-xs bg-bg border border-border px-2 py-1 rounded text-text-muted">
                      {decision.reason_code}
                    </span>
                  )}
                </div>
                <div className="flex-1 bg-bg rounded p-5">
                  <h3 className="text-sm font-semibold text-text mb-3">What you can do</h3>
                  <p className="text-sm text-text-muted mb-4">
                    {denial?.action ?? 'Contact your administrator to request access.'}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link to="/requests">
                      <Button variant="primary" size="sm" className="w-full">Request Access</Button>
                    </Link>
                    <Link to="/library">
                      <Button variant="secondary" size="sm" className="w-full">Back to Library</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Decision panel */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text mb-3">Access Decision</h3>
            <div className={`flex items-center gap-2 p-3 rounded mb-3 ${decision.allowed ? 'bg-success-soft' : 'bg-danger-soft'}`}>
              {decision.allowed
                ? <ShieldCheck className="w-5 h-5 text-success" />
                : <ShieldX className="w-5 h-5 text-danger" />
              }
              <span className={`text-sm font-semibold ${decision.allowed ? 'text-success' : 'text-danger'}`}>
                {decision.allowed ? 'ALLOWED' : 'DENIED'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Engine</span>
                <span className="text-text font-mono text-xs">10-Step Zero-Trust</span>
              </div>
              {decision.allowed && (
                <div className="flex justify-between text-text-muted">
                  <span>Link TTL</span>
                  <span className="text-text flex items-center gap-1"><Clock className="w-3.5 h-3.5" />60 min max</span>
                </div>
              )}
              {!decision.allowed && decision.reason_code && (
                <div className="flex justify-between text-text-muted">
                  <span>Reason</span>
                  <span className="font-mono text-xs text-danger">{decision.reason_code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Document details */}
          {doc && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-text mb-3">Document Details</h3>
              <dl className="space-y-2 text-sm">
                {[
                  { label: 'Department', value: doc.department },
                  { label: 'Subject', value: (doc as any).subject_id ?? '—' },
                  { label: 'Category', value: (doc as any).category?.replace('_', ' ') ?? '—' },
                  { label: 'Classification', value: <ClassificationBadge classification={doc.classification} /> },
                  { label: 'Size', value: (doc as any).file_size ? formatBytes((doc as any).file_size) : 'N/A' },
                  { label: 'Created', value: formatDateTime((doc as any).created_at ?? new Date().toISOString()) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-text-muted flex-shrink-0">{label}</dt>
                    <dd className="text-text text-right font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
