# Third-party notices

Status: Canonical Index
Scope: Third-party software and assets used by this repository
Last verified: 2026-11-17

The [LICENSE](LICENSE) covers only rights owned or controlled by Yuto Matsui.
Third-party components keep their own licenses, including permissions for commercial
use, modification and redistribution where their licenses grant them. Inclusion here
does not imply endorsement. Missing inventory entries do not override third-party rights.

## Software

`package-lock.json` identifies the exact npm dependencies. The website bundle includes
Next.js, React, React DOM, Three.js and their runtime dependencies; devDependencies
are build, test or authoring tools.

| Family | License / handling |
|---|---|
| Next.js, React, React DOM, Three.js, Scheduler, styled-jsx and many JS tools | MIT; retain the copyright and permission notices when distributing covered code |
| Apache-2.0 packages, including TypeScript, Playwright and sharp's JS wrapper | Retain license/NOTICE material and any required modification notices |
| sharp/libvips native components | LGPL-3.0-or-later, sometimes combined with Apache-2.0/MIT; inspect the actual platform binary and redistribution obligations |
| caniuse-lite | CC-BY-4.0; retain required attribution where applicable |

Build-only use does not by itself make the site's output a derivative work of every
tool. Conversely, a public Git repository and a browser bundle are different
distribution surfaces. Before distributing a new binary, review the actual included
files and satisfy their notice/source/relinking obligations.

## Media and authorship

The `next/font/google` imports in `/en/` use Manrope and Newsreader under SIL OFL 1.1.
Their upstream notices are retained as [Manrope](docs/legal/fonts/Manrope-OFL.txt)
and [Newsreader](docs/legal/fonts/Newsreader-OFL.txt), obtained from the
[Google Fonts repository](https://github.com/google/fonts/tree/main/ofl) on
2026-09-10. The website build downloads and self-hosts the font files. Include
the applicable notices when distributing those files.

- [Independent portfolio image credits](docs/founder-image-credits.md)
- COMPASS product card background (`public/images/founder-products/compass/top.webp`): a Blender render of an original COMPASS scene using [Brushed Concrete](https://polyhaven.com/a/brushed_concrete), [Rock 06](https://polyhaven.com/a/rock_06) (Rob Tuytel) and [Qwantani Night](https://polyhaven.com/a/qwantani_night) (Greg Zaal, Jarod Guest) from Poly Haven under [CC0](https://polyhaven.com/license), and Everett Bumstead's [Serene Reflections on Rippling Water Surface](https://www.pexels.com/video/serene-reflections-on-rippling-water-surface-34435555/) footage under the [Pexels License](https://www.pexels.com/license/), edited as a reflection input. Byte-identical to COMPASS `public/habitat/night-v1/top.webp`, whose `credits.md` records these sources.
- [Topos product image](public/images/founder-products/topos/NOTICE.md): copied from genellect/devfest2026-t167 under MIT.
- [Cytellect product photograph](public/images/founder-products/cytellect/well-hero-provenance.json): CDC on Pexels under the Pexels License.
- [Cytellect artwork](public/images/founder-products/cytellect/NOTICE.md) and its [LICENSE](public/images/founder-products/cytellect/LICENSE); the [1BNA coordinates](scripts/art/art-data/README.md) used by the authoring scripts are CC0 1.0.
- README technology logos (`assets/stack/`): copied from [genellect/genellect](https://github.com/genellect/genellect). Each logo is a trademark of its owner, shown only to name the technology; no endorsement is implied. Not part of the website.

Poly Haven CC0 assets remain CC0. Unsplash and Pexels items retain their source terms.
User-supplied photos and original artwork must not be described as third-party stock
or relicensed without authority.
