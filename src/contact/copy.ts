// Contact copy (docs/contact/implementation-plan.md §4.3). Written as a personal,
// courteous welcome: no routing choice, no explanation of internal mechanics.

export const contactMetadataCopy = {
  title: "Contact | Yuto Matsui / 松井優知",
  description:
    "生命科学研究とAIネイティブ開発に取り組むYuto Matsui / 松井優知へのご連絡はこちらから。共同研究や開発のご相談、講演のご依頼、意見交換など、お気軽にお寄せください。"
} as const;

export const contactCopy = {
  kicker: "CONTACT",
  title: "お問い合わせ",
  intro: "研究・開発・教育に関するご相談やご依頼を承っています。",
  intro2: "学生・教職員・研究者の方、団体・企業の方など、さまざまな方とのご縁を歓迎しています。",

  entranceTitle: "Yuto Matsuiへのご連絡",
  entering: "Yuto Matsui — 入室しています",
  skip: "スキップ",

  audienceKicker: "WHO THIS IS FOR",
  audienceTitle: "Yuto Matsuiへのご連絡",
  audience: [
    { audience: "学生の方", description: "進路や挑戦に関する相談、意見交換、コミュニティへの参加" },
    { audience: "企業の方", description: "共同開発、受託開発、プロジェクトのご依頼、講演" },
    { audience: "教職員の方", description: "講演、教育連携、授業・教育活動に関するご相談" },
    { audience: "研究者の方", description: "共同研究のご相談、学会参加" }
  ],

  identityKicker: "ABOUT YOU",
  identityTitle: "お名前と返信先",
  name: "お名前",
  affiliation: "所属",
  affiliationHelper: "学生：学校名・学部・学年／企業・団体：名称・役職／教職員・研究者：所属機関・役職をご記入ください。",
  email: "メールアドレス",
  required: "必須",
  optional: "任意",
  valid: "入力内容は有効です",

  messageKicker: "YOUR MESSAGE",
  messageTitle: "メッセージ",
  messageHelper: "ご質問、ご相談、ご依頼、ご提案など、内容を自由にご記入ください。",
  messageLabel: "メッセージ 必須",

  submitLabel: "送信",
  handlingNote: "いただいたメッセージは私自身が拝読し、ご記入のメールアドレス宛にお返事いたします。",
  submit: "メッセージを送信",
  submitting: "送信しています…",

  successKicker: "MESSAGE RECEIVED",
  successTitle: "メッセージを承りました",
  successBefore: "ご連絡いただき、ありがとうございます。内容を拝読のうえ、",
  successAfter: " 宛にご連絡いたします。お返事まで少しお時間をいただく場合がございますが、どうぞよろしくお願いいたします。",
  home: "トップページへ",

  failure: "申し訳ありません。ただいまメッセージをお送りできませんでした。ご入力いただいた内容はそのまま残っていますので、少し時間をおいて、もう一度お試しください。",
  rateLimited: "申し訳ありません。続けてお送りいただいたため、少し時間をおいてから、もう一度お試しください。ご入力いただいた内容はそのまま残っています。",
  turnstile: "確認が完了しませんでした。お手数ですが、もう一度お試しください。",
  fallbackBefore: "お急ぎの場合は、",
  fallbackLink: "トップページ",
  fallbackAfter: "に記載のメールアドレスからもご連絡いただけます。"
} as const;
