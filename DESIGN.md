# Perenna spatial command system

## Visual atmosphere

Perenna is a procurement command environment: requests enter the workspace, agents negotiate, and human authority controls money. The interface should feel like an instrument inside that process. A persistent three-dimensional negotiation assembly sits behind every route. The page is a readable spatial HUD, with sightlines into that assembly between functional surfaces.

The user explicitly chose pure black, bright neon green, robotic typography and immersive motion. These choices override the taste skill defaults against pure black, saturated neon and glowing accents. Density is 6, spatial variance is 7, and motion is 7. This is an application with real financial boundaries, so data and forms stay calm even when the world moves.

## Color and type

| Token | Value | Role |
| --- | --- | --- |
| Absolute black | `#000000` | Canvas and depth outside the HUD |
| Instrument glass | `#080c08` | Readable functional surfaces |
| Signal green | `#b6ff00` | Primary action, spatial edges and display text |
| Active green | `#9cfb29` | Related active-state accent |
| Display white | `#f4fff0` | Main content and financial terms |
| Quiet metal | `#9ca994` | Secondary text and helper copy |

Use locally supplied Orbitron for display headings and Rajdhani for application text. Local Devanagari is the Hindi fallback. Body text is at least 16px with generous line height; secondary text never falls below 13px. Large headings use fluid sizing and short line lengths. Numbers use tabular figures. Avoid gratuitous tracking and keep long wallet identifiers in readable wrapping text.

## Spatial composition

Use one fixed, non-interactive Three.js world behind the entire page. It responds to route, scroll and pointer movement without affecting functional state. Content is positioned above it with explicit stacking. Hero sightlines are empty, bounded spatial windows, not separate canvases or flat screenshot cards. A route remains complete when WebGL is unavailable.

Desktop content occupies a maximum 1480px canvas beside a 224px command rail. Long application pages alternate full-width ledger sections with asymmetric working pairs. Functional surfaces have small mechanical corner cuts, inset edges, layered shadows and modest perspective. Do not recreate the previous leaf-card theme or place identical cards in an equal three-column grid.

All eight pages receive individual composition:

- Landing: a large left-aligned product statement, open world sightline, and an asymmetric procurement protocol below.
- Onboarding: an identity console beside an open spatial identity assembly.
- Workspace: a large intent console and narrower request rail, followed by operating authority and funds sections.
- Negotiations: a conversation arena beside compact comparison surfaces. The private room remains a distinct controlled scope.
- Suppliers: horizontal capability rows and clear credibility evidence, with space between each agent assembly.
- Orders: long accounting surfaces with separate payment and fulfillment tracks.
- Agreements: mandate records and a sculpted configuration console. Frozen signatures and wallet reviews remain easy to scan.
- Settings: grouped identity, budgets, connected providers, operating policies and funding reviews, with clear section depth.

## Components

Buttons are mechanical keycaps with beveled or pill silhouettes, a dark lower edge, visible hover lift and tactile press feedback. The primary action uses signal green with black text. Secondary actions remain dark with visible green-metal edges. Keyboard focus uses a clear outline independent of hover. Minimum interactive size is 44px.

Forms use persistent labels above shaped fields. Financial values, errors and explanations stay readable. Advanced sections are deliberate expanding consoles, not tiny nested cards. Long signatures, transaction hashes and exact review messages wrap inside their available width. Every wallet review has a readable foreground and independent scroll containment.

Status labels use compact capsules and text, not color alone. Empty states show the next available action without fabricated activity. Loading uses a stable spatial scene and restrained transform or opacity changes. All payment, provider and credibility claims come from application state.

## Motion and accessibility

Animate transform and opacity. Button lift is approximately 2px, press movement is approximately 1px, and surface motion stays subtle enough for stable reading. Scroll uses native smooth movement with anchor offsets. The Three.js camera supplies the deeper spatial motion. Decorative layers never intercept input, obscure labels, or become the only source of information.

At 1080px, reduce the rail and pair widths. Below 720px, turn navigation into a compact top command rail and collapse every form and functional grid to one column. Remove perspective from reading surfaces on small screens. Do not allow page-wide horizontal overflow.

Respect reduced motion by stopping ambient animation, removing interface transitions and using the stage fallback when appropriate. Preserve visible keyboard focus, touch targets, text contrast, zoom readability and Hindi line height.

## Exclusions

Do not introduce sage, beige, blue, purple or a second accent family. Do not use plant motifs, ordinary square cards, uniform rounded SaaS tiles, gradient headline words, decorative fake metrics, custom cursors, unreadable micro-labels, or flashing payment status. Do not replace functional pages with oversized heroes and leave their forms undesigned. Do not communicate mainnet inference as testnet usage.
