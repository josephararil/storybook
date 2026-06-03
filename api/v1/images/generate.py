import os
import json
import re
import base64
import io
import requests
from http.server import BaseHTTPRequestHandler
from PIL import Image

_DIR = os.path.dirname(os.path.abspath(__file__))
_SOPHIE_PATH = os.path.join(_DIR, '..', '..', 'assets', 'sophie.jpg')
with open(_SOPHIE_PATH, 'rb') as _f:
    _SOPHIE_B64 = base64.b64encode(_f.read()).decode()


def _cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-SW-Token',
    }


def _check_auth(handler):
    expected = os.environ.get('SW_AUTH_TOKEN', '')
    provided = handler.headers.get('X-SW-Token', '')
    return expected and provided == expected


def _send_json(handler, status, body):
    data = json.dumps(body).encode()
    handler.send_response(status)
    for k, v in _cors_headers().items():
        handler.send_header(k, v)
    handler.send_header('Content-Type', 'application/json')
    handler.send_header('Content-Length', len(data))
    handler.end_headers()
    handler.wfile.write(data)


def sanitize_image_prompt(prompt):
    result = re.sub(r',?\s*featuring\s+\w+\.?\s*', ' ', prompt, flags=re.IGNORECASE)
    result = re.sub(
        r'\bfeature\s+the\s+(?:child|girl|boy)\s+\w+\s+prominently[,.]?\s*',
        '',
        result,
        flags=re.IGNORECASE,
    )
    result = re.sub(r'\bchild\b', 'illustrated character', result, flags=re.IGNORECASE)
    result = re.sub(r'\s{2,}', ' ', result).strip()
    return result


def _compress_to_webp(image_b64):
    image_bytes = base64.b64decode(image_b64)
    img = Image.open(io.BytesIO(image_bytes))
    buf = io.BytesIO()
    img.save(buf, 'WEBP', quality=80)
    return base64.b64encode(buf.getvalue()).decode()


def _call_gemini_image(prompt, ref_b64, ref_mime, model, api_key, timeout_s):
    parts = [{'text': prompt}]
    if ref_b64:
        parts.append({'inline_data': {'mime_type': ref_mime, 'data': ref_b64}})

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    payload = {
        'contents': [{'role': 'user', 'parts': parts}],
        'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']},
    }
    resp = requests.post(
        url,
        headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key},
        json=payload,
        timeout=timeout_s,
    )
    if not resp.ok:
        raise Exception(f"API error {resp.status_code}")
    return resp.json()


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(204)
        for k, v in _cors_headers().items():
            self.send_header(k, v)
        self.end_headers()

    def do_POST(self):
        if not _check_auth(self):
            _send_json(self, 401, {'success': False, 'error': 'Unauthorised'})
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(content_length)
            body = json.loads(raw) if raw else {}
        except Exception:
            _send_json(self, 400, {'success': False, 'error': 'Invalid JSON body.'})
            return

        api_key = os.environ.get('GEMINI_API_KEY', '')
        if not api_key:
            _send_json(self, 500, {'success': False, 'error': 'Server misconfiguration: missing API key.'})
            return

        prompt = body.get('prompt', '')
        model = body.get('model') or os.environ.get('IMAGE_MODEL', 'gemini-2.5-flash-image')

        # Use caller-supplied reference image if provided, otherwise fall back to Sophie
        ref_image = body.get('referenceImage')
        if ref_image and ref_image.get('data'):
            default_ref_b64 = ref_image['data']
            default_ref_mime = ref_image.get('mimeType', 'image/jpeg')
        else:
            default_ref_b64 = _SOPHIE_B64
            default_ref_mime = 'image/jpeg'

        safe_prompt = sanitize_image_prompt(prompt)

        attempts = [
            (prompt,       default_ref_b64,  default_ref_mime,  45),
            (safe_prompt,  default_ref_b64,  default_ref_mime,  30),
            (safe_prompt,  None,             'image/jpeg',      30),
        ]

        for attempt_prompt, ref_b64, ref_mime, timeout_s in attempts:
            try:
                data = _call_gemini_image(
                    attempt_prompt, ref_b64, ref_mime, model, api_key, timeout_s
                )
            except Exception:
                continue

            candidate = (data.get('candidates') or [{}])[0]
            if candidate.get('finishReason') == 'PROHIBITED_CONTENT':
                _send_json(self, 422, {'success': False, 'error': 'Content blocked by safety filters.'})
                return

            parts = candidate.get('content', {}).get('parts', [])
            img_part = next(
                (p for p in parts if p.get('inlineData') or p.get('inline_data')),
                None,
            )
            if img_part:
                inline_data = img_part.get('inlineData') or img_part.get('inline_data')
                try:
                    webp_b64 = _compress_to_webp(inline_data['data'])
                except Exception:
                    webp_b64 = inline_data['data']
                _send_json(self, 200, {
                    'success': True,
                    'data': {'imageUrl': f'data:image/webp;base64,{webp_b64}'},
                })
                return

        _send_json(self, 502, {'success': False, 'error': 'Image generation failed after 3 attempts.'})
