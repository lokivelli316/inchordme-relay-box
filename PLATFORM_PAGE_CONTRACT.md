# LOKIVELLI SWITCHYARD — PLATFORM PAGE BUILDER CONTRACT v1

## Mission
Each provider builds and owns **its own independent webpage** rather than being flattened into one chatbot. This GitHub repository is the **HOME / Wiring Deck**, not the provider's account system. The Wiring Deck displays two pages at a time, manages a local artifact vault, and sends files to consenting bridge-compatible pages on explicit command.

**Give this contract to each separate AI platform's website builder.** They are responsible for producing their own page and delivering its hosted URL. The Wiring Deck connects the URLs.

## Independent platform site requirements
1. Build a working responsive standalone website with an independent identity, useful work area, storage inbox, and real connection-status indicators. Include its hosted URL and update instructions.
2. **OAuth-first:** use only real, officially supported OAuth authorization flows for services that permit them. Where appropriate implement authorization code with PKCE, state/CSRF protection, secure server-side token exchange/storage, minimal scopes, revocation/logout, and secure sessions. Do not expose OAuth secrets, access tokens, or refresh tokens in static frontend code, URL fragments, localStorage, or postMessage events.
3. If a consumer AI service does not offer third-party OAuth for accessing consumer chats, **show that limitation clearly**. Provide a button to open the service's normal website; do not pretend sign-in gives permission to read conversation history or attach files.
4. The page must reject unexpected parent origins and cross-origin messages. Add the opt-in LV_SWITCHYARD bridge if receiving files from the Wiring Deck is wanted, and prompt for approval before accepting each file.
5. The receiving page may store accepted files in its own IndexedDB or authorized storage backend. Retain provenance: filename, SHA-256 when available, origin, destination, timestamp, and acceptance state.
6. Incoming handoff does not mean the file was added to an AI conversation. Show the distinction honestly.
7. Platform must not impersonate other services, scrape protected interfaces, or silently modify another application's files.
8. Existing HOME contents are not to be overwritten. Give the operator the finished independent URL for Wiring Deck -> PAGE REGISTRY.

## Implemented bridge protocol
The Wiring Deck sends to an explicitly configured and framed page:

- HELLO from HOME: type LV_SWITCHYARD_HELLO; version 1; side left/right; sourceOrigin is the HOME origin.
- READY from receiver: type LV_SWITCHYARD_READY; version 1.
- Following an operator-selected PUSH: type LV_SWITCHYARD_FILE; version 1; transferId, name, size, mimeType, sha256, and an actual Blob.
- Following consent: type LV_SWITCHYARD_ACK; version 1; transferId, fileName, and accepted true/false.

Both pages validate the *exact origin*. No wildcards. Receiver checks that a FILE came from the trusted window that sent the accepted HELLO. Files only send after the operator selects them and presses PUSH. On rejected, blocked, or unsupported websites, use the OPEN ↗ fallback; no invisible transfer is claimed.

An actual working receiver scaffold is supplied at: assets/receiver-starter.js.

## Receiver inclusion
Put a DOM element with id lv-receiver-status on your independent page. Before the receiver script is loaded, set window.LV_ALLOWED_SWITCHYARD_ORIGINS to a *specific array of origins*, for example https://lokivelli316.github.io (or the actual custom-domain origin). Then load https://lokivelli316.github.io/inchordme-relay-box/assets/receiver-starter.js, adjusting the URL for the actual published home. The script defines LVReceiverList() for reading accepted inbox records.

## Acceptance checklist
- [ ] Own hosted page with an independent design and workspace.
- [ ] Official OAuth where supported, no pretend OAuth where unavailable.
- [ ] No browser-exposed client secrets or tokens.
- [ ] Origin-allowlisted, user-approved attachment acceptance.
- [ ] Stored provenance and transfer receipt.
- [ ] Fallback for sites that prohibit iframe embedding.
- [ ] Tested in Samsung Android Desktop Mode.
- [ ] Final page URL delivered to operator for registry wiring.

## Default first pair
ArsenalX in the left bay and Bible Maker in the right bay. Initial same-origin modules are **separate trays and notes**, not executions or copies of the two ChatGPT Custom GPTs; their actual external sites and capability integration need to be supplied by their builders.
