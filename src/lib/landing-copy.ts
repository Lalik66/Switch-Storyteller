/**
 * Bilingual marketing copy for the landing page and site footer.
 * Keys mirror `AppLang` ("en" | "az").
 */

export type LandingLang = "en" | "az";

export type WorldMarketingKey =
  | "moonlit-forest"
  | "clockwork"
  | "sunken"
  | "dragons-spine"
  | "stardust"
  | "hollow-meadows";

export type LandingCopy = {
  manuscript: {
    sealText: string;
    folioMeta: string;
    liveBadge: string;
    p1Before: string;
    p1Highlight: string;
    p1After: string;
    quote: string;
    p1End: string;
    question: string;
    choices: [string, string, string];
    footerLeft: string;
    footerRight: string;
  };
  ticker: string[];
  loop: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    steps: { n: string; title: string; body: string }[];
  };
  worlds: {
    eyebrow: string;
    title1: string;
    titleAccent: string;
    title2: string;
    blurb: string;
    indexLabel: string;
    tiles: Record<WorldMarketingKey, { name: string; tag: string }>;
  };
  sample: {
    eyebrow: string;
    title1: string;
    titleAccent: string;
    body: string;
    stats: [string, string][];
    cardTitle: string;
    cardMeta: string;
    pageCounter: string;
    p1: string;
    p1Em: string;
    p1b: string;
    p2Before: string;
    p2Highlight: string;
    p2After: string;
    question: string;
    choices: [string, string, string];
    customHint: string;
    moderated: string;
  };
  parents: {
    eyebrow: string;
    title1: string;
    titleAccent: string;
    intro: string;
    link: string;
    pillars: { title: string; body: string }[];
  };
  pricing: {
    eyebrow: string;
    title1: string;
    titleAccent: string;
    title2: string;
    badge: string;
    footnote: string;
    tiers: {
      name: string;
      price: string;
      sub: string;
      desc: string;
      features: string[];
      cta: string;
      featured: boolean;
    }[];
  };
  finalCta: {
    eyebrow: string;
    title1: string;
    titleAccent: string;
    body: string;
    cta1: string;
    cta2: string;
  };
  footer: {
    blurb: string;
    tagline: string;
    col1Title: string;
    col2Title: string;
    col3Title: string;
    links1: [string, string][];
    links2: [string, string][];
    links3: [string, string][];
    copyright: string;
    finePrint: string;
  };
  chrome: {
    skipToContent: string;
    brandEyebrow: string;
    brandBefore: string;
    brandAccent: string;
    ariaHome: string;
  };
};

