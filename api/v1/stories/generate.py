import os
import json
import re
import requests
from http.server import BaseHTTPRequestHandler

MIN_PAGES = 4
MAX_PAGES = 10

VALID_SCENES = ['moon', 'fox', 'unicorn', 'whale', 'dragon', 'bear', 'cloud', 'turtle']
VALID_CATEGORIES = ['Bedtime', 'Animals', 'Magic', 'Adventure', 'Friends']
TONE_WORDS = ['Calming', 'Cozy', 'Gentle', 'Playful', 'Adventurous']

PAGE_SCHEMA = {
    'type': 'OBJECT',
    'properties': {
        'text':        {'type': 'STRING'},
        'imagePrompt': {'type': 'STRING'},
        'audioPrompt': {'type': 'STRING'},
    },
    'required': ['text', 'imagePrompt', 'audioPrompt'],
    'propertyOrdering': ['text', 'imagePrompt', 'audioPrompt'],
}

STORY_SCHEMA = {
    'type': 'OBJECT',
    'properties': {
        'id':       {'type': 'STRING'},
        'title':    {'type': 'STRING'},
        'category': {'type': 'STRING', 'enum': ['Bedtime', 'Animals', 'Magic', 'Adventure', 'Friends']},
        'rating':   {'type': 'INTEGER'},
        'palette':  {'type': 'ARRAY', 'items': {'type': 'STRING'}},
        'scene':    {'type': 'STRING', 'enum': ['moon', 'fox', 'unicorn', 'whale', 'dragon', 'bear', 'cloud', 'turtle']},
        'vocab':    {'type': 'ARRAY', 'items': {'type': 'STRING'}},
        'pages':    {
            'type': 'ARRAY',
            'items': PAGE_SCHEMA,
            'minItems': MIN_PAGES,
            'maxItems': MAX_PAGES,
        },
    },
    'required': ['id', 'title', 'category', 'rating', 'palette', 'scene', 'vocab', 'pages'],
    'propertyOrdering': ['id', 'title', 'category', 'rating', 'palette', 'scene', 'vocab', 'pages'],
}


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


def slugify(title):
    slug = (title or 'story').lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug).strip()
    slug = re.sub(r'\s+', '-', slug)
    return slug or 'story'


