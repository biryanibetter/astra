import Image from "next/image";

const photos = [
  { position: "one", name: "faq-gathering", caption: "A future gathering" },
  { position: "two", name: "faq-teamwork", caption: "Ideas taking shape" },
  { position: "three", name: "faq-showcase", caption: "School connections" },
] as const;

export function ConceptCollage() {
  return (
    <div className="network-collage">
      <div className="photo-collage">
        {photos.map(({ position, name, caption }) => (
          <div className={`collage-frame collage-${position}`} key={position}>
            <Image
              src={`/images/home-stock/${name}.webp`}
              alt=""
              fill
              sizes="(max-width: 500px) 55vw, 285px"
              className="collage-photo"
            />
            <span>{caption}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
