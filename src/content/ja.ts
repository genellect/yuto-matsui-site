import type { Metadata } from "next";
import { FOUNDER_URL, FOUNDER_EN_URL, COMPASS_ORIGIN } from "../site";

export const japaneseMetadata: Metadata = {
  title: "Yuto Matsui / 松井優知 | Life Science Research & AI-Native Development",
  description:
    "生命科学研究とAIネイティブ開発を軸に、分子生物学研究とシステムエンジニアとしての実務に取り組むYuto Matsui / 松井優知の個人ポートフォリオ。",
  alternates: {
    canonical: FOUNDER_URL,
    languages: { ja: FOUNDER_URL, en: FOUNDER_EN_URL, "x-default": FOUNDER_URL }
  },
  authors: [{ name: "Yuto Matsui / 松井優知" }],
  openGraph: {
    locale: "ja_JP",
    type: "profile",
    siteName: "Yuto Matsui",
    title: "Yuto Matsui / 松井優知",
    description: "ライフサイエンス研究・AIネイティブ開発・大学教育支援。",
    url: FOUNDER_URL,
    images: [
      {
        url: `${FOUNDER_URL}images/founder-portfolio/yuto-matsui-profile-hero.webp`,
        width: 1600,
        height: 2400,
        alt: "Yuto Matsui / 松井優知"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuto Matsui / 松井優知",
    description: "ライフサイエンス研究・AIネイティブ開発・大学教育支援。",
    images: [`${FOUNDER_URL}images/founder-portfolio/yuto-matsui-profile-hero.webp`]
  }
};

export const fields = [
  {
    id: "01",
    title: "分子生物学研究",
    english: "Molecular Biology Research",
    description: "神経変性疾患の分子病態を、実験研究の現場から理解する。",
    image: "/images/founder-portfolio/source/life-science-unsplash.jpg",
    alt: "細胞培養の観察に使われる顕微鏡",
    accent: "bio"
  },
  {
    id: "02",
    title: "AIネイティブ開発",
    english: "AI-Native Development",
    description: "AIとともに、一人が設計・実装できるシステムの規模を広げる。",
    image: "/images/founder-portfolio/source/software-development-unsplash.jpg",
    alt: "ソースコードを表示したPCの開発環境",
    accent: "ai"
  }
] as const;

export const products = [
  {
    key: "cytellect",
    label: "cytellect",
    title: "Get your microscopy publication-ready.",
    links: [{ label: "プロダクトLP", href: "https://cytellect.vercel.app/" }],
    recognition: [
      { event: "北里大学ChatGPTハッカソン2026", result: "準優勝" },
      { event: "東京AIハッカソン2026", result: "本選進出" },
      { event: "技育展2026", result: "決勝進出" }
    ]
  },
  {
    key: "topos",
    label: "Topos",
    title: "誰の考えも埋もれない議論を、すべての教室に。",
    links: [{ label: "プロダクトLP", href: "https://web--devfest2026-t167.asia-east1.hosted.app/lp" }],
    recognition: [
      { event: "チーム「Triple Helix」", result: "Project Manager" },
      { event: "DevFest GDGoC Hackathon 2026", result: "出展" }
    ]
  },
  {
    key: "interactive",
    label: "COMPASS Interactive",
    title: "リアルタイム × AIが、講義を次の次元へ。",
    image: "/images/hero.desktop.highlight.webp",
    alt: "DNA、コンパス、ネットワークで構成されたCOMPASS Interactiveのビジュアル",
    links: [
      { label: "紹介サイト", href: `${COMPASS_ORIGIN}/INTRO_Interactive/` }
    ]
  },
  {
    key: "platform",
    label: "COMPASS",
    title: "Don’t Just Learn. Build What’s Next.",
    links: [{ label: "COMPASSを体験する", href: `${COMPASS_ORIGIN}/` }]
  }
] as const;

export const credentials = [
  { kind: "eiken", mark: "英検", name: "実用英語技能検定", score: "1級" },
  { kind: "toeic", mark: "TOEIC", name: "TOEIC L&R", score: "965" },
  { kind: "ielts", mark: "IELTS", name: "IELTS Academic", score: "7.5" }
] as const;

export const experience = [
  {
    area: "Life Science",
    years: "3+ years",
    focus: ["分子生物学", "細胞生物学", "神経科学"],
    image: "/images/founder-portfolio/source/experience-life-science.webp",
    alt: "分子生物学・細胞生物学の実験に用いる機器と器具が並ぶ研究室",
    accent: "bio"
  },
  {
    area: "Development",
    years: "4+ years",
    focus: ["フルスタックWeb開発", "クラウド・インフラ設計", "AI・Machine Learning"],
    image: "/images/founder-portfolio/source/experience-development.webp",
    alt: "ソースコードを表示したモニター",
    accent: "ai"
  },
  {
    area: "Education",
    years: "4+ years",
    focus: ["英語教育", "生命科学教育", "AIリテラシー"],
    image: "/images/founder-portfolio/source/experience-education.webp",
    alt: "スクリーンと階段状の座席がある大学の講義室",
    accent: "education"
  }
] as const;

export const offHours = [
  {
    id: "01",
    label: "DRIVE",
    image: "/images/founder-portfolio/off-hours-drive.webp",
    alt: "雪山と新緑を背景に高原道路を走る車",
    copy: [
      "自然の中で車を走らせるのが好きです。",
      "一番の思い出は、友人との長野ドライブです。"
    ]
  },
  {
    id: "02",
    label: "SHOGI",
    image: "/images/founder-portfolio/off-hours-shogi.webp",
    alt: "新将棋会館のエントランスと将棋会館の石碑",
    copy: [
      "将棋は小学生から始め、棋力はアマチュア三段です。",
      "全国大会にも何度か出場しました。"
    ]
  },
  {
    id: "03",
    label: "CLIMBING",
    image: "/images/founder-portfolio/off-hours-climbing.webp",
    alt: "ボルダリングウォールを登るYuto Matsui",
    copy: [
      "高校時代はクライミング部。",
      "最近は頻度こそ減りましたが、登山や自然の中で過ごすことが好きです。"
    ]
  }
] as const;

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Yuto Matsui",
  alternateName: "松井優知",
  url: FOUNDER_URL,
  image: `${FOUNDER_URL}images/founder-portfolio/yuto-matsui-profile-hero.webp`,
  knowsAbout: [
    "Life science research",
    "AI-native software development",
    "University education support"
  ],
  founder: {
    "@type": "Organization",
    name: "COMPASS",
    url: `${COMPASS_ORIGIN}/`
  },
  sameAs: ["https://github.com/genellect", "https://www.instagram.com/n.m.w.314/"]
};

export type FragmentPhoto = {
  key: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  role: "anchor" | "research" | "engineering" | "atmosphere" | "closing";
  crop?: "anchor" | "lab" | "pipette" | "code-window";
  tone?: "warm" | "lift" | "tech";
  sizes: string;
};

export const assetRoot = "/images/founder-portfolio/fragments";

export const fragmentSpreads: readonly (readonly FragmentPhoto[])[] = [
  [
    {
      key: "yuto-696",
      src: `${assetRoot}/yuto-696-1566.webp`,
      srcSet: `${assetRoot}/yuto-696-640.webp 640w, ${assetRoot}/yuto-696-1566.webp 1566w`,
      width: 1566,
      height: 1044,
      alt: "ライトアップされた階段に腰掛けるYuto Matsui",
      role: "anchor",
      crop: "anchor",
      tone: "warm",
      sizes: "(max-width: 900px) calc(100vw - 34px), 66vw"
    },
    {
      key: "dna-automation",
      src: `${assetRoot}/dna-automation-1920.webp`,
      srcSet: `${assetRoot}/dna-automation-640.webp 640w, ${assetRoot}/dna-automation-1280.webp 1280w, ${assetRoot}/dna-automation-1920.webp 1920w`,
      width: 1920,
      height: 1280,
      alt: "DNA試料を自動処理するリキッドハンドリング装置",
      role: "research",
      sizes: "(max-width: 900px) 46vw, 33vw"
    },
    {
      key: "yuto-706",
      src: `${assetRoot}/yuto-706-1044.webp`,
      srcSet: `${assetRoot}/yuto-706-640.webp 640w, ${assetRoot}/yuto-706-1044.webp 1044w`,
      width: 1044,
      height: 1566,
      alt: "夜の都市を背景に立つYuto Matsui",
      role: "atmosphere",
      tone: "warm",
      sizes: "(max-width: 900px) calc(100vw - 34px), 25vw"
    },
    {
      key: "microfluidic",
      src: `${assetRoot}/microfluidic-1920.webp`,
      srcSet: `${assetRoot}/microfluidic-640.webp 640w, ${assetRoot}/microfluidic-1280.webp 1280w, ${assetRoot}/microfluidic-1920.webp 1920w`,
      width: 1920,
      height: 1280,
      alt: "研究開発に用いられる精密なマイクロ流体デバイス",
      role: "research",
      sizes: "(max-width: 900px) 46vw, 17vw"
    },
    {
      key: "code-terminal",
      src: `${assetRoot}/code-terminal-1920.webp`,
      srcSet: `${assetRoot}/code-terminal-640.webp 640w, ${assetRoot}/code-terminal-1280.webp 1280w, ${assetRoot}/code-terminal-1920.webp 1920w`,
      width: 1920,
      height: 1280,
      alt: "コードエディターとターミナルを表示した開発画面",
      role: "engineering",
      tone: "tech",
      sizes: "(max-width: 900px) calc(100vw - 34px), 50vw"
    }
  ],
  [
    {
      key: "yuto-701",
      src: `${assetRoot}/microscope-pawel-1108.webp`,
      srcSet: `${assetRoot}/microscope-pawel-640.webp 640w, ${assetRoot}/microscope-pawel-1108.webp 1108w`,
      width: 1108,
      height: 1477,
      alt: "白い背景に置かれた実体顕微鏡（公開素材）",
      role: "research",
      crop: "lab",
      sizes: "(max-width: 900px) 46vw, 17vw"
    },
    {
      key: "pipette",
      src: `${assetRoot}/pipette-1920.webp`,
      srcSet: `${assetRoot}/pipette-640.webp 640w, ${assetRoot}/pipette-1280.webp 1280w, ${assetRoot}/pipette-1920.webp 1920w`,
      width: 1920,
      height: 2658,
      alt: "手袋を着けた手で試料を分注するピペット操作",
      role: "research",
      crop: "pipette",
      sizes: "(max-width: 900px) 46vw, 25vw"
    },
    {
      key: "yuto-698",
      src: `${assetRoot}/yuto-2360-anchor-1566.webp`,
      srcSet: `${assetRoot}/yuto-2360-anchor-640.webp 640w, ${assetRoot}/yuto-2360-anchor-1566.webp 1566w`,
      width: 1566,
      height: 1044,
      alt: "花の咲く木立で木にもたれるYuto Matsui",
      role: "anchor",
      crop: "anchor",
      tone: "lift",
      sizes: "(max-width: 900px) calc(100vw - 34px), 58vw"
    },
    {
      key: "code-data",
      src: `${assetRoot}/code-data-1920.webp`,
      srcSet: `${assetRoot}/code-data-640.webp 640w, ${assetRoot}/code-data-1280.webp 1280w, ${assetRoot}/code-data-1920.webp 1920w`,
      width: 1920,
      height: 1278,
      alt: "開発環境とパフォーマンス分析チャートを表示したノートPC",
      role: "engineering",
      tone: "tech",
      sizes: "(max-width: 900px) calc(100vw - 34px), 58vw"
    },
    {
      key: "yuto-703",
      src: `${assetRoot}/yuto-2339-rain-1044.webp`,
      srcSet: `${assetRoot}/yuto-2339-rain-640.webp 640w, ${assetRoot}/yuto-2339-rain-1044.webp 1044w`,
      width: 1044,
      height: 1566,
      alt: "雨の中、傘を差して車を見つめるYuto Matsui",
      role: "atmosphere",
      tone: "warm",
      sizes: "(max-width: 900px) calc(100vw - 34px), 17vw"
    }
  ],
  [
    {
      key: "code-window",
      src: `${assetRoot}/yuto-yokohama-city-1600.webp`,
      srcSet: `${assetRoot}/yuto-yokohama-city-640.webp 640w, ${assetRoot}/yuto-yokohama-city-1280.webp 1280w, ${assetRoot}/yuto-yokohama-city-1600.webp 1600w`,
      width: 1600,
      height: 2400,
      alt: "横浜の街角でベンチに座るYuto Matsui",
      role: "atmosphere",
      crop: "code-window",
      sizes: "(max-width: 900px) calc(100vw - 34px), 25vw"
    },
    {
      key: "yuto-695",
      src: `${assetRoot}/yuto-nagano-highland-1566.webp`,
      srcSet: `${assetRoot}/yuto-nagano-highland-640.webp 640w, ${assetRoot}/yuto-nagano-highland-1566.webp 1566w`,
      width: 1566,
      height: 1044,
      alt: "長野の高原と山並みを背景に立つYuto Matsui",
      role: "atmosphere",
      sizes: "(max-width: 900px) 46vw, 42vw"
    },
    {
      key: "servers",
      src: `${assetRoot}/servers-1920.webp`,
      srcSet: `${assetRoot}/servers-640.webp 640w, ${assetRoot}/servers-1280.webp 1280w, ${assetRoot}/servers-1920.webp 1920w`,
      width: 1920,
      height: 1280,
      alt: "データセンターに並ぶサーバーラック",
      role: "engineering",
      tone: "tech",
      sizes: "(max-width: 900px) 46vw, 33vw"
    },
    {
      key: "yuto-707",
      src: `${assetRoot}/yuto-mist-lift-1477.webp`,
      srcSet: `${assetRoot}/yuto-mist-lift-640.webp 640w, ${assetRoot}/yuto-mist-lift-1477.webp 1477w`,
      width: 1477,
      height: 1108,
      alt: "霧に包まれたリフト乗り場に立つYuto Matsui",
      role: "atmosphere",
      sizes: "(max-width: 900px) 46vw, 42vw"
    },
    {
      key: "silicon-wafer",
      src: `${assetRoot}/silicon-wafer-1920.webp`,
      srcSet: `${assetRoot}/silicon-wafer-640.webp 640w, ${assetRoot}/silicon-wafer-1280.webp 1280w, ${assetRoot}/silicon-wafer-1920.webp 1920w`,
      width: 1920,
      height: 1278,
      alt: "成膜装置の前で保持されるシリコンウェハー",
      role: "engineering",
      tone: "warm",
      sizes: "(max-width: 900px) 62vw, 42vw"
    }
  ],
  [
    {
      key: "yuto-697",
      src: `${assetRoot}/yuto-697-1044.webp`,
      srcSet: `${assetRoot}/yuto-697-640.webp 640w, ${assetRoot}/yuto-697-1044.webp 1044w`,
      width: 1044,
      height: 1566,
      alt: "提灯の下に座るYuto Matsui",
      role: "atmosphere",
      tone: "warm",
      sizes: "(max-width: 900px) 46vw, 25vw"
    },
    {
      key: "yuto-700",
      src: `${assetRoot}/yuto-698-atmosphere-1477.webp`,
      srcSet: `${assetRoot}/yuto-698-atmosphere-640.webp 640w, ${assetRoot}/yuto-698-atmosphere-1477.webp 1477w`,
      width: 1477,
      height: 1108,
      alt: "松の木のそばに立つYuto Matsui",
      role: "atmosphere",
      sizes: "(max-width: 900px) calc(100vw - 34px), 58vw"
    },
    {
      key: "yuto-699",
      src: `${assetRoot}/yuto-699-1044.webp`,
      srcSet: `${assetRoot}/yuto-699-640.webp 640w, ${assetRoot}/yuto-699-1044.webp 1044w`,
      width: 1044,
      height: 1566,
      alt: "曲線的な建築のカフェテラスに座るYuto Matsui",
      role: "atmosphere",
      tone: "warm",
      sizes: "(max-width: 900px) 46vw, 25vw"
    },
    {
      key: "yuto-704",
      src: `${assetRoot}/yuto-704-1372.webp`,
      srcSet: `${assetRoot}/yuto-704-640.webp 640w, ${assetRoot}/yuto-704-1372.webp 1372w`,
      width: 1372,
      height: 1192,
      alt: "松の木を背景に横を向くYuto Matsui",
      role: "closing",
      sizes: "(max-width: 900px) calc(100vw - 34px), 33vw"
    }
  ]
] as const;

export const fragmentPhotos = fragmentSpreads.flat();

export const mobileFragmentRows = [
  fragmentPhotos.filter((_, index) => index % 2 === 0),
  fragmentPhotos.filter((_, index) => index % 2 === 1)
] as const;

export const heroSlides = [
  {
    src: "/images/founder-portfolio/yuto-matsui-profile-hero.webp",
    alt: "横顔のYuto Matsui / 松井優知",
    location: "PORTRAIT / SIDE",
    motion: "from-left",
    focus: "natural"
  },
  {
    src: "/images/founder-portfolio/yuto-matsui-nagano-lake-hero-centered-20260917.webp",
    alt: "長野の湖と山々を背景に立つYuto Matsui / 松井優知",
    location: "NAGANO / NATURE",
    motion: "from-right",
    focus: "face-centered"
  },
  {
    src: "/images/founder-portfolio/yuto-matsui-city-night-hero-composition-20260928.webp",
    alt: "冬のイルミネーションを背景に立つYuto Matsui / 松井優知",
    location: "CITY / NIGHT",
    motion: "night-focus",
    focus: "face-centered"
  }
] as const;


// Rendered text from src/app/(ja)/page.tsx; JSX structure stays in the component.
export const pageCopy = {
  "externalArrow": "↗",
  "skipLink": "本文へスキップ",
  "wordmarkLabel": "Yuto Matsui ポートフォリオの先頭へ",
  "wordmarkName": "YUTO MATSUI",
  "wordmarkRole": "Research × Engineering",
  "navigationLabel": "Portfolio navigation",
  "navExpertise": "Expertise",
  "navStory": "Story",
  "navProducts": "Products",
  "navCredentials": "Credentials",
  "navOffHours": "Off Hours",
  "navContact": "Contact",
  "languageLabel": "言語切替",
  "japaneseLanguage": "JP",
  "languageSeparator": "/",
  "englishLanguage": "EN",
  "mobileNavigationLabel": "Mobile portfolio navigation",
  "mobileMessage": "Message",
  "mobileProducts": "Product",
  "mobileContact": "Contact",
  "mobileExternalPopover": "Yuto Matsuiの外部リンク",
  "mobileExternalIcons": "Instagram",
  "mobileExternalIcons2": "GitHub",
  "mobileLanguagePanel": "Language",
  "mobileLanguagePanel2": "JP",
  "mobileLanguagePanel3": "/",
  "mobileLanguagePanel4": "EN",
  "eyebrow": "システムエンジニア・分子生物学研究",
  "founderTitle": "Yuto Matsui",
  "japaneseName": "松井優知",
  "heroStatement": "境界を越え、",
  "heroStatement2": "新しい可能性へ。",
  "axisList": "専門領域",
  "axisList2": "生命科学研究",
  "axisList3": "AIネイティブ開発",
  "socialLinks": "Yuto Matsuiの外部リンク",
  "socialLinks2": "Instagram",
  "socialLinks3": "GitHub",
  "expertiseTitle": "Expertise",
  "storyPortraitFrame": "正面を向くYuto Matsui / 松井優知",
  "storyPortraitCaption": "Background & values",
  "storyPortraitCaption2": "THE INTERFACE",
  "statementKicker": "Personal statement",
  "storyTitle": "研究と",
  "storyTitle2": "エンジニアリングの",
  "storyTitle3": "インターフェース。",
  "originNumber": "01",
  "chapterOrigin": "Origin",
  "originProgramming": "高校時代の2020年頃から趣味でプログラミングを始め、Webアプリケーション開発を中心に学びました。当時は現在のようなAIやコーディングエージェントはなく、実装、デバッグ、Git操作の多くを手作業で行う時代でした。開発そのものにも強く惹かれていましたが、科学によって生命の仕組みを解き明かし、新しい治療につなげることにも魅力を感じ、大学では薬学部へ進学しました。",
  "originResearch": "大学では学部2年次から実験系研究室に所属し、神経変性疾患に関わる遺伝子変異と分子病態を研究してきました。その一方で、生成AIとコーディングエージェントの急速な進歩をきっかけに、研究データ解析からフルスタック開発へと領域を広げ、ソフトウェア開発にも再び軸足を置くようになりました。",
  "originAi": "そこで実感したのは、AIの価値は単にコーディングを高速化することではなく、一人の人間が設計・実装できるシステムの規模を拡張することにあるという点です。",
  "workNumber": "02",
  "chapterWork": "WORK",
  "workTransition": "個人開発から始めたソフトウェア開発は、研究を続けるなかで、生命科学研究の成果を事業として社会に届けたいという目標へと変わっていきました。そのためには、顧客と向き合い、要件を定め、システムとして届けるまでを実務で経験する必要があると考え、3年間務めた集団指導講師の仕事から、システムエンジニアの実務へと踏み出しました。現在はITベンチャー企業2社でSEとして、顧客の課題整理から要件定義、設計、実装までを一貫して担当しています。",
  "workResponsibility": "実務を通じて実感したのは、AIによって、これまで分業されていた工程を一人で担えるようになったことです。そして、そこで問われるのは経験年数や肩書きではなく、課題を見極め、AIの出力を評価し、結果に責任を持つ実行力とメタ認知能力でした。研究の現場で生まれる課題を、事業として成り立つシステムへと形にしていく。それが、いまの私の仕事の中心にあります。",
  "interfaceNumber": "03",
  "chapterInterface": "The interface",
  "interfaceMission": "私が届けたいのは、研究者が研究を前に進めるための力です。生命科学の課題を研究者として理解し、その解決を支えるシステムをエンジニアとして実装する。自分ひとりの研究成果にとどまらず、多くの研究者の生産性と研究体験を変えることで、より大きなスケールで生命科学に貢献したいと考えています。",
  "futureNumber": "04",
  "futureTitle": "Future",
  "futureBarriers": "生成AIの普及は、IT業界の働き方そのものを変えました。しかし、テクノロジーの可能性が、社会のあらゆる場所に等しく届いたわけではありません。特に教育や生命科学など、複雑な意思決定と高度な専門性を必要とする分野では、技術の進歩を現実の仕組みへと変えていくことに、今なお大きな参入障壁があります。",
  "futureAmbition": "私が目指すのは、そのような不確実性の渦の中でも、批判や失敗を恐れず、より良い未来をつくるために前へ進み続けることです。テクノロジーとライフサイエンスの融合により、人々の生産性を再設計し、これまで当然とされてきた社会の前提を書き換えることです。",
  "closingInvitation": "テクノロジーのさらなる先へ、共に進みませんか。",
  "productsKicker": "Products",
  "productsTitle": "プロダクト紹介",
  "experienceKicker": "Area / Experience / Focus",
  "experienceTitle": "EXPERIENCE",
  "experienceHeading": "2026年11月現在",
  "experienceLink": "Development — Yuto MatsuiのGitHubプロフィール（新しいタブで開く）",
  "areaLabel": "Area",
  "tenureLabel": "Experience",
  "focusLabel": "Focus",
  "credentialsKicker": "Credentials",
  "credentialsTitle": "English Proficiency",
  "offHoursKicker": "Away from the desk",
  "offHoursTitle": "OFF HOURS",
  "contactKicker": "お問い合わせ",
  "contactTitle": "CONTACT",
  "contactCopy": "ご興味を持っていただけましたら、下記のフォームからお気軽にご連絡ください。学生・教職員・団体・企業の方を問わず、さまざまな方とのご縁を歓迎しています。",
  "contactFormLink": "Contact form ",
  "contactEmail": "メールでのご連絡",
  "contactEmailIdentity": "Yuto Matsui",
  "contactEmailIdentity2": "Researcher & Engineer",
  "personalEmailLabel": "Personal：",
  "personalEmail": "contact@yuto-matsui.com",
  "universityEmailLabel": "Univ.：",
  "universityEmail": "matsui.yuto@st.kitasato-u.ac.jp",
  "footerName": "Yuto Matsui / 松井優知",
  "footerRole": "Life Science · AI-native Development · University Education",
  "footerLinksLabel": "Personal links",
  "footerInstagram": "Instagram ",
  "footerGitHub": "GitHub ",
  "backToTop": "Back to top ↑",
  "footerLanguageSwitch": "言語切替",
  "footerLanguageSwitch2": "Language",
  "footerLanguageSwitch3": "JP",
  "footerLanguageSwitch4": "EN",
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

// Rendered text from src/ja/FounderFragments.tsx; JSX structure stays in the component.
export const fragmentCopy = {
  "fragmentMobileReel": "FRAGMENTS photo reel",
  "fragmentsTitle": "FRAGMENTS",
  "presentationLabel": "FRAGMENTSの表示形式",
  "threeDimensionalView": "3D",
  "originalView": "Original",
  "fragmentSequence": "FRAGMENTSの表示セット"
} as const;

// Rendered text from src/ja/FounderHeroGallery.tsx; JSX structure stays in the component.
export const heroCopy = {
  "heroPhoto": "Yuto Matsui ポートレート",
  "photoDots": "表示する写真を選択",
  "photoMeta": " / ",
  "photoMeta2": " · "
} as const;

// Rendered text from src/ja/MobileExternalMenu.tsx; JSX structure stays in the component.
export const menuCopy = {
  "label": "外部リンクを表示"
} as const;

// Existing shared/JP product headline fragments; EN headline data remains in en.ts.
export const productCopy = {
  "interactiveLead": "LET EVERYTHING",
  "interactiveEmphasis": "MOVE.",
  "cytellectLead": "Get your microscopy",
  "cytellectEmphasis": "publication-ready.",
  "toposLead": "誰の考えも",
  "toposLeadContinuation": "埋もれない議論を、",
  "toposEmphasis": "すべての教室に。",
  "compassLead": "Don’t Just Learn.",
  "compassEmphasis": "Build What’s Next.",
  "fallbackEnglishLead": "LIFE IN THE",
  "fallbackEnglishEmphasis": "AGE OF AI.",
  "fallbackJapaneseLead": "AI時代を",
  "fallbackJapaneseEmphasis": "どう生きるか。",
  "externalArrow": "↗"
} as const;

// Dynamic control labels; state and element structure remain in the components.
export const controls = {
  "closeEssay": "閉じる",
  "readEssay": "続きを読む",
  "resumePortraits": "写真の自動切替を再開",
  "pausePortraits": "写真の自動切替を一時停止",
  "portraitPlaySymbol": "▶",
  "portraitPauseSymbol": "Ⅱ",
  "cytellectImageAlt": "顕微鏡画像から論文の図へ。顕微鏡と解析結果のビジュアル",
  "resumeProducts": "3Dの自動モーションを再開",
  "pauseProducts": "3Dの自動モーションを一時停止",
  "productPlaySymbol": "▶",
  "productPauseSymbol": "Ⅱ",
  "productPlay": "再生",
  "productPause": "一時停止",
  "filmDescription": "湾曲した写真フィルム。左右キー、ドラッグ、横スクロールで移動",
  "filmArchiveLabel": "FRAGMENTSの写真一覧",
  "filmPrevious": "前の写真",
  "filmResume": "写真フィルムの自動送りを再開",
  "filmPause": "写真フィルムの自動送りを一時停止",
  "filmPlayLabel": "Play",
  "filmPauseLabel": "Pause",
  "filmNext": "次の写真",
  "mobileFilmDescription": "写真フィルム。横ドラッグまたは左右キーで移動",
  "mobileFilmPrevious": "前の写真",
  "mobileFilmResume": "写真フィルムの自動送りを再開",
  "mobileFilmPause": "写真フィルムの自動送りを一時停止",
  "mobileFilmPlayLabel": "Play",
  "mobileFilmPauseLabel": "Pause",
  "mobileFilmNext": "次の写真"
} as const;
