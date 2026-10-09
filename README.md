# LOKIVELLI SWITCHYARD — INCHORDME RELAY BOX

**HOME repository** for the split-site, OAuth-first Forge relay.

## Implemented
- A deployable GitHub Pages static **Wiring Deck**, with **two independent webpages visible at once**.
- Nine separate same-origin workspace pages: ArsenalX, Bible Maker, ChatGPT, Claude, Gemini, Grok, Mistral, Termux/local, and Custom Site.
- Each platform has a configurable **external page URL** in PAGE REGISTRY. Toggle **OWN PAGE** or **SITE FRAME**. Use **OPEN ↗** if the external page blocks iframe embedding.
- Save the chosen pair, resize 25/75 through 75/25, swap sides, and force two-up on narrow screens.
- **Attachment Pusher:** add multiple files to browser-local IndexedDB, compute SHA-256 when available, select files, PUSH to either own page, and separately ACCEPT references in its inbox. Keeps receipt events and source.
- An opt-in external bridge for independent compatible platform-built webpages: explicitly selected files can cross the iframe boundary as Blobs through origin-checked postMessage, with receiver consent. See PLATFORM_PAGE_CONTRACT.md.
- Separate per-page/per-bay notes; no API credentials required for the local rail.

## NOT implemented / not silently claimed
- **Real OAuth** GitHub/Google Drive/Dropbox logins are not connected yet. The UI explicitly says NOT CONNECTED. OAuth needs an application registration and a trusted callback/token-exchange backend; GitHub Pages cannot securely run that code alone.
- Existing consumer Custom GPTs or chats are not executed in our own workspace pages. Browser login at ChatGPT, Claude, Gemini, or Grok is not consent for this site to access their private chats.
- Consumer websites may refuse iframe display using CSP or X-Frame-Options. OPEN ↗ then opens their own site.
- Direct automatic injection of files into consumer AI chats is not supported. File delivery to participating independent websites works; integration with the AI provider requires its approved capability.
- Browser-local vault is NOT synchronized across devices, Chrome/ChatGPT internal browsers, or browser profiles. An authorized storage backend could add that later.

## How to publish
In GitHub repository Settings -> Pages, select **GitHub Actions** as Build and deployment. The repository includes .github/workflows/pages.yml. Trigger the workflow or push main, and check the Actions log for the actual published URL.

EXPECTED URL (not a claim that deployment has succeeded):
https://lokivelli316.github.io/inchordme-relay-box/

## Instructions
1. Select a provider on each side. OWN PAGE gives its independent notes and attachment inbox.
2. Add files once using the ARTIFACT RAIL. Select desired entries then click PUSH LEFT or PUSH RIGHT.
3. In the receiving page, ACCEPT REFERENCE. The file remains in the shared browser vault and is accessible from the recipient tray. Neither side is forced to download it.
4. Get each AI platform's website builder to create its own page using PLATFORM_PAGE_CONTRACT.md and share the page URL.
5. Open WIRING / PAGE REGISTRY. Replace that platform's external URL with its new hosted page address. Select SITE FRAME for display. When the page supports the opt-in bridge, explicit file PUSH sends a Blob; otherwise the page has an OPEN ↗ fallback.
6. After deploying a legitimate OAuth backend for authorized storage, enter its URL in Settings. The CHECK STATUS button only tests the health endpoint; it never claims OAuth is connected merely because health responded.

## Files
- index.html — top-level dual-pane Wiring Deck.
- assets/switchyard.css — industrial stained-metal split-pane styling.
- assets/switchyard.js — local file vault, receipt-based transfer, page registry, workspace state.
- assets/bridge.js — opt-in cross-origin postMessage sender for compatible independent pages.
- assets/receiver-starter.js — standalone receiver with exact-origin allowlist and approval.
- platforms/*/index.html — independent page shells with their own bay notes/inbox.
- PLATFORM_PAGE_CONTRACT.md — send this to each platform's builder.
- .github/workflows/pages.yml — GitHub Pages publication.

No existing external repository, Custom GPT, or cloud storage has been modified by this implementation.
