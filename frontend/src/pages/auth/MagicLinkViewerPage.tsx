import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldX, Clock, FileText, Download } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { logAuditEvent } from '../../services/dbSync';
import { Button } from '../../components/ui/Button';

interface MagicRecord {
  token: string;
  document_id: string;
  document_title: string;
  created_by: string;
  created_by_name: string;
  expires_at: string;
  accessed: boolean;
}

export default function MagicLinkViewerPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MagicRecord | null>(null);
  const [deniedReason, setDeniedReason] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function verifyToken() {
      if (!token) {
        setDeniedReason('Missing magic link token.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('magic_links')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setDeniedReason('This magic link is invalid or has been revoked.');
        void logAuditEvent({
          user_id: 'magic-link-guest',
          user_name: 'Magic Link Guest',
          user_role: 'guest',
          document_id: token.slice(0, 12),
          action: 'DENY',
          reason_code: 'LINK_NOT_AUTHORIZED',
          failure_reason: 'Invalid or revoked magic link',
        });
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setDeniedReason('This magic link has expired.');
        void logAuditEvent({
          user_id: 'magic-link-guest',
          user_name: 'Magic Link Guest',
          user_role: 'guest',
          document_id: data.document_id,
          document_title: data.document_title,
          action: 'DENY',
          reason_code: 'LINK_EXPIRED',
          failure_reason: 'Magic link TTL exceeded',
        });
        setLoading(false);
        return;
      }

      if (data.accessed) {
        setDeniedReason('This one-time magic link has already been used.');
        void logAuditEvent({
          user_id: 'magic-link-guest',
          user_name: 'Magic Link Guest',
          user_role: 'guest',
          document_id: data.document_id,
          document_title: data.document_title,
          action: 'DENY',
          reason_code: 'LINK_NOT_AUTHORIZED',
          failure_reason: 'One-time magic link already consumed',
        });
        setLoading(false);
        return;
      }

      // Burn-after-reading: mark accessed in Supabase
      await supabase.from('magic_links').update({ accessed: true }).eq('token', token);
      void logAuditEvent({
        user_id: 'magic-link-guest',
        user_name: 'Magic Link Guest',
        user_role: 'guest',
        document_id: data.document_id,
        document_title: data.document_title,
        action: 'ALLOW',
        reason_code: 'MAGIC_LINK_VERIFIED',
        failure_reason: `Temporary view granted by ${data.created_by_name}`,
      });

      setRecord(data as MagicRecord);
      setLoading(false);
    }

    void verifyToken();
    return () => { active = false; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-lg w-full card p-8 space-y-5">
        {deniedReason ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center mx-auto">
              <ShieldX className="w-6 h-6 text-danger-dark" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-semibold text-text">Magic Link Denied</h1>
            <p className="text-sm text-text-muted">{deniedReason}</p>
            <Link to="/login" className="inline-block">
              <Button variant="primary" size="sm">Sign in to CampusShield</Button>
            </Link>
          </div>
        ) : record && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-soft flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-success" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-text">{record.document_title}</h1>
                <p className="text-xs text-text-muted">Shared by {record.created_by_name} · One-time access</p>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-neutral-soft border border-border text-center space-y-3 relative overflow-hidden">
              <FileText className="w-10 h-10 text-primary mx-auto" strokeWidth={1.5} />
              <p className="text-sm font-medium text-text">Temporary View-Only Access Verified</p>
              <p className="text-xs text-text-muted flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Expires {new Date(record.expires_at).toLocaleString()}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const blob = new Blob([`CampusShield Magic Link Document\nTitle: ${record.document_title}\nDocument ID: ${record.document_id}\nShared By: ${record.created_by_name}\n`], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${record.document_id}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-4 h-4" /> Save Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
