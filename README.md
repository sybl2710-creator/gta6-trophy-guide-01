# 56 Stars — a GTA VI trophy checklist and route

[![Build the best GTA 6 trophy guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/sybl2710-creator/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/sybl2710-creator/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide to the 55 PlayStation 5 trophies in **Grand Theft Auto VI**: a checklist that remembers what you
have earned, an ordered route to the platinum, and a citation under every instruction.

## The four screens

- **Checklist** — every trophy with its official name, description and grade (1 platinum, 2 gold, 6 silver,
  46 bronze). Tick a row and it is stored in `localStorage`. Text search, grade, family and earned/missing filters
  narrow the list, and a progress bar breaks the total down by grade.
- **Detail panel** — opens beside the list with the trophy's route notes, its cited steps and a missable warning
  where one applies. The single missable trophy, *Positive Mental Attitude*, is flagged in the row, the panel and
  the route.
- **Route to platinum** — the eight stages in play order, from the prologue to the post-story completion sweep,
  each with a short brief, its trophies as jump chips and the pages the stage was built from.
- **Citations** — every source page with its citation count, plus a matrix showing which pages back which trophy.

Spoiler mask is on by default: story trophies you have not earned show neither name nor description until you turn
it off or mark them earned. Progress moves between browsers as a JSON file (save/load in the filter console).

## Facts behind it

55 trophies, 146 cited steps, 181 citations across 14 pages, 28 of the trophies hidden on PSN, one missable.
Names, descriptions and grades come from the official PlayStation list; the route notes are written for this
tracker and each names the page it was checked against.

## Running it

```sh
node serve.ts                       # app/ on http://localhost:8080
```

Any static file server works, and so does opening `app/index.html` directly — there is no build step and the only
fetch is the page's own `data/trophies.json`. For the hand-in package:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output folder and writes `dossier.json` through the kit's
`vendor/makefun-frontend.ts`. Run it twice into separate folders and the two dossiers match byte for byte.

## Files

```
app/index.html              page shell: header counters, three scenes
app/style.css               all styling, system fonts only
app/modules/store.js        earned set, localStorage, export/import
app/modules/guide.js        renders each view from state
app/modules/main.js         event wiring and boot
app/data/trophies.json      55 trophies, 8 stages, 14 sources
main.ts                     hand-in program
shots.json                  description of the four screenshots
```

## Sources

Official PlayStation 5 trophy list plus thirteen PowerPyx pages: the trophy roadmap, the mission walkthrough, the
100% checklist, and the location references for meditations, bank jobs, gang operations, garages, drone races,
shooting ranges, strangers & freaks, card sets, challenges and WAiNK scans. Each is cited by name and URL; no guide
prose was copied from them.

## Licence

MIT — see `LICENSE`. Trophy names and descriptions belong to PlayStation and Rockstar Games. This is an unofficial
fan project with no Rockstar artwork or logos.
