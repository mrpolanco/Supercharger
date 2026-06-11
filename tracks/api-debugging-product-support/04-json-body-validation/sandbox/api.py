from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        return

    def send_json(self, status, payload, request_id):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("X-Request-ID", request_id)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/v1/tickets":
            self.send_json(404, {"error": {"code": "unknown_path"}}, "req_schema_unknown")
            return
        raw = self.rfile.read(int(self.headers.get("Content-Length", "0") or 0))
        try:
            data = json.loads(raw)
        except Exception:
            self.send_json(400, {"error": {"code": "invalid_json"}}, "req_schema_parse")
            return
        errors = []
        if not isinstance(data.get("customer_id"), str):
            errors.append("customer_id must be a string")
        if data.get("priority") not in ["normal", "high"]:
            errors.append("priority must be normal or high")
        if not isinstance(data.get("tags"), list):
            errors.append("tags must be an array")
        if not isinstance(data.get("summary"), str) or not data.get("summary"):
            errors.append("summary is required")
        if errors:
            self.send_json(422, {"error": {"code": "validation_failed", "fields": errors}}, "req_schema_422")
            return
        self.send_json(201, {"id": "tkt_900", "status": "created"}, "req_schema_ok")

HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
