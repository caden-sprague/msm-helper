"""
Download monster art from the wiki, scale to 128px, convert to WebP, and write
public/icons/<monster-id>.webp. Sets Monster.icon.

    python3 scripts/fetch_icons.py

An authoring tool, not part of the build. Art is Big Blue Bubble's; see NOTICE.md.
"""
import json, pathlib, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from PIL import Image

API = 'https://mysingingmonsters.fandom.com/api.php'
SIZE = 128
OUT = pathlib.Path('public/icons')


def resolve(names):
    """{page title -> file url} for File:<name>.png."""
    found = {}
    titles = [f'File:{n}.png' for n in names]
    for i in range(0, len(titles), 40):
        args = ['curl', '-sG', '--data-urlencode', 'titles=' + '|'.join(titles[i:i + 40]),
                '--data', 'action=query&prop=imageinfo&iiprop=url&format=json&formatversion=2',
                '-A', 'MsmHelperResearch/0.1', API]
        data = json.loads(subprocess.run(args, capture_output=True, text=True).stdout)
        # The API normalises titles, so map back to what we asked for.
        back = {n['to']: n['from'] for n in data['query'].get('normalized', [])}
        for p in data['query']['pages']:
            if p.get('imageinfo'):
                found[back.get(p['title'], p['title'])] = p['imageinfo'][0]['url']
    return found


def download(url):
    # The CDN serves pre-scaled renditions; ask for one rather than the full-size art.
    base, _, query = url.partition('?')
    scaled = f'{base}/scale-to-width-down/{SIZE}' + (f'?{query}' if query else '')
    raw = subprocess.run(['curl', '-sL', '-A', 'Mozilla/5.0', scaled],
                         capture_output=True).stdout
    return raw if raw[:4] not in (b'<!DO', b'<htm') and len(raw) > 500 else None


def main():
    monsters = json.loads(pathlib.Path('src/data/monsters.json').read_text())
    urls = resolve([m['name'] for m in monsters])
    OUT.mkdir(parents=True, exist_ok=True)

    def one(m):
        url = urls.get(f"File:{m['name']}.png")
        if not url:
            return m['id'], None
        raw = download(url)
        if not raw:
            return m['id'], None
        img = Image.open(BytesIO(raw)).convert('RGBA')
        if max(img.size) > SIZE:
            img.thumbnail((SIZE, SIZE), Image.LANCZOS)
        path = OUT / f"{m['id']}.webp"
        img.save(path, 'WEBP', quality=82, method=6)
        return m['id'], path.name

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = dict(pool.map(one, monsters))

    ok = 0
    for m in monsters:
        name = results.get(m['id'])
        if name:
            m['icon'] = name
            ok += 1
        else:
            m.pop('icon', None)
            print('  no art:', m['id'], file=sys.stderr)
    pathlib.Path('src/data/monsters.json').write_text(json.dumps(monsters, indent=2) + '\n')

    total = sum(f.stat().st_size for f in OUT.glob('*.webp'))
    print(f'{ok}/{len(monsters)} icons, {total / 1024:.0f} KB total')


if __name__ == '__main__':
    main()
