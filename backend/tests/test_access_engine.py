import asyncio
import os
import sys
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.access_engine import (
    EMERGENCY_LOCKED_DOCS,
    MOCK_IP_MAP,
    MOCK_SESSIONS,
    MOCK_USERS,
    REVOKED_TOKENS,
    run_access_engine,
)


class TestZeroTrustAccessEngine(unittest.TestCase):
    def setUp(self):
        MOCK_SESSIONS.clear()
        MOCK_IP_MAP.clear()
        REVOKED_TOKENS.clear()
        EMERGENCY_LOCKED_DOCS.clear()

        now = datetime.now(timezone.utc).isoformat()
        MOCK_SESSIONS['tok_admin'] = {**MOCK_USERS['usr_admin_001'], 'last_active': now, 'last_reauth': now}
        MOCK_SESSIONS['tok_fac1'] = {**MOCK_USERS['usr_fac_9921'], 'last_active': now, 'last_reauth': now}
        MOCK_SESSIONS['tok_stu1'] = {**MOCK_USERS['usr_stu_001'], 'last_active': now, 'last_reauth': now}

    def test_invalid_token_denied(self):
        res = asyncio.run(run_access_engine('missing_tok', 'DOC_CIRC_001', '127.0.0.1', None))
        self.assertFalse(res.allowed)
        self.assertEqual(res.reason_code, 'INVALID_TOKEN')

    def test_student_denied_confidential_exam(self):
        res = asyncio.run(run_access_engine('tok_stu1', 'DOC_EXAM_CS301_2024', '127.0.0.1', None))
        self.assertFalse(res.allowed)
        self.assertEqual(res.reason_code, 'ROLE_UNAUTHORIZED')

    def test_faculty_subject_mismatch_denied(self):
        res = asyncio.run(run_access_engine('tok_fac1', 'DOC_EXAM_CS302_2024', '127.0.0.1', None))
        self.assertFalse(res.allowed)
        self.assertEqual(res.reason_code, 'SUBJECT_MISMATCH')

    def test_faculty_matching_subject_allowed(self):
        res = asyncio.run(run_access_engine('tok_fac1', 'DOC_EXAM_CS301_2024', '127.0.0.1', None))
        self.assertTrue(res.allowed)

    def test_emergency_lockdown_blocks_admin(self):
        EMERGENCY_LOCKED_DOCS.add('DOC_EXAM_CS301_2024')
        res = asyncio.run(run_access_engine('tok_admin', 'DOC_EXAM_CS301_2024', '127.0.0.1', None))
        self.assertFalse(res.allowed)
        self.assertEqual(res.reason_code, 'EMERGENCY_LOCKDOWN')


if __name__ == '__main__':
    unittest.main()
