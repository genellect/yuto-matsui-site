import { site } from "../site";
export const founderOrigin = site.origin;
export const compassOrigin = site.compassOrigin;

// Desktop and mobile show different portraits in the same slot. `focus` marks
// the face (eyes and top of the head) so the crop can follow any screen shape;
// `position` is the static crop used before JavaScript runs.
export const heroSlides = [
  {
    src: "/images/founder-portfolio/yuto-matsui-illuminated-steps-hero-20260901.jpg",
    size: [1566, 1044],
    focus: { x: 0.45, y: 0.42, head: 0.35 },
    alt: "Yuto Matsui seated on illuminated steps at night",
    label: "Tokyo / Light",
    position: "33% 50%",
    mobilePosition: "50% 50%",
    mobile: {
      src: "/images/founder-portfolio/yuto-matsui-illuminated-steps-hero-20260901.jpg",
      size: [1566, 1044],
      focus: { x: 0.45, y: 0.42, head: 0.35 },
      alt: "Yuto Matsui seated on illuminated steps at night"
    }
  },
  {
    src: "/images/founder-portfolio/yuto-matsui-city-night-hero-20261118.webp",
    size: [1333, 2000],
    focus: { x: 0.375, y: 0.505, head: 0.4 },
    alt: "Yuto Matsui smiling on a city street at night",
    label: "City / Night",
    position: "50% 45%",
    mobilePosition: "50% 50%",
    mobile: {
      src: "/images/founder-portfolio/yuto-matsui-harbor-dusk-hero-20261118.webp",
      size: [2000, 1333],
      focus: { x: 0.36, y: 0.51, head: 0.33 },
      alt: "Yuto Matsui by the harbor at dusk with city lights beyond"
    }
  },
  {
    src: "/images/founder-portfolio/yuto-matsui-harbor-dusk-hero-20261118.webp",
    size: [2000, 1333],
    focus: { x: 0.36, y: 0.51, head: 0.33 },
    alt: "Yuto Matsui by the harbor at dusk with city lights beyond",
    label: "Harbor / Dusk",
    position: "8% 50%",
    mobilePosition: "17% 50%",
    mobile: {
      src: "/images/founder-portfolio/yuto-matsui-light-pillar-hero-20261118.webp",
      size: [1333, 2000],
      focus: { x: 0.5, y: 0.425, head: 0.335 },
      alt: "Yuto Matsui smiling at night beside a lit pillar"
    }
  }
] as const;

export const expertise = [
  {
    number: "01",
    title: "Life Science Research",
    description:
      "Understanding the molecular mechanisms of neurodegenerative disease through experimental research.",
    image: "/images/founder-portfolio/source/life-science-unsplash.jpg",
    alt: "Microscope used for observing cell culture",
    accent: "biotic"
  },
  {
    number: "02",
    title: "AI-Native Development",
    description:
      "Expanding the scale of systems one person can design and build with AI.",
    image: "/images/founder-portfolio/source/software-development-unsplash.jpg",
    alt: "Software development environment displaying source code",
    accent: "signal"
  }
] as const;

export const products = [
  {
    key: "cytellect",
    label: "cytellect",
    title: "Get your microscopy publication-ready.",
    links: [{ label: "Explore cytellect", href: "https://cytellect.vercel.app/" }],
    recognition: [
      { event: "Tokyo AI Hackathon 2026", result: "Grand Prize", honor: "gold", href: "https://www.hiroshimai.co.jp/tokyohackathon" },
      { event: "Kitasato University ChatGPT Hackathon 2026", result: "Runner-up" },
      { event: "Geekten 2026", result: "Finalist" }
    ]
  },
  {
    key: "topos",
    label: "Topos",
    headline: ["Every voice deserves", "to be heard."],
    links: [{ label: "Explore Topos", href: "https://web--devfest2026-t167.asia-east1.hosted.app/lp" }],
    recognition: [
      { event: "DevFest GDGoC Hackathon 2026", result: "Exhibited Project" },
      { event: "Team Triple Helix", result: "Project Manager" }
    ]
  },
  {
    key: "interactive",
    label: "COMPASS Interactive",
    title: "Real-time feedback and AI, built into the lecture experience.",
    links: [
      { label: "Explore Interactive", href: `${compassOrigin}/INTRO_Interactive/` }
    ]
  },
  {
    key: "platform",
    label: "COMPASS",
    title: "Don’t Just Learn. Build What’s Next.",
    links: [{ label: "Explore COMPASS", href: `${compassOrigin}/` }]
  }
] as const;

