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
        if self.path != "/v1/runs":
            self.send_json(404, {"error": {"code": "unknown_path"}}, "req_final_unknown")
            return
        if self.headers.get("Authorization") != "Bearer live_final_789":
            self.send_json(401, {"error": {"code": "invalid_api_key"}}, "req_final_auth")
            return
        raw = self.rfile.read(int(self.headers.get("Content-Length", "0") or 0))
        data = json.loads(raw)
        if not isinstance(data.get("input"), list):
            self.send_json(422, {"error": {"code": "validation_failed", "field": "input"}}, "req_final_422")
            return
        self.send_json(201, {"id": "run_900", "status": "queued"}, "req_final_ok")

HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
