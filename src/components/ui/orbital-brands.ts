const invitation = { name: "Partner with Astra", kind: "invitation" } as const;
const centFive = { name: "CentFive Studios", kind: "placeholder" } as const;

// The original six slot widths occur twice per loop. Keep their advances
// independent of the artwork so the track width and speed stay unchanged.
const slotWidths = [
  { advance: 2.917, letters: 5 },
  { advance: 3.415, letters: 7 },
  { advance: 3.158, letters: 6 },
  { advance: 6.491, letters: 12 },
  { advance: 3.676, letters: 7 },
  { advance: 3.69, letters: 7 },
] as const;

export const orbitalBrands = [...slotWidths, ...slotWidths].map(
  (slot, index) => ({
    ...slot,
    id: String(index + 1).padStart(2, "0"),
    artwork: index === 0 ? centFive : invitation,
  }),
);