export const statementParagraphs = [
  "I began programming in high school, around 2020. At university, I chose pharmaceutical science and entered molecular biology, where I began studying the mechanisms of neurodegenerative disease.",
  "Those two paths now define how I see the future.",
  "Research taught me how difficult it is to turn knowledge into progress. Engineering gave me another way to contribute: not only by generating knowledge, but by building the tools and systems that help people use it better.",
  "As AI advanced, I began bringing those two worlds together. I continued experimental research while expanding into full-stack development, cloud systems, and AI-native engineering. The combination changed what I believed one person could build—and the scale of problems I was prepared to take on.",
  "I first applied that approach to education.",
  "I saw useful academic opportunities and resources scattered across departments, personal networks, and chance encounters. So I built a platform to bring them together, formed a student team around it, and later developed a real-time learning system that was adopted in university lectures. What began as a student project grew into a working system used in real educational settings.",
  "In the laboratory, I see a different problem with much larger consequences. Scientific progress depends on the time and attention researchers can devote to thinking, experimenting, and interpreting results. Too much of both is still consumed by fragmented information, repetitive work, and tools that do not reflect how research is actually done.",
  "Today, I continue my work in experimental research while building at the intersection of life science and engineering.",
  "For me, that intersection is not simply about applying technology to science. It is about redesigning the ecosystem in which life science happens—how knowledge is created, connected, tested, and turned into discovery.",
  "Better systems can do more than make science more efficient. They can expand the questions researchers are able to ask, accelerate what they are able to discover, and bring more discoveries closer to the patients who need them.",
  "That is the scale at which I intend to contribute to life science—not through a single experiment, product, or company, but by helping build a better foundation for discovery itself.",
  "If that foundation can help science move faster, researchers go further, and ultimately more patients, then that is work worth devoting a life to."
] as const;

export const experience = [
  {
    area: "Life Science",
    years: "3+ years",
    focus: ["Molecular Biology", "Cell Biology", "Neuroscience"],
    image: "/images/founder-portfolio/source/experience-life-science.webp",
    alt: "Laboratory equipment used in molecular and cell biology"
  },
  {
    area: "Development",
    years: "4+ years",
    focus: ["Full-Stack Web Development", "Cloud & Infrastructure Design", "AI & Machine Learning"],
    image: "/images/founder-portfolio/source/experience-development.webp",
    alt: "Monitor displaying source code"
  },
  {
    area: "Education",
    years: "4+ years",
    focus: ["English Education", "Life Science Education", "AI Literacy"],
    image: "/images/founder-portfolio/source/experience-education.webp",
    alt: "University lecture hall with tiered seating"
  }
] as const;

export const credentials = [
  { mark: "IELTS", name: "IELTS Academic", score: "7.5", cefr: "Aligned with CEFR C1" },
  { mark: "TOEIC", name: "TOEIC Listening & Reading", score: "965", cefr: "Equivalent to CEFR C1" },
  { mark: "EIKEN", name: "EIKEN Grade 1", score: "Grade 1", cefr: "Equivalent to CEFR C1" }
] as const;

export const offHours = [
  {
    number: "01",
    label: "DRIVE",
    image: "/images/founder-portfolio/off-hours-drive.webp",
    alt: "A car driving along a highland road with snow-covered mountains beyond",
    copy:
      "I enjoy driving through natural landscapes. One of my favorite memories is a road trip through Nagano with friends."
  },
  {
    number: "02",
    label: "SHOGI",
    image: "/images/founder-portfolio/off-hours-shogi.webp",
    alt: "Entrance to the new Shogi Kaikan in Sendagaya",
    copy:
      "I have played shogi since elementary school and hold amateur 3-dan. I have also competed in several national tournaments."
  },
  {
    number: "03",
    label: "CLIMBING",
    image: "/images/founder-portfolio/off-hours-climbing.webp",
    alt: "Yuto Matsui climbing an indoor bouldering wall",
    copy:
      "I was part of my high school climbing club. I climb less often now, but I still enjoy hiking and time in nature."
  }
] as const;

