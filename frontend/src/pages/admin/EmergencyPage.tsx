import React, { useState } from 'react';
import { OctagonAlert, User, FileText, Building2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { MOCK_USERS, MOCK_DOCUMENTS } from '../../mocks/data';

type Step = 1 | 2 | 3;
type TargetType = 'user' | 'document' | 'department';

export default function EmergencyPage() {
  const [step, setStep] = useState<Step>(1);
  const [targetType, setTargetType] = useState<TargetType>('user');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; permissions: number; sessions: number; links: number } | null>(null);

  const targetLabel = targetType === 'user'
    ? MOCK_USERS.find(u => u.uid === targetId)?.name ?? targetId
    : targetType === 'document'
    ? MOCK_DOCUMENTS.find(d => d.document_id === targetId)?.title ?? targetId
    : targetId;

  const confirmWord = targetType === 'user' ? 'REVOKE' : 'LOCKDOWN';
  const canConfirm = confirm === confirmWord && reason.length > 10;

  async function handleRevoke() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setResult({ success: true, permissions: 3, sessions: 2, links: 1 });
    setLoading(false);
  }

  if (result) {
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Emergency revocation complete</h2>
          <p className="text-sm text-text-muted mb-5">The following actions were taken immediately.</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Permissions revoked', value: result.permissions },
              { label: 'Sessions ended',      value: result.sessions },
              { label: 'Links invalidated',   value: result.links },
            ].map(({ label, value }) => (
              <div key={label} className="card p-3">
                <p className="text-2xl font-semibold text-danger">{value}</p>
                <p className="text-xs text-text-muted mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" size="sm" onClick={() => { setResult(null); setStep(1); setTargetId(''); setReason(''); setConfirm(''); }}>New Revocation</Button>
            <a href="/admin/audit"><Button variant="primary" size="sm">View Audit Log</Button></a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="p-4 bg-danger-soft border border-danger/20 rounded flex items-start gap-3">
        <OctagonAlert className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-danger">Emergency Revocation Center</p>
          <p className="text-xs text-danger/80 mt-0.5">Use only during active security incidents. All actions are permanently logged and cannot be undone.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${step === s ? 'bg-primary text-white' : step > s ? 'bg-success-soft text-success' : 'bg-bg text-text-muted border border-border'}`}>
              {step > s ? '✓' : s} {['Target', 'Scope', 'Confirm'][s - 1]}
            </div>
            {s < 3 && <div className="flex-1 h-px bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main form */}
        <div className="lg:col-span-2 card p-6">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-text">Step 1: Select Target</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { type: 'user' as TargetType, label: 'User', icon: User, desc: 'Revoke all access for a specific user' },
                  { type: 'document' as TargetType, label: 'Document', icon: FileText, desc: 'Lock down a specific document' },
                  { type: 'department' as TargetType, label: 'Department', icon: Building2, desc: 'Revoke all dept sessions' },
                ] as { type: TargetType; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[]).map(({ type, label, icon: Icon, desc }) => (
                  <button
                    key={type}
                    onClick={() => { setTargetType(type); setTargetId(''); }}
                    className={`card p-4 text-left transition-all ${targetType === type ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/30'}`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${targetType === type ? 'text-primary' : 'text-text-muted'}`} />
                    <p className="text-sm font-medium text-text">{label}</p>
                    <p className="text-xs text-text-muted mt-1">{desc}</p>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1">
                  {targetType === 'user' ? 'Select User' : targetType === 'document' ? 'Select Document' : 'Department Name'}
                </label>
                {targetType === 'user' ? (
                  <select className="input" value={targetId} onChange={e => setTargetId(e.target.value)}>
                    <option value="">— Select user —</option>
                    {MOCK_USERS.map(u => <option key={u.uid} value={u.uid}>{u.name} ({u.email})</option>)}
                  </select>
                ) : targetType === 'document' ? (
                  <select className="input" value={targetId} onChange={e => setTargetId(e.target.value)}>
                    <option value="">— Select document —</option>
                    {MOCK_DOCUMENTS.map(d => <option key={d.document_id} value={d.document_id}>{d.title}</option>)}
                  </select>
                ) : (
                  <input className="input" placeholder="e.g. CSE" value={targetId} onChange={e => setTargetId(e.target.value)} />
                )}
              </div>
              <Button variant="primary" disabled={!targetId} onClick={() => setStep(2)}>Next: Scope →</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-text">Step 2: Scope & Reason</h2>
              <div className="space-y-2">
                {['Revoke all permissions', 'Terminate all sessions', 'Invalidate shared links', 'Disable account access'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-text cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-danger" />
                    {opt}
                  </label>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1">Reason <span className="text-danger">*</span></label>
                <textarea
                  className="input h-24 resize-none"
                  placeholder="Describe the security incident or reason for revocation…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
                <p className="text-xs text-text-muted mt-1">Minimum 10 characters. This is permanently logged.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
                <Button variant="primary" disabled={reason.length < 10} onClick={() => setStep(3)}>Next: Confirm →</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-danger flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Step 3: Confirm Revocation
              </h2>
              <InlineAlert type="error" message={`This action is immediate and irreversible. ${targetLabel} will lose access on their next request.`} />
              <div>
                <p className="text-sm text-text mb-2">
                  Type <span className="font-mono font-semibold text-danger">{confirmWord}</span> to confirm:
                </p>
                <input
                  className="input border-danger focus-visible:ring-danger font-mono"
                  placeholder={confirmWord}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
                <Button variant="danger" disabled={!canConfirm} loading={loading} onClick={handleRevoke}>
                  🚨 Revoke Now
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Impact summary */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text mb-3">Impact Summary</h3>
          {targetId ? (
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Target</span>
                <span className="font-medium text-text text-right max-w-[150px] truncate">{targetLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Type</span>
                <span className="capitalize text-text">{targetType}</span>
              </div>
              <div className="border-t border-border my-2" />
              <p className="text-xs text-text-muted">Estimated impact:</p>
              <div className="flex justify-between text-sm"><span className="text-text-muted">Permissions</span><span className="text-danger font-semibold">~3</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-muted">Sessions</span><span className="text-danger font-semibold">~2</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-muted">Shared links</span><span className="text-danger font-semibold">~1</span></div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">Select a target to see impact.</p>
          )}
        </div>
      </div>
    </div>
  );
}
