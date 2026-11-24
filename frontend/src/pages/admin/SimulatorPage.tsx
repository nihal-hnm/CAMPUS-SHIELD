import React, { useState } from 'react';
import { FlaskConical, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MOCK_USERS, MOCK_DOCUMENTS } from '../../mocks/data';

export default function SimulatorPage() {
  const [userId, setUserId] = useState('');
  const [docId, setDocId] = useState('');
  const [action, setAction] = useState('View');
  const [result, setResult] = useState<{ allowed: boolean; reason?: string; trace: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function evaluate() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const user = MOCK_USERS.find(u => u.uid === userId);
    const doc = MOCK_DOCUMENTS.find(d => d.document_id === docId);
    if (!user || !doc) { setResult({ allowed: false, reason: 'User or document not found', trace: [] }); setLoading(false); return; }

    const trace: string[] = [];
    trace.push('✅ Account active');
    trace.push('✅ Session valid');
    
    if (doc.emergency_locked) { setResult({ allowed: false, reason: 'EMERGENCY_LOCKDOWN', trace: [...trace, '❌ Document emergency lockdown active'] }); setLoading(false); return; }
    trace.push('✅ No revocation active');
    
    if (doc.classification === 'confidential' && user.role === 'student') {
      setResult({ allowed: false, reason: 'ROLE_UNAUTHORIZED', trace: [...trace, '❌ RBAC: student cannot access confidential'] }); setLoading(false); return;
    }
    trace.push('✅ RBAC baseline passed');
    
    if (user.special_tags.includes('financial_auditor') && doc.category === 'exam_paper') {
      setResult({ allowed: false, reason: 'TAG_SCOPE', trace: [...trace, '❌ ABAC: financial_auditor cannot access exam papers'] }); setLoading(false); return;
    }
    if (user.special_tags.includes('HOD') && user.department === doc.department) {
      setResult({ allowed: true, trace: [...trace, '✅ ABAC: HOD override granted for department'] }); setLoading(false); return;
    }
    if (user.role === 'faculty' && doc.classification === 'confidential' && doc.subject_id && !user.assigned_subjects.includes(doc.subject_id)) {
      setResult({ allowed: false, reason: `SUBJECT_MISMATCH (User: ${user.assigned_subjects.join(',')}, Doc: ${doc.subject_id})`, trace: [...trace, '❌ ABAC: subject isolation failed'] }); setLoading(false); return;
    }
    trace.push('✅ ABAC rules passed');
    setResult({ allowed: true, trace });
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-text">Permission Simulator</h1><p className="text-sm text-text-muted mt-1">Dry-run the policy engine: would user X be allowed to do action Y on document Z right now?</p></div>
      <div className="p-3 bg-warning-soft border border-warning/20 rounded text-xs text-warning-dark">⚠️ Simulation only — no access is granted and nothing is logged.</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-text flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" />Inputs</h2>
          <div>
            <label className="text-sm font-medium text-text block mb-1">User</label>
            <select className="input" value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">— Select user —</option>
              {MOCK_USERS.map(u => <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1">Document</label>
            <select className="input" value={docId} onChange={e => setDocId(e.target.value)}>
              <option value="">— Select document —</option>
              {MOCK_DOCUMENTS.map(d => <option key={d.document_id} value={d.document_id}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1">Action</label>
            <select className="input" value={action} onChange={e => setAction(e.target.value)}>
              {['View', 'Download', 'Share', 'Edit'].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" disabled={!userId || !docId} loading={loading} onClick={evaluate}>Evaluate</Button>
            <Button variant="secondary" onClick={() => { setResult(null); setUserId(''); setDocId(''); }}>Reset</Button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold text-text mb-4">Result</h2>
          {!result ? (
            <div className="text-sm text-text-muted">Select a user and document, then click Evaluate.</div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded ${result.allowed ? 'bg-success-soft' : 'bg-danger-soft'}`}>
                {result.allowed
                  ? <ShieldCheck className="w-7 h-7 text-success" />
                  : <ShieldX className="w-7 h-7 text-danger" />
                }
                <div>
                  <p className={`text-lg font-semibold ${result.allowed ? 'text-success' : 'text-danger'}`}>
                    {result.allowed ? 'ALLOW' : 'DENY'}
                  </p>
                  {result.reason && <p className="font-mono text-xs text-text-muted mt-0.5">{result.reason}</p>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-text mb-2">Evaluation Trace</p>
                <div className="space-y-1">
                  {result.trace.map((step, i) => (
                    <p key={i} className={`text-xs font-mono px-2 py-1 rounded ${step.startsWith('✅') ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{step}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
