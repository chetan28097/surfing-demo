// Every business detail is a placeholder. Replace bracketed values before launch.
export const site = {
  name: "Saltline",
  fullName: "Saltline Surf School",
  beach: "[Beach name]",
  region: "[Town, Region]",
  email: "[hello@yourschool.com]",
  phone: "[+00 000 000 000]",
  address: "[Street address, postcode]",
  hours: "[Open daily, first lesson 7:00]",
  founded: "[Year]",
  copyrightYear: "[Year]",
  social: [
    { label: "Instagram", href: "#", handle: "[@yourschool]" },
    { label: "YouTube", href: "#", handle: "[Your channel]" },
    { label: "TikTok", href: "#", handle: "[@yourschool]" },
  ],
} as const;

export const nav = [
  { href: "#school", label: "The school" },
  { href: "#lessons", label: "Lessons" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
] as const;

export type Lesson = {
  id: string;
  level: string;
  title: string;
  summary: string;
  duration: string;
  group: string;
  price: string;
  includes: string[];
  youllLearn: string[];
  image: { src: string; alt: string };
};

export const lessons: Lesson[] = [
  {
    id: "first-wave",
    level: "Never surfed",
    title: "First wave",
    summary:
      "Start on the sand, finish standing up in the whitewater. We pick a soft board, read the beach together and keep you in waist-deep water.",
    duration: "[2 hours]",
    group: "[Up to 6 people]",
    price: "[$—]",
    includes: ["Soft-top board", "Wetsuit", "Beach safety briefing"],
    youllLearn: ["Where to stand and why", "Paddling and the pop-up", "Riding whitewater to the shore"],
    image: { src: "/images/beginner.jpg", alt: "A surfer sitting on the sand beside a white surfboard" },
  },
  {
    id: "finding-feet",
    level: "A few sessions in",
    title: "Finding your feet",
    summary:
      "Move from whitewater to unbroken waves. Timing your paddle, angling the take-off and trimming along the face instead of straight to the beach.",
    duration: "[2 hours]",
    group: "[Up to 4 people]",
    price: "[$—]",
    includes: ["Board matched to your level", "Wetsuit", "Video review of your waves"],
    youllLearn: ["Duck-diving or turtle rolls", "Catching green waves", "Going left and right"],
    image: { src: "/images/whitewash.jpg", alt: "Feet on a surfboard riding through whitewater" },
  },
  {
    id: "reading-lineup",
    level: "Comfortable out back",
    title: "Reading the lineup",
    summary:
      "Positioning, priority and wave selection. We spend time sitting and watching sets before we spend energy paddling for them.",
    duration: "[2.5 hours]",
    group: "[Up to 3 people]",
    price: "[$—]",
    includes: ["Coach in the water", "Session plan for your break", "Video review"],
    youllLearn: ["Spotting sets early", "Lineup etiquette", "Bottom turn and first manoeuvre"],
    image: { src: "/images/carve.jpg", alt: "A surfer carving across the face of a green wave" },
  },
  {
    id: "private",
    level: "Any level",
    title: "Private coaching",
    summary:
      "One coach, your goals. Good for nervous first-timers, families who want the session to themselves, or anyone working on something specific.",
    duration: "[Flexible]",
    group: "[1–2 people]",
    price: "[$—]",
    includes: ["Everything above", "Flexible timing around the tide", "Written notes after"],
    youllLearn: ["Whatever you came to work on"],
    image: { src: "/images/pair.jpg", alt: "Two surfers in wetsuits holding boards, looking at the sea" },
  },
];

export const coaches = [
  { name: "[Coach name]", role: "[Head coach]", note: "[Certification, years teaching]" },
  { name: "[Coach name]", role: "[Coach]", note: "[Certification, years teaching]" },
  { name: "[Coach name]", role: "[Coach]", note: "[Certification, years teaching]" },
];

export const gallery = [
  { src: "/images/barrel.jpg", alt: "Surfer inside a turquoise barrel", w: 1920, h: 1080 },
  { src: "/images/golden.jpg", alt: "Silhouetted surfer carrying a board against a golden sea", w: 1920, h: 1198 },
  { src: "/images/paddle.jpg", alt: "Overhead view of a surfer paddling through green water", w: 1920, h: 1080 },
  { src: "/images/point.jpg", alt: "Surfer on a dark wave beneath a rocky headland", w: 1920, h: 1280 },
  { src: "/images/tube.jpg", alt: "View from inside a breaking wave looking out at a surfer", w: 1920, h: 1440 },
  { src: "/images/aerial.jpg", alt: "Aerial view of two surfers waiting in deep blue water", w: 1920, h: 1266 },
  { src: "/images/air.jpg", alt: "Surfer launching above the lip of a wave", w: 1920, h: 1177 },
  { src: "/images/texture.jpg", alt: "Long lines of swell seen from above", w: 1920, h: 1166 },
] as const;
