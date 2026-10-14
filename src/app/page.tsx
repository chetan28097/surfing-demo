import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { SceneTierProvider } from "@/components/scene/SceneTier";
import { SceneLayer } from "@/components/scene/SceneLayer";
import { BookingProvider } from "@/components/ui/Booking";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Backdrop } from "@/components/layout/Backdrop";
import { Journey } from "@/components/sections/Journey";
import { School } from "@/components/sections/School";
import { Lessons } from "@/components/sections/Lessons";
import { Gallery } from "@/components/sections/Gallery";
import { Finale } from "@/components/sections/Finale";

export default function Home() {
  return (
    <SmoothScroll>
      <SceneTierProvider>
        <BookingProvider>
          <SiteHeader />
          <SceneLayer />
          <main id="main" className="page" tabIndex={-1}>
            <Journey />
            <School />
            <Lessons />
            <Gallery />
            <Finale />
          </main>
          <Backdrop />
        </BookingProvider>
      </SceneTierProvider>
    </SmoothScroll>
  );
}
