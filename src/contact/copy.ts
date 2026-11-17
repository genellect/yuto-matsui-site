// Contact copy. The page says only what helps someone write the first message:
// what to choose, what to fill in, and what happens after sending.

export const contactMetadataCopy = {
  title: "Contact | Yuto Matsui / 松井優知",
  description: "Yuto Matsui / 松井優知へのお問い合わせ。お仕事のご相談、取材・講演のご依頼、学生の方からのご相談を受け付けています。"
} as const;

export const contactCopy = {
  title: "お問い合わせ",

  entranceTitle: "Yuto Matsuiへのご連絡",
  entering: "Yuto Matsui — 入室しています",
  skip: "スキップ",

  topicLegend: "ご用件",
  topicHints: {
    work: "ご依頼の内容と、希望する時期をお書きください。",
    media: "媒体や催しの名称と、希望する日程をお書きください。",
    student: "相談したいことを、そのままお書きください。"
  },

  name: "お名前",
  email: "メールアドレス",
  affiliation: "会社名・学校名",
  optional: "任意",
  message: "メッセージ",

  handlingNote: "いただいたメッセージは私自身が拝読し、ご記入のメールアドレス宛にお返事いたします。",
  submit: "送信する",
  submitting: "送信しています…",

  successTitle: "メッセージを承りました",
  successBefore: "ご連絡いただき、ありがとうございます。内容を拝読のうえ、",
  successAfter: " 宛にご連絡いたします。",
  receiptTitle: "送信した内容",
  receiptTopic: "ご用件",
  receiptName: "お名前",
  receiptEmail: "メールアドレス",
  receiptAffiliation: "会社名・学校名",
  receiptMessage: "メッセージ",
  home: "トップページへ",

  failure: "申し訳ありません。ただいまメッセージをお送りできませんでした。ご入力いただいた内容はそのまま残っていますので、少し時間をおいて、もう一度お試しください。",
  rateLimited: "申し訳ありません。続けてお送りいただいたため、少し時間をおいてから、もう一度お試しください。ご入力いただいた内容はそのまま残っています。",
  turnstile: "確認が完了しませんでした。お手数ですが、もう一度お試しください。",
  turnstilePending: "送信前の確認を行っています。数秒後にもう一度送信してください。",
  turnstileUnavailable: "送信に必要な確認が完了していません。ご入力いただいた内容はそのまま残っています。",
  validation: "入力内容を確認してください。",
  fallbackBefore: "お急ぎの場合は、",
  fallbackLink: "トップページ",
  fallbackAfter: "に記載のメールアドレスからもご連絡いただけます。"
} as const;
