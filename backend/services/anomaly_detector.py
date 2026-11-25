"""
Deterministic Behavioral Anomaly Detection & Security Telemetry Engine.

Analyzes audit event streams for suspicious patterns (denial bursts, multi-IP
session switching, and off-hours sensitive document access). Strictly advisory:
telemetry NEVER overrides or replaces the 10-step Zero-Trust Access Engine.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any


def _parse_iso(ts: str) -> datetime:
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def detect_anomalies(
    audit_events: list[dict[str, Any]],
    denial_burst_threshold: int = 3,
    window_minutes: int = 10,
) -> list[dict[str, Any]]:
    """Return explainable behavioral security anomalies sorted by risk_score descending."""
    anomalies: list[dict[str, Any]] = []
    by_user: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for event in audit_events:
        uid = event.get("user_uid") or event.get("user_id") or "unknown"
        by_user[uid].append(event)

    for uid, events in by_user.items():
        sorted_events = sorted(events, key=lambda e: e.get("timestamp", ""))

        # 1. Denial burst detection within sliding window
        denies = [e for e in sorted_events if e.get("action") == "DENY" and e.get("timestamp")]
        if len(denies) >= denial_burst_threshold:
            first_ts = _parse_iso(denies[0]["timestamp"])
            last_ts = _parse_iso(denies[-1]["timestamp"])
            span_mins = (last_ts - first_ts).total_seconds() / 60.0
            if span_mins <= window_minutes:
                anomalies.append({
                    "user_uid": uid,
                    "user_email": denies[-1].get("user_email"),
                    "anomaly_type": "DENIAL_BURST",
                    "severity": "high" if len(denies) >= 5 else "medium",
                    "risk_score": min(95, 50 + len(denies) * 10),
                    "detail": f"{len(denies)} denied access attempts within {span_mins:.1f} minutes",
                    "detected_at": denies[-1]["timestamp"],
                })

        # 2. Multi-IP rapid switching (potential credential/token replay)
        ips_with_ts = [
            (e.get("client_ip") or e.get("ip_address"), _parse_iso(e["timestamp"]), e["timestamp"])
            for e in sorted_events
            if (e.get("client_ip") or e.get("ip_address")) and e.get("timestamp")
        ]
        distinct_ips = {ip for ip, _, _ in ips_with_ts}
        if len(distinct_ips) > 1 and len(ips_with_ts) >= 2:
            span_mins = (ips_with_ts[-1][1] - ips_with_ts[0][1]).total_seconds() / 60.0
            if span_mins <= window_minutes:
                anomalies.append({
                    "user_uid": uid,
                    "user_email": sorted_events[-1].get("user_email"),
                    "anomaly_type": "MULTI_IP_SWITCHING",
                    "severity": "critical",
                    "risk_score": 90,
                    "detail": f"Activity from {len(distinct_ips)} distinct IPs ({', '.join(sorted(distinct_ips))}) within {span_mins:.1f} minutes",
                    "detected_at": ips_with_ts[-1][2],
                })

        # 3. Off-hours access (00:00-05:59 UTC)
        for ev in sorted_events:
            ts = ev.get("timestamp")
            if not ts or ev.get("action") != "ALLOW":
                continue
            dt = _parse_iso(ts)
            if 0 <= dt.hour < 6:
                anomalies.append({
                    "user_uid": uid,
                    "user_email": ev.get("user_email"),
                    "anomaly_type": "OFF_HOURS_ACCESS",
                    "severity": "low",
                    "risk_score": 35,
                    "detail": f"Document {ev.get('document_id', 'unknown')} accessed at {dt.strftime('%H:%M UTC')}",
                    "detected_at": ts,
                })

    return sorted(anomalies, key=lambda a: a["risk_score"], reverse=True)