export const LANDING_COPY: Record<LandingLang, LandingCopy> = {
  en: {
    manuscript: {
      sealText: "· Chapter One · The door is open · Chapter One ·",
      folioMeta: "Folio I · page 03",
      liveBadge: "× live excerpt",
      p1Before: "Maren pressed her palm against the glowing door. The",
      p1Highlight: "moonlit forest",
      p1After:
        "hummed behind it, full of things that had waited a very long time to meet her.",
      quote: "You're late,",
      p1End: "whispered a small voice near her boots.",
      question: "What will Maren do?",
      choices: [
        "Kneel and whisper back",
        "Step through the door",
        "Ask its name",
      ],
      footerLeft: "or — write your own",
      footerRight: "Safely reviewed",
    },
    ticker: [
      "— she brought a map of her own",
      "— the dragon only wanted company",
      "— the key was made of starlight",
      "— the island whispered her name",
      "— a library at the bottom of the sea",
      "— the clock ran on honey",
      "— grandmother's attic had a door",
      "— a hero in hand-knit armor",
    ],
    loop: {
      eyebrow: "§ I · The loop",
      title: "Three quiet steps.",
      titleAccent: "One unforgettable tale.",
      steps: [
        {
          n: "I",
          title: "Choose a hero",
          body: "Three gentle questions — a name, a heart, a wish. Your child's imagination sets the compass.",
        },
        {
          n: "II",
          title: "Shape the world",
          body: "Pick a hand-illustrated world: a moonlit forest, a clockwork city, the bottom of a glassy sea.",
        },
        {
          n: "III",
          title: "Live the adventure",
          body: "Each page arrives like a letter. Three choices — or write your own. When the tale ends, we bind it into a real book.",
        },
      ],
    },
    worlds: {
      eyebrow: "§ II · The atlas",
      title1: "Six worlds,",
      titleAccent: "hand-drawn",
      title2: "and waiting.",
      blurb:
        "Every world is illustrated in-house by real artists. Your child chooses where to land — the quill does the rest.",
      indexLabel: "No.",
      tiles: {
        "moonlit-forest": {
          name: "The Moonlit Forest",
          tag: "Whisper-magic",
        },
        clockwork: { name: "The Clockwork City", tag: "Brass & steam" },
        sunken: { name: "The Sunken Kingdom", tag: "Salt & silver" },
        "dragons-spine": {
          name: "The Dragon's Spine",
          tag: "Fire-stone peaks",
        },
        stardust: { name: "The Stardust Bazaar", tag: "Night market" },
        "hollow-meadows": {
          name: "The Hollow Meadows",
          tag: "Thimble folk",
        },
      },
    },
    sample: {
      eyebrow: "§ III · A page from the tale",
      title1: "Gentle words,",
      titleAccent: "great choices.",
      body: "Each page is written at a 4th–5th grade reading level, screened by an independent moderator, and illustrated selectively so the picture follows the words — not the other way around.",
      stats: [
        ["~150", "words per page"],
        ["8–12", "pages per tale"],
        ["4", "safety layers"],
        ["0", "ads, ever"],
      ],
      cardTitle: "Maren & the Moonlit Door",
      cardMeta: "Folio I · chapter 02",
      pageCounter: "page 5 / 10",
      p1: "The door was warm to the touch — warmer than a mitten fresh from the fire. It smelled faintly of cinnamon and old rain. Maren cupped her hands around the",
      p1Em: "handle",
      p1b: "and found it was shaped, strangely, like a small sleeping fox. She had a feeling the fox had been waiting a long time to wake up.",
      p2Before: "Behind her, the",
      p2Highlight: "moonlit forest",
      p2After:
        "held its breath. Ahead, the door hummed a single, patient note. Maren thought it sounded rather like a question.",
      question: "What does Maren do next?",
      choices: [
        "Wake the fox gently",
        "Listen to the door",
        "Step back and wait",
      ],
      customHint: "Or write your own — we'll follow your lead",
      moderated: "moderated ✓",
    },
    parents: {
      eyebrow: "§ IV · For the grown-ups",
      title1: "Built for",
      titleAccent: "parent trust.",
      intro:
        "We built the Forge for our own kids first. That meant starting with the hardest question: what would make a parent trust an AI with their child's inner world?",
      link: "See our safety commitments",
      pillars: [
        {
          title: "Four layers of safety",
          body: "Pre-prompt screening, G-rated LLM guardrails, post-generation review, and a human moderation desk — every word your child sees passes all four.",
        },
        {
          title: "COPPA by design",
          body: "No ad tracking, no data sale, parent-verified accounts, instant export or deletion on request. Children are not the product.",
        },
        {
          title: "Read every word",
          body: "A weekly parchment-paper digest arrives in your inbox. Every tale your child writes is readable, verbatim — no summaries.",
        },
        {
          title: "You set the knobs",
          body: "Daily time limits, content strictness, community publishing, remix permissions. Your child's profile, your rules.",
        },
      ],
    },
    pricing: {
      eyebrow: "§ V · The terms",
      title1: "A fair ledger for",
      titleAccent: "extraordinary",
      title2: "tales.",
      badge: "Most chosen",
      footnote:
        "Printed books sold separately via our partner bindery · shipped worldwide.",
      tiers: [
        {
          name: "Apprentice",
          price: "Free",
          sub: "Forever",
          desc: "One tale a week. All worlds. Full parent dashboard.",
          features: [
            "1 story per week",
            "All 6 worlds",
            "PDF export",
            "Parent digest",
          ],
          cta: "Begin free",
          featured: false,
        },
        {
          name: "Scribe",
          price: "$7.99",
          sub: "per month",
          desc: "Unlimited tales, audio narration, illustrated pages, remixing.",
          features: [
            "Unlimited stories",
            "Illustrated pages",
            "Audio narration",
            "Character vault",
            "Community remixing",
          ],
          cta: "Become a Scribe",
          featured: true,
        },
        {
          name: "Guild",
          price: "$19.99",
          sub: "per month",
          desc: "Up to four child profiles. Everything in Scribe, for the whole family.",
          features: [
            "4 child profiles",
            "Everything in Scribe",
            "Priority moderation",
            "Discount on printed books",
          ],
          cta: "Gather the Guild",
          featured: false,
        },
      ],
    },
    finalCta: {
      eyebrow: "Your tale awaits",
      title1: "Light the lantern.",
      titleAccent: "Open the door.",
      body: 'Free forever for your first tale. No credit card. No ads. No tracking. Just a small voice near your child\'s boots, whispering "you\'re late."',
      cta1: "Begin a tale",
      cta2: "Parent walkthrough",
    },
    footer: {
      blurb:
        "A small studio building a safer, more imaginative internet for young readers. COPPA-compliant. Moderated by humans. Loved by families.",
      tagline: "— Forged in warm ink —",
      col1Title: "The Tale",
      col2Title: "For Grown-ups",
      col3Title: "The Scribes",
      links1: [
        ["How it works", "#loop"],
        ["Worlds", "#worlds"],
        ["Sample page", "#sample"],
      ],
      links2: [
        ["Parents", "#parents"],
        ["Safety & COPPA", "#safety"],
        ["Pricing", "#pricing"],
      ],
      links3: [
        ["Contact", "#"],
        ["Press kit", "#"],
        ["Educators", "#"],
      ],
      copyright: "The Hero's Forge. All tales reserved.",
      finePrint: "Bound in parchment · Printed with ember",
    },
    chrome: {
      skipToContent: "Skip to main content",
      brandEyebrow: "Est. MMXXVI",
      brandBefore: "The Hero's",
      brandAccent: "Forge",
      ariaHome: "The Hero's Forge — home",
    },
  },
  az: {
    manuscript: {
      sealText: "· Fəsil I · Qapı açıqdır · Fəsil I ·",
      folioMeta: "Folio I · səh. 03",
      liveBadge: "× canlı parça",
      p1Before: "Maren parlaq qapıya əlini sürtdü.",
      p1Highlight: "Ay işığı meşəsi",
      p1After:
        "onun arxasında uğuldayırdı — onu çoxdan gözləyən şeylərlə dolu idi.",
      quote: "Gecikdin,",
      p1End: "çəkmələrinin yanında kiçik bir səs pıçıldadı.",
      question: "Maren nə edəcək?",
      choices: [
        "Diz çöküb pıçıldamaq",
        "Qapıdan keçmək",
        "Adını sormaq",
      ],
      footerLeft: "və ya — özün yaz",
      footerRight: "Təhlükəsiz yoxlanılıb",
    },
    ticker: [
      "— öz xəritəsini özü gətirdi",
      "— əjdaha yalnız dost axtarırdı",
      "— açar ulduz işığından düzəldi",
      "— ada onun adını pıçıldadı",
      "— dənizin dibində kitabxana",
      "— saat bal ilə işləyirdi",
      "— nənənin çardaqında qapı vardı",
      "— qəhrəman əl örgüsü zirehdə",
    ],
    loop: {
      eyebrow: "§ I · Döngə",
      title: "Üç asan addım.",
      titleAccent: "Bir yaddaqalan nağıl.",
      steps: [
        {
          n: "I",
          title: "Qəhrəman seç",
          body: "Üç yumşaq sual — ad, ürək, arzu. Uşağın təxəyyülü kompas göstərir.",
        },
        {
          n: "II",
          title: "Dünyanı formalaşdır",
          body: "Əl ilə çəkilmiş dünya seç: ay işığı meşəsi, cər saat şəhəri, şüşə dənizin dibi.",
        },
        {
          n: "III",
          title: "Macəranı yaşa",
          body: "Hər səhifə məktub kimi gəlir. Üç seçim — və ya özün yaz. Nağıl bitəndə onu əsl kitaba bağlayırıq.",
        },
      ],
    },
    worlds: {
      eyebrow: "§ II · Atlas",
      title1: "Altı dünya,",
      titleAccent: "əl ilə çəkilmiş",
      title2: "və gözləyir.",
      blurb:
        "Hər dünya studiyamızda həqiqi rəssamlar tərəfindən təsvir olunub. Uşağın haraya enəcəyini o seçir — qələm qalanını yazır.",
      indexLabel: "№",
      tiles: {
        "moonlit-forest": {
          name: "Ay işığı meşəsi",
          tag: "Pıçıldayan sehr",
        },
        clockwork: { name: "Cər şəhər", tag: "Ənbər və buxar" },
        sunken: { name: "Batıq krallıq", tag: "Duz və gümüş" },
        "dragons-spine": {
          name: "Əjdahanın beli",
          tag: "Odlu daş zirvələr",
        },
        stardust: { name: "Ulduz tozu bazarı", tag: "Gecə yarmarkası" },
        "hollow-meadows": {
          name: "Boş çəmənlər",
          tag: "Barmaq papaqlı xalq",
        },
      },
    },
    sample: {
      eyebrow: "§ III · Nağıldan səhifə",
      title1: "Yumşaq sözlər,",
      titleAccent: "böyük seçimlər.",
      body: "Hər səhifə 4–5-ci sinif oxu səviyyəsində yazılır, müstəqil moderator tərəfindən yoxlanır və seçilmiş təsvirlərlə müşayiət olunur — söz rəsmə yox, təsvir sözə uyğun gəlir.",
      stats: [
        ["~150", "söz / səhifə"],
        ["8–12", "səhifə / nağıl"],
        ["4", "təhlükəsizlik qatı"],
        ["0", "reklam, heç vaxt"],
      ],
      cardTitle: "Maren və ay işığı qapısı",
      cardMeta: "Folio I · fəsil 02",
      pageCounter: "səh. 5 / 10",
      p1: "Qapı toxunanda isti idi — ocaqdan çıxan əlcəkdən də isti. Darçın və köhnə yağış qoxusu gəlirdi. Maren əllərini",
      p1Em: "tutacağın",
      p1b: "ətrafında bükəndə gördü ki, qəribə şəkildə, kiçik yatan tülkü formasındadır. Tülkünün oyaq olmağı üçün çox gözlədiyini hiss etdi.",
      p2Before: "Arxasında",
      p2Highlight: "ay işığı meşəsi",
      p2After:
        "nəfəsini tutmuşdu. Qabaqda isə qapı tək, səbirli bir not uğuldayırdı. Marenə elə gəlirdi ki, bu bir sual səsidir.",
      question: "Maren indi nə edir?",
      choices: [
        "Tülkünü yumşaq oyadır",
        "Qapını dinləyir",
        "Geri çəkilib gözləyir",
      ],
      customHint: "Özün yaz — səni izləyəcəyik",
      moderated: "yoxlanıldı ✓",
    },
    parents: {
      eyebrow: "§ IV · Böyüklər üçün",
      title1: "Valideyn",
      titleAccent: "etibarın üçün.",
      intro:
        "Döyməxananı əvvəl öz uşaqlarımız üçün tikdik. Ən çətin sualla başladıq: valideyn süni intellektə uşağının daxili dünyasını nəyə etibar edər?",
      link: "Təhlükəsizlik öhdəliklərimiz",
      pillars: [
        {
          title: "Dörd təhlükəsizlik qatı",
          body: "Əvvəlcədən süzgəc, uşaq dostu LLM limitləri, generasiyadan sonra yoxlama və insan moderator masası — uşağın gördüyü hər söz bu dördündən keçir.",
        },
        {
          title: "COPPA prinsipi ilə",
          body: "Reklam izləmə yoxdur, məlumat satışı yoxdur, valideyn təsdiqli hesablar, istənilən vaxt ixrac və ya silmə. Uşaqlar məhsul deyil.",
        },
        {
          title: "Hər sözü oxu",
          body: "Həftəlik parşömen özet e-poçtuna gəlir. Uşağın yazdığı hər nağıl olduğu kimi oxuna bilər — qısa xülasə yoxdur.",
        },
        {
          title: "Sən qurursan",
          body: "Günlük vaxt limiti, məzmun sərtliyi, icma nəşri, remiks icazələri. Uşağın profili, sənin qaydaların.",
        },
      ],
    },
    pricing: {
      eyebrow: "§ V · Şərtlər",
      title1: "Ədalətli hesab",
      titleAccent: "sıradan çıxan",
      title2: "nağıllar üçün.",
      badge: "Ən çox seçilən",
      footnote:
        "Çap kitabları ayrıca tərəfdaş cildxanada · dünya üzrə çatdırılma.",
      tiers: [
        {
          name: "Şagird",
          price: "Pulsuz",
          sub: "Həmişəlik",
          desc: "Həftədə bir nağıl. Bütün dünyalar. Tam valideyn paneli.",
          features: [
            "Həftədə 1 nağıl",
            "6 dünya",
            "PDF ixrac",
            "Valideyn xülasəsi",
          ],
          cta: "Pulsuz başla",
          featured: false,
        },
        {
          name: "Yazıçı",
          price: "$7.99",
          sub: "aylıq",
          desc: "Limitsiz nağıl, audio oxu, təsvirli səhifələr, remiks.",
          features: [
            "Limitsiz nağıl",
            "Təsvirli səhifələr",
            "Audio oxu",
            "Personaj anbarı",
            "İcma remiksi",
          ],
          cta: "Yazıçı ol",
          featured: true,
        },
        {
          name: "Gilda",
          price: "$19.99",
          sub: "aylıq",
          desc: "Dörd uşaq profilinə qədər. Scribe-dakı hər şey, bütün ailə üçün.",
          features: [
            "4 uşaq profili",
            "Scribe-dakı hər şey",
            "Prioritet moderatorluq",
            "Çap kitabında endirim",
          ],
          cta: "Gildanı topla",
          featured: false,
        },
      ],
    },
    finalCta: {
      eyebrow: "Nağıl gözləyir",
      title1: "Fənəri yandır.",
      titleAccent: "Qapını aç.",
      body: "İlk nağılın üçün həmişəlik pulsuz. Kredit kartı yoxdur. Reklam yoxdur. İzləmə yoxdur. Yalnız uşağının çəkmələrinin yanında pıçıldayan kiçik səs: «Gecikdin.»",
      cta1: "Nağıla başla",
      cta2: "Valideyn turu",
    },
    footer: {
      blurb:
        "Gənc oxucular üçün daha təhlükəsiz və təxəyyüllü internet tikən kiçik studiya. COPPA uyğun. İnsan moderatorlu. Ailələrin sevimlisi.",
      tagline: "— İsti mürəkkəbdə döyülür —",
      col1Title: "Nağıl",
      col2Title: "Böyüklər üçün",
      col3Title: "Yazıçılar",
      links1: [
        ["Necə işləyir", "#loop"],
        ["Dünyalar", "#worlds"],
        ["Nümunə səhifə", "#sample"],
      ],
      links2: [
        ["Valideynlər", "#parents"],
        ["Təhlükəsizlik və COPPA", "#safety"],
        ["Qiymətlər", "#pricing"],
      ],
      links3: [
        ["Əlaqə", "#"],
        ["Mətbuat dəsti", "#"],
        ["Müəllimlər", "#"],
      ],
      copyright: "Qəhrəmanın Döyməxanası. Bütün nağıllar saxlanılır.",
      finePrint: "Parşömenə bağlanıb · Kölgədə çap olunub",
    },
    chrome: {
      skipToContent: "Əsas məzmuna keç",
      brandEyebrow: "Est. MMXXVI",
      brandBefore: "Qəhrəmanın",
      brandAccent: "Döyməxanası",
      ariaHome: "Qəhrəmanın Döyməxanası — ana səhifə",
    },
  },
};

export const WORLD_MARKETING_ORDER: WorldMarketingKey[] = [
  "moonlit-forest",
  "clockwork",
  "sunken",
  "dragons-spine",
  "stardust",
  "hollow-meadows",
];
