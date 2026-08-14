# RiftBound

A browser-based Phase 2 prototype for a League of Legends / Riftbound-inspired digital card game.

## Phase 2 — Rules Engine

The project now separates game rules from presentation through `rules.js`.

- Formal versioned game-state model
- Separate player and opponent decks, hands and discard zones
- Unique card instances
- Validated resource spending and card placement
- Alternating action windows
- Pass/end-of-round handling
- Battlefield power comparison and control
- Cumulative victory-point scoring
- Prototype win condition at 8 victory points
- Serializable game state for future replays/network play
- Basic spell resolution hook
- More structured game history
- Interactive card selection → battlefield targeting

## Run locally

This version remains dependency-free. Open `index.html` in a browser or serve the repository with any static web server.

## Roadmap

### Phase 3 — Presentation
- Drag-and-drop interactions
- Card detail modal
- Animations
- Better battlefield representation
- Deck builder
- Visual card assets

### Phase 4 — Multiplayer
- Cloudflare Workers
- Durable Objects
- WebSocket game rooms
- Matchmaking
- Player identity
- Reconnect support
- Server-authoritative rules execution

### Phase 5 — Content
- Expanded card database
- Sets and rotations
- Search/filtering
- Deck import/export
- Balance tooling
- Automated card tests

> This prototype uses text-only cards and original UI styling rather than reproducing official card artwork.
