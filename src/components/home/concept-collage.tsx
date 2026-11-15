import { Star } from "@/components/site";

export function ConceptCollage() {
  return (
    <div className="network-collage">
      <div className="photo-collage">
        <div className="collage-frame collage-one">
          <Star />
          <span>A future gathering</span>
        </div>
        <div className="collage-frame collage-two">
          <div className="collage-grid" />
          <span>Ideas taking shape</span>
        </div>
        <div className="collage-frame collage-three">
          <div className="collage-orbits" />
          <span>School connections</span>
        </div>
      </div>
    </div>
  );
}
