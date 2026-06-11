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
        if self.path != "/v1/messages":
            self.send_json(404, {"error": {"code": "unknown_path"}}, "req_msg_unknown")
            return
        raw = self.rfile.read(int(self.headers.get("Content-Length", "0") or 0))
        data = json.loads(raw)
        if "recipient_id" not in data:
            self.send_json(422, {"error": {"code": "missing_required_field", "field": "recipient_id"}}, "req_msg_422")
            return
        self.send_json(201, {"id": "msg_123", "status": "queued"}, "req_msg_ok")

HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
