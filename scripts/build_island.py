"""
Extract one island's data from the wiki and merge it into src/data/.

    python3 scripts/build_island.py "Air Island" air '#c9d94a' 3

Idempotent: existing monsters gain the island, existing combos are left alone.
An authoring tool, not part of the build. See docs/DATA-CONTRIBUTION.md.
"""
import sys, json, pathlib
sys.path.insert(0, 'scripts')
import wiki

# The 30 Natural monsters. Which ones belong to an island is read from their pages,
# not assumed here.
NATURALS = [
    'Potbelly', 'Mammott', 'Toe Jammer', 'Noggin', 'Tweedle',
    'Dandidoo', 'Cybop', 'Quibble', 'Pango', 'Shrubb',
    'Oaktopus', 'Furcorn', 'Fwog', 'Drumpler', 'Maw',
    'Reedling', 'Spunge', 'Thumpies', 'Scups', 'PomPom',
    'Congle', 'Pummel', 'Clamble', 'Bowgart', 'T-Rox',
    'Shellbeat', 'Quarrister', 'Deedge', 'Riff', 'Entbrat',
]
SPECIAL_FIELDS = ['ethereal monster', 'seasonal monster', 'legendary monster',
                  'mythical monster', 'werdo 1', 'werdo 2', 'werdo 3', 'dipster']
ALWAYS = ['Wubbox']

RARE_SINGLE_NOTE = ("Rare Single-Elementals are bred from two Triple-Elementals that "
                    "share the Rare's element, so the parents carry more elements than "
                    "the target")
EPIC_NOTE = "Epic Monsters have island-specific combinations that do not follow the element rule"
PALETTE = ['#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16']


def load(name):
    return json.loads(pathlib.Path(f'src/data/{name}.json').read_text())


def save(name, data):
    pathlib.Path(f'src/data/{name}.json').write_text(json.dumps(data, indent=2) + '\n')


