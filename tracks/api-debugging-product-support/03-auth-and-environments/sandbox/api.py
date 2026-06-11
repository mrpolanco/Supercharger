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
        auth = self.headers.get("Authorization", "")
        if self.path != "/v1/invoices/inv_200":
            self.send_json(404, {"error": {"code": "unknown_path"}}, "req_auth_unknown")
            return
        if auth == "Bearer live_sk_correct_456":
            self.send_json(200, {"id": "inv_200", "amount": 4200, "status": "open"}, "req_auth_ok")
            return
        self.send_json(401, {"error": {"code": "invalid_api_key", "message": "Token is not valid for the production environment."}}, "req_auth_401")

HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
