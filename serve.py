#!/usr/bin/env python3
"""Serve the replica without dependencies: python3 serve.py [port]."""
import os,sys
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
os.chdir(Path(__file__).resolve().parent)
class Handler(SimpleHTTPRequestHandler):
 def do_POST(self):
  self.send_response(501);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"error":"Local preview: backend unavailable"}')
port=int(sys.argv[1]) if len(sys.argv)>1 else 8090
print(f'Vallfirest local replica: http://localhost:{port}',flush=True)
ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
