import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.anomaly_detector import detect_anomalies


class TestBehavioralAnomalyDetector(unittest.TestCase):
    def test_detects_denial_burst(self):
        events = [
            {
                "user_uid": "u_stu_1",
                "user_email": "stu@college.edu",
                "action": "DENY",
                "client_ip": "10.0.0.5",
                "timestamp": f"2026-11-25T10:0{i}:00+00:00",
            }
            for i in range(4)
        ]
        anomalies = detect_anomalies(events)
        types = [a["anomaly_type"] for a in anomalies]
        self.assertIn("DENIAL_BURST", types)

    def test_detects_multi_ip_switching(self):
        events = [
            {
                "user_uid": "u_fac_1",
                "user_email": "fac@college.edu",
                "action": "ALLOW",
                "client_ip": "10.0.0.1",
                "timestamp": "2026-11-25T12:00:00+00:00",
            },
            {
                "user_uid": "u_fac_1",
                "user_email": "fac@college.edu",
                "action": "ALLOW",
                "client_ip": "192.168.1.99",
                "timestamp": "2026-11-25T12:03:00+00:00",
            },
        ]
        anomalies = detect_anomalies(events)
        types = [a["anomaly_type"] for a in anomalies]
        self.assertIn("MULTI_IP_SWITCHING", types)


if __name__ == "__main__":
    unittest.main()
