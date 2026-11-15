# Official Astra logo

`1-trans.png` is the supplied transparent approved artwork. `1.png` is the supplied reference.

`astra-logo-light.png` is derived directly from `1-trans.png`: crop only fully transparent outer margins to alpha bounds `(169,419)–(1100,785)`, invert RGB for legibility on black, preserve every alpha value. Result: 931 × 366 pixels. No tracing, redrawing, stretching, or recreated lettering.

The shared AstraLogo component preserves this ratio. The decorative halftone footer artwork and navigation orbital illustrations are existing artwork, not replacement brand assets.

`src/app/icon.png` uses the exact symbol portion `(0,0)–(300,366)` of the light asset, proportionally downsampled onto a transparent 128px square; it replaces the previous star favicon.
