"""
One-off wiki extraction helpers. NOT part of the build — data is extracted once and
committed. See docs/DATA-CONTRIBUTION.md.
"""
import json, re, subprocess, urllib.parse

API = "https://mysingingmonsters.fandom.com/api.php"
ELEMENT_ORDER = ['plant', 'cold', 'air', 'water', 'earth']
# Everything after these markers is failure-breeding or rare-substitution advice.
STOP = ['breeding failure', 'failed breeding', 'Used in Breeding',
        'Rare version of any Monster', 'can also be bred in', 'in a breeding failure']


def fetch(titles):
    """Fetch page wikitext for up to 50 titles at a time."""
    out = {}
    for i in range(0, len(titles), 40):
        chunk = titles[i:i + 40]
        args = ['curl', '-sG', '--data-urlencode', 'titles=' + '|'.join(chunk),
                '--data', 'action=query&prop=revisions&rvprop=content&rvslots=main'
                          '&format=json&formatversion=2',
                '-A', 'MsmHelperResearch/0.1', API]
        data = json.loads(subprocess.run(args, capture_output=True, text=True).stdout)
        for p in data['query']['pages']:
            if p.get('missing'):
                out[p['title']] = None
            else:
                out[p['title']] = p['revisions'][0]['slots']['main']['content']
    return out


def slug(name):
    name = name.strip().replace("'", '').replace('$', 's')
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def iso(text):
    """'1 day 12 hours' / '30 minutes' -> ISO 8601 duration."""
    if not text:
        return None
    units = {'day': 'D', 'hour': 'H', 'minute': 'M', 'second': 'S'}
    found = re.findall(r'(\d+)\s*(day|hour|minute|second)', text)
    if not found:
        return None
    date, time = '', ''
    for n, unit in found:
        if unit == 'day':
            date += f'{n}D'
        else:
            time += f'{n}{units[unit]}'
    return 'P' + date + ('T' + time if time else '')


def elements_of(content):
    els = [e[1].strip().lower() for e in re.findall(r'\|element(\d)\s*=\s*([^\n|]+)', content)]
    known = [e for e in ELEMENT_ORDER if e in els]
    extra = [e for e in els if e not in ELEMENT_ORDER]
    return known + extra


def breeding_time(content):
    m = re.search(r'breeding time is ([^.]+?)(?: long)?\.', content)
    return iso(m.group(1)) if m else None


def islands_of(content):
    m = re.search(r'\|island\(s\)\s*=\s*([^\n]*)', content)
    return m.group(1) if m else ''


def combo_section(content, island_name=None):
    i = content.find('==Breeding==')
    if i == -1:
        return ''
    section = content[i:i + 6000]
    cuts = [section.find(s) for s in STOP if section.find(s) != -1]
    # "On [[Shugabush Island]], Quibble must either be purchased..." introduces combos
    # that only apply on another island. Those belong to that island's extraction.
    # Cut at prose introducing *another* island's combos. Not the island being
    # extracted: those sections often open with "On [[Cold Island]], ...".
    for m in re.finditer(r'On \[\[([^\]]+?)\]\]', section):
        if island_name and m.group(1).strip() == island_name:
            continue
        if m.start() > 0:
            cuts.append(m.start())
    return section[:min(cuts)] if cuts else section


def combos_in(section):
    """[(a, b, island_or_None)] in page order."""
    out = []
    for m in re.finditer(r'\{\{BreedingCombo(?:/Entry)?\|([^}]*)\}\}', section):
        body = m.group(1)
        island = None
        im = re.search(r'island\s*=\s*([^|}]+)', body)
        if im:
            island = im.group(1).strip()
        parts = [p.strip() for p in body.split('|')
                 if p.strip() and '=' not in p and p.strip() not in ('Top', 'End')]
        if len(parts) >= 2:
            out.append((parts[0], parts[1], island))
    return out


def ranking(content):
    """{(a_slug, b_slug): (rank, advice)} from the ":''Of these, ...''" line."""
    m = re.search(r":''Of these,([^\n]+)''", content)
    if not m:
        return {}
    text = m.group(1)
    result = {}
    patterns = [
        (1, r'\[\[([^\]]+)\]\]\s*\+\s*\[\[([^\]]+)\]\] is the best combination,?([^.]*)'),
        (2, r'\[\[([^\]]+)\]\]\s*\+\s*\[\[([^\]]+)\]\] is a close second,?([^.]*)'),
    ]
    for rank, pat in patterns:
        mm = re.search(pat, text)
        if not mm:
            continue
        pair = tuple(sorted([slug(mm.group(1)), slug(mm.group(2))]))
        reason = re.sub(r'\[\[([^\]|]+)\|?[^\]]*\]\]', r'\1', mm.group(3))
        reason = re.sub(r'\s+', ' ', reason).strip().rstrip('.').strip()
        reason = re.sub(r'^(as|because)\s+', '', reason)
        result[pair] = (rank, reason[:1].upper() + reason[1:] if reason else None)
    return result


def rendered_breeding_time(title):
    """
    Market-bought singles have no breeding time in the prose; it only appears in the
    rendered 'Breeding/Incubation Time' infobox table. The table lists Default then
    Enhanced as separate cells, so take the first cell and don't collapse the
    newlines that separate them. Within a cell, parts are joined by nbsp ("1h 30m").
    """
    import html as _html
    args = ['curl', '-sG', '--data-urlencode', f'page={title}',
            '--data', 'action=parse&prop=text&format=json&formatversion=2',
            '-A', 'MsmHelperResearch/0.1', API]
    raw = subprocess.run(args, capture_output=True, text=True).stdout
    try:
        text = json.loads(raw)['parse']['text']
    except Exception:
        return None
    text = _html.unescape(re.sub(r'<[^>]+>', ' ', text))
    i = text.find('Breeding/Incubation Time')
    if i == -1:
        return None
    cell = re.compile(r'^[ \t]*((?:\d+\s*[dhms])(?:[\s\u00a0]*\d+\s*[dhms])*)[ \t]*$')
    for line in text[i:i + 800].split('\n'):
        m = cell.match(line)
        if not m:
            continue
        parts = re.findall(r'(\d+)\s*([dhms])', m.group(1))
        unit_word = {'d': 'day', 'h': 'hour', 'm': 'minute', 's': 'second'}
        return iso(' '.join(f'{n} {unit_word[u]}' for n, u in parts))
    return None