def build_system_prompt(form, child_name, child_appearance, target_pages):
    tone = form.get('tone', 'Gentle')
    if isinstance(tone, str):
        tone_word = tone.strip() or 'Gentle'
    else:
        idx = (int(tone) or 3) - 1
        tone_word = TONE_WORDS[idx] if 0 <= idx < len(TONE_WORDS) else 'Gentle'

    character = (form.get('character') or '').strip()
    if character:
        companion_line = (
            f"Companion: {child_name} meets {character}. "
            "The meeting is warm and joyful. No other characters."
        )
    else:
        companion_line = (
            "Companion: Exactly one friendly animal or magical creature. "
            "No other characters."
        )

    story_style = form.get('storyStyle', 'prose')
    if story_style == 'rhyme':
        sentence_rules = (
            "Structure: Write in rhythmic, rhyming verse (AABB couplets). "
            "Style: Emulate Julia Donaldson — use a predictable, suspenseful pace with a "
            "rhythmic, rhyming verse that uses a repetitive, cumulative structure that is highly "
            "engaging for children. "
            "Language: Use simple, comforting vocabulary suitable for a 4-year-old. "
            "Every rhyme must be a true rhyme."
        )
    else:
        sentence_rules = (
            "Structure: Use short, clear sentences. Vary the rhythm so it sounds natural and "
            "conversational when read aloud. Use present tense."
        )

    if target_pages <= 3:
        narrative_arc = [
            f"Page 1. Discovery & Meeting: {child_name} finds a magical element in a safe setting "
            f"and warmly meets her companion.",
            "Page 2. Exploration: They play and collaborate using a gentle magical mechanic.",
            f"Page 3. Resolution: A soft transition to rest. {child_name} feels safe and sleepy. "
            "End peacefully.",
        ]
    else:
        middle_count = target_pages - 3
        narrative_arc = [
            f"Page 1. Discovery & Meeting: {child_name} finds a magical element in a safe setting "
            f"and warmly introduces herself to her companion.",
            f"Pages 2 to {1 + middle_count}. Exploration: Across these middle pages, they explore "
            "and play using a gentle magical mechanic. Deepen their connection.",
            f"Page {2 + middle_count}. Comfort: A gentle transition toward rest. A soft problem is "
            "solved or a quiet realization is shared.",
            f"Page {3 + middle_count}. Resolution: The companion settles down. {child_name} feels "
            "safe, loved, and sleepy. End on absolute warmth and peace.",
        ]

    lines = [
        "You are an expert children's author writing warm, comforting bedtime stories. "
        "Return ONLY valid JSON matching the exact schema requested.",
        "",
        "[CHARACTER & TONE]",
        f"Main character: {child_name}. Imaginative, brave, and active—she drives the action.",
        companion_line,
        f"Tone: {tone_word} — permeate every sentence with this feeling.",
        "Atmosphere: Weave in gentle sensory details (soft hums, textures, gentle glows). "
        "Focus on comfort and wonder.",
        "Localization: Use strict British English spelling and terminology "
        "(e.g., pyjamas, garden, colour, mum).",
        "",
        "[STYLE & FORMATTING]",
        sentence_rules,
        "Vocabulary Requirement: Every word in the provided vocabulary list MUST appear in at "
        "least one page's \"text\" field, wrapped in curly braces (e.g., {gentle}). "
        "Do not alter the word inside the braces.",
        "",
        f"[NARRATIVE ARC ({target_pages} total pages)]",
        *narrative_arc,
        "",
        "[PAGE FIELDS — required for every page object]",
        "text: On-screen prose for this page. ≤ ~35 words. Designed to be heard out loud while "
        "a single illustration is shown. Vocab braces apply here only.",
        f"imagePrompt: Dense, concrete scene description for the image model. Include: setting, "
        f"characters (describe {child_name} as \"{child_appearance}\"), their action, lighting, "
        "mood, and art style (soft watercolour children's book illustration). Ensure the "
        "companion's visual description remains identical on every page. No text or lettering "
        "in the image. ~40–60 words.",
        "audioPrompt: Narration text for the TTS Model. The spoken words MUST be 100% identical "
        "to the \"text\" field so the audio perfectly matches the screen. 1) Remove all {vocab} "
        "braces. 2) Inject inline audio tag modifiers ([tag]) to control delivery. Be creative "
        "with tags to make it engaging, like a real parent reading to their child. "
        "Example: \"[very happy] Sophie skips into her bedroom, [amazed] still wearing her shiny "
        "crown! [laughs]\"",
        "",
        "[JSON SCHEMA OUTPUT]",
        "scene ∈ {moon,fox,unicorn,whale,dragon,bear,cloud,turtle}",
        "category ∈ {Bedtime,Animals,Magic,Adventure,Friends}",
        "palette: Exactly 3 #rrggbb hex codes (dark base, mid tone, light accent). "
        "id: kebab-case from title. rating: 0.",
        f"pages: Array of exactly {target_pages} page objects, one per narrative page. "
        "Each must have text, imagePrompt, and audioPrompt.",
    ]

    return '\n'.join(line for line in lines if line)


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
            context = body.get('context', '')
            vocabulary = body.get('vocabulary', [])
            target_pages = max(MIN_PAGES, min(MAX_PAGES, int(body.get('targetPages', 6))))
            tone = body.get('tone', 'Gentle')
            story_style = body.get('storyStyle', 'prose')
            character = body.get('character', '')
            child_name = body.get('childName', 'Sophie')
            custom_prompt = body.get('customSystemPrompt', '')

            model = os.environ.get('TEXT_MODEL', 'gemini-2.5-flash')

            form = {'tone': tone, 'storyStyle': story_style, 'character': character}
            if custom_prompt:
                system_prompt = custom_prompt
            else:
                system_prompt = build_system_prompt(form, child_name, target_pages, target_pages)

            vocab_suffix = f"\nVocabulary: {', '.join(vocabulary)}" if vocabulary else ''
            user_message = (
                f"Context: {context}\nTone: {tone}\n"
                f"Target length: ~{target_pages} pages{vocab_suffix}"
            )

            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:generateContent"
            )
            payload = {
                'systemInstruction': {'parts': [{'text': system_prompt}]},
                'contents': [{'role': 'user', 'parts': [{'text': user_message}]}],
                'generationConfig': {
                    'responseMimeType': 'application/json',
                    'responseSchema': STORY_SCHEMA,
                },
            }

            resp = requests.post(
                url,
                headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key},
                json=payload,
                timeout=60,
            )
            if not resp.ok:
                err = resp.json().get('error', {}).get('message', 'Unknown error')
                _send_json(self, 502, {'success': False, 'error': f"Gemini error: {err}"})
                return

            data = resp.json()
            if data.get('promptFeedback', {}).get('blockReason'):
                _send_json(self, 422, {'success': False, 'error': 'The story was blocked — try gentler wording.'})
                return

            try:
                story = json.loads(data['candidates'][0]['content']['parts'][0]['text'])
            except (KeyError, IndexError, json.JSONDecodeError):
                _send_json(self, 502, {'success': False, 'error': 'Gemini returned an unexpected response. Please try again.'})
                return

            story['rating'] = 0
            palette = story.get('palette', [])
            story['palette'] = (
                palette[:3] if isinstance(palette, list) and len(palette) >= 3
                else ['#0f172a', '#312e81', '#fbbf24']
            )
            story['scene'] = story.get('scene') if story.get('scene') in VALID_SCENES else 'moon'
            story['category'] = story.get('category') if story.get('category') in VALID_CATEGORIES else 'Bedtime'
            if not isinstance(story.get('pages'), list):
                story['pages'] = []
            if not isinstance(story.get('vocab'), list):
                story['vocab'] = []
            story['id'] = slugify(story.get('title', ''))

            _send_json(self, 200, {'success': True, 'data': story})

        except requests.Timeout:
            _send_json(self, 504, {'success': False, 'error': 'Request to Gemini timed out.'})
        except Exception as e:
            _send_json(self, 500, {'success': False, 'error': str(e)})
