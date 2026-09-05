Drop your two logo files here with these exact names:

logo.png   — static logo, shown by default
logo.gif   — animated version, crossfades in on hover (your 148×148px gif)

Specs:
- Both: 148×148px, transparent background, square
- PNG can be swapped for .webp if you prefer — just update the two <img>
  src paths in src/components/ui/SiteHeader.tsx to match
- Leave a little padding around the mark inside the canvas so it doesn't
  look cropped at the header's small display size (~40px)

Displayed at ~40px in the header — 148px source gives ~3.7x pixel density,
plenty sharp on retina screens without needing to go any bigger.

Delete this README once the real files are in place (optional).