export type FragmentPhoto = {
  key: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  tone?: "warm" | "lift" | "tech";
  position?: string;
};

const fragmentRoot = "/images/founder-portfolio/fragments";

export const fragmentPhotos: readonly FragmentPhoto[] = [
  { key: "yuto-696", src: `${fragmentRoot}/yuto-696-1566.webp`, width: 1566, height: 1044, alt: "Yuto Matsui seated on illuminated steps", tone: "warm", position: "50% 58%" },
  { key: "dna-automation", src: `${fragmentRoot}/dna-automation-1920.webp`, width: 1920, height: 1280, alt: "Automated liquid-handling system processing DNA samples" },
  { key: "yuto-706", src: `${fragmentRoot}/yuto-706-1044.webp`, width: 1044, height: 1566, alt: "Yuto Matsui standing against a night-time cityscape", tone: "warm" },
  { key: "microfluidic", src: `${fragmentRoot}/microfluidic-1920.webp`, width: 1920, height: 1280, alt: "Precision microfluidic devices used in research and development" },
  { key: "code-terminal", src: `${fragmentRoot}/code-terminal-1920.webp`, width: 1920, height: 1280, alt: "Code editor and terminal on a development screen", tone: "tech" },
  { key: "yuto-701", src: `${fragmentRoot}/microscope-pawel-1108.webp`, width: 1108, height: 1477, alt: "A stereo microscope against a white background (stock photograph)", position: "50% 58%" },
  { key: "pipette", src: `${fragmentRoot}/pipette-1920.webp`, width: 1920, height: 2658, alt: "A researcher pipetting a laboratory sample" },
  { key: "yuto-2360", src: `${fragmentRoot}/yuto-2360-anchor-1566.webp`, width: 1566, height: 1044, alt: "Yuto Matsui leaning against a tree among summer flowers", tone: "lift", position: "52% 54%" },
  { key: "code-data", src: `${fragmentRoot}/code-data-1920.webp`, width: 1920, height: 1278, alt: "Laptop displaying code and performance analysis charts", tone: "tech" },
  { key: "yuto-2339", src: `${fragmentRoot}/yuto-2339-rain-1044.webp`, width: 1044, height: 1566, alt: "Yuto Matsui looking toward a car in the rain", tone: "warm" },
  { key: "yuto-yokohama", src: `${fragmentRoot}/yuto-yokohama-city-1600.webp`, width: 1600, height: 2400, alt: "Yuto Matsui seated in a Yokohama streetscape" },
  { key: "yuto-nagano", src: `${fragmentRoot}/yuto-nagano-highland-1566.webp`, width: 1566, height: 1044, alt: "Yuto Matsui against the mountains and highlands of Nagano" },
  { key: "servers", src: `${fragmentRoot}/servers-1920.webp`, width: 1920, height: 1280, alt: "Rows of server racks in a data center", tone: "tech" },
  { key: "yuto-mist-lift", src: `${fragmentRoot}/yuto-mist-lift-1477.webp`, width: 1477, height: 1108, alt: "Yuto Matsui standing beside a ski lift fading into mist" },
  { key: "silicon-wafer", src: `${fragmentRoot}/silicon-wafer-1920.webp`, width: 1920, height: 1278, alt: "Silicon wafer held in front of a deposition chamber", tone: "warm" },
  { key: "yuto-697", src: `${fragmentRoot}/yuto-697-1044.webp`, width: 1044, height: 1566, alt: "Yuto Matsui seated beneath traditional lanterns", tone: "warm" },
  { key: "yuto-698", src: `${fragmentRoot}/yuto-698-atmosphere-1477.webp`, width: 1477, height: 1108, alt: "Yuto Matsui standing beside pine trees" },
  { key: "yuto-699", src: `${fragmentRoot}/yuto-699-1044.webp`, width: 1044, height: 1566, alt: "Yuto Matsui seated within curved architectural forms", tone: "warm" },
  { key: "yuto-704", src: `${fragmentRoot}/yuto-704-1372.webp`, width: 1372, height: 1192, alt: "A quiet profile of Yuto Matsui in front of pine branches" }
];