def main(island_name, island_id, color, order):
    monsters, combos = load('monsters'), load('combos')
    elements, islands = load('elements'), load('islands')
    by_id = {m['id']: m for m in monsters}
    have = {(c['target'], tuple(c['parents'])) for c in combos}
    known_elements = {e['id'] for e in elements}
    log = {'new': [], 'island': [], 'combos': 0, 'elements': []}

    island_page = wiki.fetch([island_name])[island_name]
    natural_els = [e.strip().lower() for e in
                   __import__('re').findall(r'\|element\d\s*=\s*([^\n|]+)', island_page)]
    specials = []
    for field in SPECIAL_FIELDS:
        m = __import__('re').search(rf'\|{field}\s*=\s*([^\n|]*)', island_page)
        if m and m.group(1).strip() and 'Island' not in m.group(1):
            specials.append(m.group(1).strip())
    roster_extra = sorted(set(specials + ALWAYS))

    def element_id(raw):
        eid = raw.strip().lower().replace(' ', '-')
        if eid not in known_elements:
            elements.append({'id': eid, 'name': raw.strip().title(),
                             'family': 'other', 'color': PALETTE[len(elements) % len(PALETTE)]})
            known_elements.add(eid)
            log['elements'].append(eid)
        return eid

    def add_combo(target, pair, follows, note=None, scoped=False):
        key = (target, tuple(pair))
        if key in have or any(p not in by_id for p in pair):
            return
        row = {'target': target, 'parents': list(pair), 'followsElementRule': follows,
               'verified': True}
        if note:
            row['note'] = note
        if scoped:
            row['islands'] = [island_id]
        combos.append(row)
        have.add(key)
        log['combos'] += 1

    def ensure(mid, name, rarity, els, content, variant_of=None):
        if mid in by_id:
            m = by_id[mid]
            if island_id not in m['islands']:
                m['islands'].append(island_id)
                log['island'].append(mid)
            return m
        time = wiki.breeding_time(content) or wiki.rendered_breeding_time(name)
        row = {'id': mid, 'name': name, 'rarity': rarity, 'elements': els,
               'islands': [island_id], 'buyable': False, 'verified': True}
        if variant_of:
            row['variantOf'] = variant_of
        if time:
            row['breedingTime'] = time
        monsters.append(row)
        by_id[mid] = row
        log['new'].append(f'{mid} {"+".join(els)} {time}')
        return row

    # --- base monsters on this island -------------------------------------
    pages = wiki.fetch(NATURALS + roster_extra)
    pages = {k.lower(): v for k, v in pages.items()}
    roster = []
    for title in NATURALS + roster_extra:
        content = pages.get(title.lower())
        if not content or island_name not in wiki.islands_of(content):
            continue
        roster.append(title)
        els = [element_id(e) for e in wiki.elements_of(content)]
        natural = all(e in natural_els for e in wiki.elements_of(content))
        pairs = [(a, b) for a, b, isl in
                 wiki.combos_in(wiki.combo_section(content, island_name)) if isl is None]
        m = ensure(wiki.slug(title), title, 'common', els, content)
        if not m.get('breedingTime'):
            t = wiki.breeding_time(content) or wiki.rendered_breeding_time(title)
            if t:
                m['breedingTime'] = t
        if 'must be purchased' in content or not pairs:
            m['buyable'] = m['buyable'] or not pairs
        ranks = wiki.ranking(content)
        for a, b in pairs:
            pair = tuple(sorted([wiki.slug(a), wiki.slug(b)]))
            if (m['id'], pair) in have:
                continue
            note = None if natural else f'{title} does not follow the element rule'
            add_combo(m['id'], pair, natural, note, scoped=not natural)
            if natural and pair in ranks:
                row = combos[-1]
                rank, advice = ranks[pair]
                row['rank'] = rank
                if advice:
                    row['advice'] = advice

    # --- rare and epic variants, for naturals AND specials ----------------
    vtitles = [f'{p} {t}' for t in roster for p in ('Rare', 'Epic')]
    vpages = {k.lower(): v for k, v in wiki.fetch(vtitles).items()}
    for title in roster:
        base = by_id[wiki.slug(title)]
        for prefix in ('Rare', 'Epic'):
            content = vpages.get(f'{prefix} {title}'.lower())
            if not content:
                continue
            vid = wiki.slug(f'{prefix} {title}')
            ensure(vid, f'{prefix} {title}', prefix.lower(), list(base['elements']),
                   content, variant_of=base['id'])
            section = wiki.combo_section(content, island_name)
            singles = __import__('re').findall(
                r'\{\{BreedingCombo/RareSingle(?:/Entry)?\|([^}]*)\}\}', section)
            matched = False
            for body in singles:
                needle = f'island={island_name}'.replace(' ', '')
                if needle not in body.replace(' ', ''):
                    continue
                ids = sorted(wiki.slug(p.strip()) for p in body.split('|')
                             if p.strip() and '=' not in p and p.strip() not in ('Top', 'End'))
                for i in range(len(ids)):
                    for j in range(i + 1, len(ids)):
                        add_combo(vid, [ids[i], ids[j]], False, RARE_SINGLE_NOTE, scoped=True)
                matched = True
            if matched:
                continue
            tagged = wiki.combos_in(section)
            if prefix == 'Epic':
                for a, b, isl in tagged:
                    if isl != island_name:
                        continue
                    add_combo(vid, sorted([wiki.slug(a), wiki.slug(b)]), False,
                              EPIC_NOTE, scoped=True)
            else:
                untagged = [(a, b) for a, b, isl in tagged if isl is None]
                if untagged:
                    # A Rare breeds like its common, so its combos work on every island
                    # where the parents live. Scoping them to one island would make the
                    # Rare unobtainable everywhere else (invariant 18).
                    for a, b in untagged:
                        add_combo(vid, sorted([wiki.slug(a), wiki.slug(b)]), False,
                                  f'{prefix} {title} does not follow the element rule')
                else:
                    for c in [c for c in combos if c['target'] == base['id']]:
                        add_combo(vid, c['parents'], c['followsElementRule'], c.get('note'))
            if not any(c['target'] == vid for c in combos):
                by_id[vid]['buyable'] = True

    # --- island row --------------------------------------------------------
    if not any(i['id'] == island_id for i in islands):
        islands.append({'id': island_id, 'name': island_name, 'order': int(order),
                        'color': color, 'elements': []})
    row = next(i for i in islands if i['id'] == island_id)
    for m in monsters:
        if island_id in m['islands']:
            for e in m['elements']:
                if e not in row['elements']:
                    row['elements'].append(e)

    monsters.sort(key=lambda m: (m['rarity'] != 'common', len(m['elements']), m['name']))
    combos.sort(key=lambda c: (c['target'], c['parents']))
    for n, d in [('monsters', monsters), ('combos', combos),
                 ('elements', elements), ('islands', islands)]:
        save(n, d)

    print(f'{island_name}: roster {len(roster)} -> {roster}')
    print(f'  natural elements: {natural_els}')
    print(f'  new monsters ({len(log["new"])})')
    for x in log['new']:
        print('   ', x)
    print(f'  island added to {len(log["island"])} existing')
    print(f'  new combos: {log["combos"]}   new elements: {log["elements"]}')


if __name__ == '__main__':
    main(*sys.argv[1:])
