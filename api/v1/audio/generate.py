import os
import json
import base64
import io
import wave
import requests
from http.server import BaseHTTPRequestHandler

DEFAULT_SYSTEM_PROMPT = (
    "Read the following transcript based on the performance and scene context.\n"
    "\n"
    "### SCENE\n"
    "A quiet children's bedroom, low light, with an attentive 4-year-old listening to every word.\n"
    "\n"
    "### PERFORMANCE\n"
    "Role: A parent reading a bedtime story.\n"
    "Style: Warm, understanding, and patient with gentle inflections. Speak unhurriedly with "
    "natural pauses to let the magic of the story settle.\n"
    "Accent: British (RP) from a member of the Royal family, having lived in London all their life.\n"
    "\n"
    "#### TRANSCRIPT"
)


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


def _pcm_to_wav(pcm_bytes):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1)    # mono
        w.setsampwidth(2)    # 16-bit = 2 bytes
        w.setframerate(24000)  # 24 kHz
        w.writeframes(pcm_bytes)
    return buf.getvalue()


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

        try:
            text = body.get('text', '')
            voice = body.get('voice', 'Zephyr')
            model = body.get('model') or os.environ.get('AUDIO_MODEL', 'gemini-2.5-flash-preview-tts')
            system_prompt = body.get('systemPrompt') or DEFAULT_SYSTEM_PROMPT

            full_text = f"{system_prompt}\n\n{text}"

            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:streamGenerateContent"
                f"?key={api_key}"
            )
            payload = {
                'contents': [{'role': 'user', 'parts': [{'text': full_text}]}],
                'generationConfig': {
                    'responseModalities': ['audio'],
                    'temperature': 0.5,
                    'speech_config': {
                        'voice_config': {
                            'prebuilt_voice_config': {'voice_name': voice},
                        },
                    },
                },
            }

            resp = requests.post(
                url,
                headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key},
                json=payload,
                timeout=180,
            )
            if not resp.ok:
                err = resp.json().get('error', {}).get('message', 'Unknown error')
                _send_json(self, 502, {'success': False, 'error': f"Gemini error: {err}"})
                return

            chunks = resp.json()
            if not isinstance(chunks, list):
                chunks = [chunks]

            pcm_chunks = []
            for chunk in chunks:
                parts = (
                    (chunk.get('candidates') or [{}])[0]
                    .get('content', {})
                    .get('parts', [])
                )
                for part in parts:
                    inline_data = part.get('inlineData') or part.get('inline_data')
                    if inline_data and inline_data.get('data'):
                        pcm_chunks.append(base64.b64decode(inline_data['data']))

            if not pcm_chunks:
                _send_json(self, 502, {'success': False, 'error': 'No audio data returned.'})
                return

            pcm_bytes = b''.join(pcm_chunks)
            wav_bytes = _pcm_to_wav(pcm_bytes)
            wav_b64 = base64.b64encode(wav_bytes).decode()
            duration = len(pcm_bytes) / (24000 * 2)

            _send_json(self, 200, {
                'success': True,
                'data': {
                    'audioUrl': f'data:audio/wav;base64,{wav_b64}',
                    'durationSeconds': round(duration, 2),
                },
            })

        except requests.Timeout:
            _send_json(self, 504, {'success': False, 'error': 'Audio generation failed.'})
        except Exception as e:
            _send_json(self, 500, {'success': False, 'error': 'Audio generation failed.'})
