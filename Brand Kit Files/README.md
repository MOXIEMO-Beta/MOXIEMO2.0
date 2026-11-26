# MOXIEMO brand kit

For the MOXIEMO 2.0 build. Prepared November 23, 2026. Everything here belongs to KLMG US Ltd, LLC.

## What is in each folder

- **01-logo**: the MOXIEMO wordmark without its tagline, as transparent PNG. The full size is 3159 x 602. The header size is 894 x 132. Use the logo without its tagline everywhere in the app.
- **02-app-icon**: the square MOXIEMO icon in coral, white and transparent, as SVG and as PNG at 512 and 1024. Use it for the favicon and app icons.
- **03-moxie-character**: MOXIE, the growth companion. His circle icon (head with glasses, no hair) and five poses: wave, phone, magnify, point and cheer. SVG and transparent PNG. Use `moxie-icon` anywhere MOXIE shows in a circle, and the poses on the screens the PRDs name.
- **04-fonts**: Fraunces (headings), DM Sans (body) and JetBrains Mono (numbers and code), as variable web fonts (woff2). All three are open source under the SIL Open Font License; each folder has its license. They are also on npm as `@fontsource-variable/fraunces`, `@fontsource-variable/dm-sans` and `@fontsource-variable/jetbrains-mono`.
- **05-colors**: the brand colors as CSS variables, JSON and a Tailwind theme snippet, plus a swatch image.
- **06-reference-screens**: thirteen screenshots of the approved /start page design, to match spacing, type and how MOXIE is used.

## Colors

| Name | Hex | Use |
| --- | --- | --- |
| Coral | #FF6B5C | Primary buttons and accents. One coral button per screen |
| Ink | #15171C | Text |
| Paper | #F7F5F1 | Page background |
| Navy | #14243D | Dark sections, MOXIE's outline |
| Sage | #B8C5A6 | Supporting |
| Taupe | #D8CEBD | Supporting |
| Warm paper | #F4F2ED | Cards and panels |
| MOXIE lilac | #D4C1EC | MOXIE's head. Character only |

## Rules that come with the brand

- MOXIE speaks as "I", never calls himself a bot, and uses no contractions and no em dashes.
- MOXIE is the companion; MOXIEMO is the platform.
- Do not redraw, recolor or stretch the logo or MOXIE. Use the files as they are.
- Every screen works at 390 px wide.
- The full rules are in PRD 0 (Rules for every screen), PRD 12 (layout) and PRD 20 (Design system and MOXIE's look).

## Known gaps

- The wordmark logo is PNG only. A vector (SVG) version of the wordmark is not in this kit yet.
- PRD 12 names Space Grotesk for headings. This kit uses Fraunces, DM Sans and JetBrains Mono, which is what the live site uses.
