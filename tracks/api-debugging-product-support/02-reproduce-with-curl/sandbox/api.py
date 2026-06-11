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

    def do_GET(self):
        if self.path == "/v1/orders/ord_missing":
            self.send_json(404, {
                "error": {
                    "code": "resource_not_found",
                    "message": "No order found for id ord_missing in the production environment."
                }
            }, "req_repro_404")
            return
        self.send_json(404, {"error": {"code": "unknown_path"}}, "req_unknown")

HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
