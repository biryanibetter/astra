import { Schools } from "@/components/home/community";
import { EventsTimeline } from "@/components/home/events";
import { FAQ } from "@/components/home/faq";
import { FramedReel } from "@/components/home/framed-reel";
import { Hero } from "@/components/home/hero";
import { Introduction } from "@/components/home/introduction";
import { MarqueeDivider } from "@/components/home/marquee-divider";
import { Members } from "@/components/home/members";
import "./home.css";

export default function Home() {
  return (
    <main id="main" className="home">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient ambient-three" aria-hidden="true" />
      <Hero />
      <MarqueeDivider />
      <Introduction />
      <FramedReel />
      <EventsTimeline />
      <Members />
      <Schools />
      <FAQ />
    </main>
  );
}
