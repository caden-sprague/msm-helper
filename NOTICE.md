# Notices

## Monster artwork

`public/icons/` contains monster artwork from the
[My Singing Monsters Wiki](https://mysingingmonsters.fandom.com), downscaled to 128px
and converted to WebP by `scripts/fetch_icons.py`.

**This artwork is not covered by this repository's licence.** My Singing Monsters and
all monster designs are trademarks and copyright of **Big Blue Bubble Inc.** The images
are included here for identification purposes in a non-commercial fan-made tool, with
no affiliation with or endorsement by Big Blue Bubble.

If you are a rights holder and want the art removed, open an issue — deleting
`public/icons/` and the `icon` fields in `src/data/monsters.json` fully removes it, and
the app falls back to generated element-coloured avatars without any other change.

## Monster data

Names, elements, breeding times and combinations come from the same wiki, licensed
[CC BY-SA](https://www.fandom.com/licensing).
