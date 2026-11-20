# Leonida Ledger — a GTA VI trophy guide and tracker

[![Build the best GTA 6 trophy guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/sybl2710-creator/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/sybl2710-creator/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline, open-source guide to all 55 PlayStation 5 trophies of **Grand Theft Auto VI** (released 19 November
2026): a checklist whose progress is saved in the browser, a roadmap to the platinum with the missable flagged, and
a per-trophy guide that names the page behind every step.

## What is in it

- **Tracker** — all 55 trophies with official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze).
  Tick one off, and it survives a reload in `localStorage`. Export writes a JSON file; import reads it back and
  ignores names the list does not hold.
- **Filters** — free text, grade, kind (story, collectibles, activities, strangers, robberies, free-roam, online) and
  earned/missing. The game has no online trophies, and the filter says so by staying empty.
- **Spoiler setting** — on by default: every story trophy you have not earned hides its name and description until
  you turn it off or mark it earned.
- **Roadmap** — eight ordered stages from the Prologue to the post-story 100% checklist, each with a short brief,
  its trophy chips and the pages the stage was built from. The one missable trophy (Positive Mental Attitude) is
  flagged in the list, the detail panel and the roadmap.
- **Citations** — 146 steps, each naming at least one source, 181 source links in total across 13 sources. The
  Sources view lists every page with its citation count and draws a trophy-by-source matrix. Names, descriptions and
  grades come from the official PlayStation list; anything not confirmable from a public page is said so in the
  guide rather than guessed.
- **Fast and quiet** — system fonts only, no images, no external assets, no runtime network calls, three small ES
  modules, about 40 KB of data.

## Run it

```sh
node serve.ts          # serves app/ on http://localhost:8080
```

Or point any static server at `app/`. There is no build step. To produce the hand-in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's
`vendor/makefun-frontend.ts`. Twice in a row, to two directories, the dossier is byte-identical.

## Layout

```
app/index.html        shell: header stats, tab bar, three views
app/style.css         the neon-sunset look, hand-written
app/modules/store.js  progress state, localStorage, export/import
app/modules/guide.js  tracker list, detail panel, roadmap, source matrix
app/modules/main.js   wiring only
app/data/trophies.json  55 trophies, 8 roadmap stages, 13 cited sources
main.ts               hand-in program
```

## Sources

The guide cites, by name and URL: the official PlayStation 5 trophy list, PowerPyx's trophy roadmap and mission
walkthrough, and nine further PowerPyx reference pages (100% checklist, meditations, bank jobs, gang operations,
garages, drone races, shooting ranges, strangers & freaks, card sets, challenges, WAiNK scans). Each citation marks a
page that was actually read, and the notes say which facts came from it. No guide text is copied.

## License

MIT — see `LICENSE`. Trophy names and descriptions belong to PlayStation and Rockstar Games; this is an unofficial
fan project and uses no Rockstar artwork or logos.
