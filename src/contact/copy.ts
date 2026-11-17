// Contact copy. The page says only what helps someone write the first message:
// what to choose, what to fill in, and what happens after sending.

export const contactMetadataCopy = {
  title: "Contact | Yuto Matsui / 松井優知",
  description: "Yuto Matsui / 松井優知へのお問い合わせ。お仕事のご依頼と、学生からの相談を受け付けています。"
} as const;

export const contactCopy = {
  title: "お問い合わせ",

  skip: "スキップ",

  topicLegend: "お問い合わせの種類",
  grade: "学年",
  gradePlaceholder: "選択してください",
  name: "お名前",
  email: "メールアドレス",

  submit: "送信する",
  submitting: "送信しています…",

  successTitle: "メッセージを承りました",
  successBefore: "ご連絡いただき、ありがとうございます。内容を拝読のうえ、",
  successAfter: " 宛にご連絡いたします。",
  receiptTitle: "送信した内容",
  receiptTopic: "お問い合わせの種類",
  receiptName: "お名前",
  receiptEmail: "メールアドレス",
  receiptGrade: "学年",
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