// Rendered text from src/app/(en)/en/page.tsx; JSX structure stays in the component.
export const pageCopy = {
  "externalArrow": "↗",
  "skipLink": "Skip to content",
  "wordmarkLabel": "Yuto Matsui portfolio home",
  "wordmarkName": "YUTO MATSUI",
  "wordmarkRole": "Researcher & Engineer",
  "navigationLabel": "Portfolio navigation",
  "navExpertise": "Expertise",
  "navExperience": "Experience",
  "navFragments": "Fragments",
  "navStatement": "Statement",
  "navWork": "Work",
  "navContact": "Contact",
  "languageSwitch": "Language",
  "languageSwitch2": "JP",
  "languageSwitch3": "/",
  "languageSwitch4": "EN",
  "heroRole": "Systems Engineer",
  "heroRole2": " · ",
  "heroRole3": "Molecular Biology Research",
  "englishFounderTitle": "Yuto Matsui",
  "heroThesis": "Advancing Science,",
  "heroThesis2": "Transforming Education.",
  "heroDomains": "Life Science Research",
  "heroDomains2": " × ",
  "heroDomains3": "AI-Native Development",
  "heroSocialLinks": "Yuto Matsui social profiles",
  "heroSocialLinks2": "Instagram",
  "heroSocialLinks3": "GitHub",
  "expertiseIndex": "02 / Expertise",
  "expertiseTitle": "Expertise",
  "experienceIndex": "06 / Experience & Credentials",
  "experienceTitle": "EXPERIENCE",
  "evidenceHeading": "As of November 2026",
  "experienceLink": "Development — Yuto Matsui’s GitHub profile (opens in a new tab)",
  "credentialsGrid": "English language credentials",
  "statementIndex": "04 / Personal Statement",
  "statementTitle": "Between Life Science and Engineering",
  "statementPortrait": "Yuto Matsui facing the camera",
  "workIndex": "05 / Selected Work",
  "workTitle": "Selected Work",
  "offHoursIndex": "07 / Away from the desk",
  "offHoursTitle": "OFF HOURS",
  "contactIndex": "08 / Contact",
  "contactTitle": "Get in touch.",
  "contactIntroduction": "I’m always open to thoughtful conversations, collaborations, and new opportunities.",
  "contactIntroduction2": "Feel free to reach out anytime. I’m happy to connect in English and available for Zoom or Google Meet conversations.",
  "contactIntroduction3": "Please include your name, affiliation, and a brief introduction when contacting me.",
  "emailDetailsLabel": "Email contact details",
  "contactName": "Yuto Matsui",
  "contactRole": "Researcher & Engineer",
  "personalEmailLabel": "Personal",
  "personalEmail": "contact@yuto-matsui.com",
  "universityEmailLabel": "Univ.",
  "universityEmail": "matsui.yuto@st.kitasato-u.ac.jp",
  "footerName": "Yuto Matsui",
  "footerRole": "Life Science Research · AI-Native Engineering",
  "footerLinksLabel": "Personal links",
  "footerInstagram": "Instagram ",
  "footerGitHub": "GitHub ",
  "backToTop": "Back to top ↑",
  "footerLanguageSwitch": "Language",
  "footerLanguageSwitch2": "JP",
  "footerLanguageSwitch3": "EN",
  "credits": "Image credits",
  "creditsLifeScience": "Life science: ",
  "creditJaronNix": "Jaron Nix / Unsplash",
  "creditsSoftware": " · Software development: ",
  "creditRobWingate": "Rob Wingate / Unsplash",
  "creditsPersonalAndDevelopment": " · Education portrait: Yuto Matsui / personal archive · Experience — Life science: Yuto Matsui / personal archive · Experience — Development: ",
  "creditNemuelSereti": "Nemuel Sereti / Pexels",
  "creditsEducation": " · Experience — Education: ",
  "creditFabioSasso": "Fabio Sasso / Unsplash",
  "creditsManifestoAndDrive": " · Manifesto visual: COMPASS visual archive · Drive: ",
  "creditZixplore": "Zixplore / Unsplash",
  "creditsShogi": " · Shogi: ",
  "creditAsanagi": "Asanagi / Wikimedia Commons (CC0)",
  "creditsDna": " · FRAGMENTS — DNA automation: ",
  "creditNci": "National Cancer Institute / Unsplash",
  "creditsMicroscopy": " · Microscopy: ",
  "creditPawel": "Pawel Czerwinski / Unsplash",
  "creditsPipetting": " · Pipetting: ",
  "creditCdc": "CDC / Unsplash",
  "creditsTerminal": " · Code and terminal: ",
  "creditBernd": "Bernd Dittrich / Unsplash",
  "creditsAnalysis": " · Development analysis: ",
  "creditDaniil": "Daniil Komov / Unsplash",
  "creditsServers": " · Servers: ",
  "creditKevin": "Kevin Ache / Unsplash",
  "creditsMicrofluidics": " · Microfluidic devices: ",
  "creditOist": "OIST / CC BY 4.0",
  "creditsWafer": " · Silicon wafer: ",
  "creditsPersonal": " · Personal portraits, FRAGMENTS & climbing: Yuto Matsui / personal archive",
  "copyright": "© 2026 Yuto Matsui. Designed and developed by Yuto Matsui. All rights reserved."
} as const;

