# React Flow UI Engine — Figma-ready Brand Spec

## Logo concept
A three-node flow graph inside a rounded square. The mark represents conditional navigation, same-page conditional content, and React component blocks.

## Recommended usage
- **Logo mark:** npm avatar, favicon, GitHub org/repo icon, docs sidebar.
- **Logo lockup:** website header, README hero, package landing pages.
- **GitHub banner:** repository social preview image.

## Color tokens

| Token | Hex | Usage |
|---|---:|---|
| Slate 950 | `#020617` | Dark backgrounds |
| Slate 900 | `#0F172A` | Logo tile, primary text |
| Slate 600 | `#475569` | Secondary wordmark text |
| Slate 500 | `#64748B` | Subtitles |
| Sky 400 | `#38BDF8` | Flow gradient start |
| Indigo 500 | `#6366F1` | Flow gradient center |
| Purple 500 | `#A855F7` | Flow gradient end |
| Emerald 400 | `#34D399` | Conditional branch accent |
| Green 500 | `#22C55E` | Conditional branch accent end |
| Slate 50 | `#F8FAFC` | Node fill |

## Typography
Use `Inter` where available. Fallback: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`.

## Geometry
- Base icon canvas: `512 × 512`
- Tile: `400 × 400`, positioned at `x=56, y=56`
- Tile corner radius: `96`
- Main flow stroke: `36`, round caps
- Branch stroke: `28`, round caps
- Node shapes: two circles, one rounded square/check node

## Figma recreation steps
1. Create a `512 × 512` frame.
2. Add a rounded rectangle at `56,56`, size `400 × 400`, radius `96`, fill `#0F172A`.
3. Draw the main curved path from left node to bottom-right node with a 36px round stroke using gradient `#38BDF8 → #6366F1 → #A855F7`.
4. Draw the conditional branch path to the top-right node with a 28px round stroke using gradient `#34D399 → #22C55E`.
5. Add three white nodes using `#F8FAFC`.
6. Add the inner dot, conditional square, and check mark accents.

## Export sizes
- Favicon: 16, 32, 48, 180, 192, 512 PNG + ICO + SVG
- NPM badge icon: 128 SVG/PNG
- README/GitHub logo: SVG preferred
- GitHub social preview: 1600 × 640 SVG or PNG

## Accessibility
Keep the mark on high-contrast dark or light backgrounds. Do not place the full-color mark on saturated gradient backgrounds unless it has the dark tile behind it.