// Rendered text from src/en/EnglishFragments.tsx; JSX structure stays in the component.
export const fragmentCopy = {
  "sectionIndex": "03 / Archive",
  "fragmentsTitle": "FRAGMENTS",
  "fragmentsHeading": "Research, systems, cities, and the quiet moments between them.",
  "presentationLabel": "FRAGMENTS presentation",
  "threeDimensionalView": "3D",
  "originalView": "Original",
  "englishFragmentOriginal": "Scrollable photo archive"
} as const;

// Rendered text from src/en/EnglishHeroGallery.tsx; JSX structure stays in the component.
export const heroCopy = {
  "heroGallery": "Portraits of Yuto Matsui",
  "heroProgress": "Select a portrait",
  "heroGalleryMeta": " / ",
  "heroGalleryMeta2": " · ",
  "heroCoordinates": "35.68° N  139.76° E  2026 / TOKYO"
} as const;

// Rendered text from src/en/EnglishMobileMenu.tsx; JSX structure stays in the component.
export const menuCopy = {
  "mobileHeaderLanguage": "Language",
  "mobileHeaderLanguage2": "JP",
  "mobileHeaderLanguage3": "/",
  "mobileHeaderLanguage4": "EN",
  "mobileMenuHeader": "YUTO MATSUI",
  "mobileMenuHeader2": "Close navigation",
  "mobileMenuHeader3": "Close",
  "mobileMenuLinks": "Mobile portfolio navigation",
  "mobileMenuSocials": "Social profiles",
  "mobileMenuSocials2": "Instagram",
  "mobileMenuSocials3": "GitHub",
  "mobileMenuLanguage": "Language",
  "mobileMenuLanguage2": "JP",
  "mobileMenuLanguage3": "/",
  "mobileMenuLanguage4": "EN"
} as const;

// Dynamic control labels; state and element structure remain in the components.
export const controls = {
  "resumePortraits": "Resume automatic portrait changes",
  "pausePortraits": "Pause automatic portrait changes",
  "portraitPlay": "Play",
  "portraitPause": "Pause",
  "closeMenu": "Close navigation",
  "openMenu": "Open navigation",
  "closeStatement": "Close statement",
  "readStatement": "Read the full statement",
  "collapseSymbol": "−",
  "expandSymbol": "+",
  "resumeProducts": "Resume 3D motion",
  "pauseProducts": "Pause 3D motion",
  "productPlay": "Play",
  "productPause": "Pause",
  "filmDescription": "Curved photographic film. Use the arrow keys, drag, or scroll horizontally to move.",
  "filmArchiveLabel": "FRAGMENTS photo archive",
  "filmPrevious": "Previous image",
  "filmResume": "Resume automatic film movement",
  "filmPause": "Pause automatic film movement",
  "filmNext": "Next image",
  "mobileFilmDescription": "Photographic film. Drag horizontally or use the arrow keys.",
  "mobileFilmPrevious": "Previous image",
  "mobileFilmResume": "Resume automatic film movement",
  "mobileFilmPause": "Pause automatic film movement",
  "mobileFilmNext": "Next image"
} as const;

export const mobileLinks = [
  { label: "Expertise", href: "#expertise" },
  { label: "Fragments", href: "#fragments" },
  { label: "Statement", href: "#statement" },
  { label: "Selected Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Off Hours", href: "#off-hours" },
  { label: "Contact", href: "#contact" }
] as const;
