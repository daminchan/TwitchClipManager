/**
 * アプリケーション全体で使用する定数を一元管理
 * 保守性・可読性向上のため、文字列やマジックナンバーをここに集約
 */

// Twitch API
export const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';
export const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';

/**
 * Twitch CDN URL定義
 * プロフィール画像やデフォルトアバターのURL
 */
export const TWITCH_URLS = {
  // プロフィール画像URL（{username}を置換して使用）
  PROFILE_IMAGE: (username: string) =>
    `https://static-cdn.jtvnw.net/jtv_user_pictures/${username}-profile_image-70x70.png`,
  // デフォルトアバター（プロフィール画像取得失敗時のフォールバック）
  DEFAULT_AVATAR:
    'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-70x70.png',
} as const;

// クリップ設定
export const DEFAULT_CLIPS_LIMIT = 20;

/**
 * クリップフィルターの設定
 * 直近2日間の各配信者上位5件を取得
 *
 * 理由: 7日間だと最初に伸びた動画が居座り、新しいクリップが埋もれてしまう
 * 2日間にすることで常に新鮮なクリップが表示される
 */
export const CLIP_FILTERS = {
  RECENT: {
    days: 2,
    limit: 5, // 各配信者5件
    label: '直近48時間',
    icon: '🔥',
    description: '各配信者の直近48時間のクリップ（各5件）',
  },
} as const;

/**
 * アプリケーション基本設定
 */
export const APP_CONFIG = {
  name: 'ついっぷ',
  fullName: 'Twitch Clip Viewer',
  description: 'お気に入りの配信者のクリップを見つけよう',
  version: '1.0.0',
  url: 'https://twipu.vercel.app',
  seo: {
    title: 'ついっぷ - Twitchクリップビューアー | VTuber・切り抜き',
    description: 'Twitchの人気クリップをまとめて視聴できるビューアー。VTuberや配信者の切り抜き・クリップをお気に入り登録して、いつでも楽しめます。ゲーム配信の面白い瞬間を見逃さない！',
    keywords: ['twitch', 'vtuber', '切り抜き', 'クリップ', 'ゲーム配信', 'ついっぷ', '配信者', 'ストリーマー'],
  },
} as const;

/**
 * ルート定義
 * 使用例: router.push(ROUTES.DASHBOARD)
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/', // レガシー: HOMEと同じ（/dashboardは/にリダイレクトされる）
  FAVORITES: '/favorites',
  FAVORITES_CLIPS: '/favorites-clips',
  SETTINGS: '/settings',
} as const;

/**
 * API エンドポイント定義
 */
export const API_ENDPOINTS = {
  FAVORITES: '/api/favorites',
  CLIPS: {
    FAVORITES: '/api/clips/favorites',
    POPULAR: '/api/clips/popular',
  },
  TWITCH: {
    STREAMERS: '/api/twitch/search',
    CLIPS: '/api/twitch/clips',
    LIVE_STATUS: '/api/twitch/live-status',
  },
} as const;

/**
 * UI ラベル・テキスト定義
 */
export const LABELS = {
  // セクションタイトル
  SECTIONS: {
    CLIP_LIST: 'クリップ一覧',
    SEARCH_STREAMERS: '配信者を検索して追加',
    GAME_BASED_ADD: '好きなゲームから配信者を追加',
    FAVORITE_STREAMERS: 'お気に入り配信者',
    FAVORITE_CLIPS: 'お気に入りクリップ',
    ACCOUNT_INFO: 'アカウント情報',
    DISPLAY_NAME_CHANGE: '表示名の変更',
    DANGEROUS_ACTIONS: '危険な操作',
  },

  // ボタン
  BUTTONS: {
    LOGIN: 'ログイン',
    SIGNUP: '新規登録',
    LOGOUT: 'ログアウト',
    SAVE: '保存',
    CANCEL: 'キャンセル',
    DELETE: '削除',
    UPDATE: '更新',
    UPDATE_DISPLAY_NAME: '表示名を更新',
    DELETE_ACCOUNT: 'アカウントを削除',
    DELETE_PERMANENTLY: '完全に削除',
    LIKE: 'いいね',
    LIKED: 'いいね済み',
    CLOSE: '閉じる',
    // ローディング状態
    SAVING: '保存中...',
    DELETING: '削除中...',
    UPDATING: '更新中...',
    LOADING: '読み込み中...',
    SUBMITTING: '送信中...',
    LOGGING_IN: 'ログイン中...',
    SIGNING_UP: '登録中...',
  },

  // フォーム
  FORM: {
    EMAIL: 'メールアドレス',
    PASSWORD: 'パスワード',
    NAME: '名前',
    DISPLAY_NAME: '表示名',
  },

  // メッセージ
  MESSAGES: {
    LOADING: '読み込み中...',
    REDIRECTING: 'リダイレクト中...',
    NO_CLIPS: 'クリップが見つかりませんでした',
    NO_FAVORITE_CLIPS: 'まだお気に入りクリップがありません',
    NO_FAVORITE_CLIPS_DESC: 'ダッシュボードでクリップにいいねしてみましょう',
    NO_FAVORITE_STREAMERS: 'お気に入り配信者を追加しよう',
    NO_FAVORITE_STREAMERS_DESC: '好きなゲームから配信者を見つけて、お気に入りのクリップを楽しもう',
    ADD_FAVORITE_STREAMERS: '配信者を追加',
    // お気に入りページ
    FAVORITES_PAGE_DESC: 'アイコンをドラッグしてフォルダに追加できます。フォルダはクリップ一覧でフィルターとして使用できます。',
    // ローディング
    LOADING_STREAMERS: 'おすすめ配信者を取得中...',
    LOADING_GAMES: '人気ゲームを読み込み中...',
    LOADING_CLIPS: 'クリップを読み込み中...',
    ADDING_FAVORITES: 'お気に入りに追加中...',
  },

  // エラーメッセージ
  ERRORS: {
    // 認証
    AUTH_REQUIRED: '認証が必要です',
    LOGIN_FAILED: 'メールアドレスまたはパスワードが正しくありません',
    REQUIRED_EMAIL_PASSWORD: 'メールアドレスとパスワードを入力してください',
    PASSWORD_TOO_SHORT: 'パスワードは6文字以上で入力してください',
    NAME_TOO_LONG: '名前は50文字以内で入力してください',
    SIGNUP_FAILED: '登録に失敗しました',
    GOOGLE_LOGIN_FAILED: 'Googleログインに失敗しました',
    // フォルダ
    FOLDER_NOT_FOUND: 'フォルダが見つかりません',
    FOLDER_CREATE_FAILED: 'フォルダの作成に失敗しました',
    FOLDER_UPDATE_FAILED: 'フォルダの更新に失敗しました',
    FOLDER_DELETE_FAILED: 'フォルダの削除に失敗しました',
    // フォルダ内配信者
    STREAMER_ALREADY_IN_FOLDER: 'この配信者は既にこのフォルダに追加されています',
    STREAMER_ADD_TO_FOLDER_FAILED: 'フォルダへの追加に失敗しました。しばらくしてから再度お試しください',
    STREAMER_REMOVE_FROM_FOLDER_FAILED: 'フォルダからの削除に失敗しました',
    // お気に入り
    FAVORITE_ALREADY_EXISTS: 'この配信者は既にお気に入りに追加されています',
    FAVORITE_ADD_FAILED: 'お気に入りへの追加に失敗しました',
    FAVORITE_REMOVE_FAILED: 'お気に入りからの削除に失敗しました',
    // ゲーム・配信者取得
    GAME_FETCH_FAILED: 'ゲーム一覧の取得に失敗しました',
    STREAMER_FETCH_FAILED: 'おすすめ配信者の取得に失敗しました',
    // クリップ
    CLIPS_FETCH_FAILED: 'クリップの取得に失敗しました',
    CLIPS_DATA_EMPTY: 'データが取得できませんでした',
    // 汎用
    UNKNOWN_ERROR: '予期しないエラーが発生しました',
    NETWORK_ERROR: '通信エラーが発生しました。接続を確認してください',
    PROCESSING: '処理中です。しばらくお待ちください',
  },

  // ソートオプション
  SORT: {
    VIEWS: '再生数',
    DATE_DESC: '新しい順',
    DATE_ASC: '古い順',
  },

  // クリップ関連
  CLIPS: {
    VIEW_ON_TWITCH: 'Twitchで見る',
    PLAY_CLIP: 'クリップを再生',
    CLIP_UNIT: 'クリップ',
    FOLDER_LABEL: 'フォルダ:',
    VIEWS_SUFFIX: 'views',
  },

  // 登録促進
  REGISTRATION: {
    TITLE: 'もっと楽しもう！',
    DESCRIPTION: 'アカウント登録すると、お気に入りの配信者を保存したり、クリップにいいねできます。',
    CTA: '無料で登録',
    LIVE_HINT: 'お気に入り登録すると、配信中の配信者が表示されます！',
    LINK_COPIED: 'リンクをコピーしました',
  },

  // プレースホルダー
  PLACEHOLDERS: {
    SEARCH_CLIPS: 'クリップを検索...',
    SEARCH_GAMES: 'ゲームを検索...',
    EMAIL: 'your@email.com',
    PASSWORD: '6文字以上',
    NAME: 'あなたの名前',
  },

  // オンボーディング
  ONBOARDING: {
    // 認証ステップ
    AUTH: {
      TITLE_SIGNUP: 'アカウント作成',
      TITLE_LOGIN: 'ログイン',
      SUBTITLE_SIGNUP: 'お気に入りの配信者を見つけよう',
      SUBTITLE_LOGIN: 'あなたのお気に入りクリップが待っています',
      GOOGLE_SIGNIN: 'Google でログイン',
      OR: 'または',
      TAB_SIGNUP: '新規登録',
      TAB_LOGIN: 'ログイン',
      ALREADY_HAVE_ACCOUNT: 'すでにアカウントをお持ちですか？',
      DONT_HAVE_ACCOUNT: 'アカウントをお持ちでないですか？',
    },

    // ゲーム選択ステップ
    GAME: {
      TITLE: '好きなゲームを選択',
      SUBTITLE: 'あなたが興味のあるゲームを1つ選んでください',
      LOADING: '人気ゲームを読み込み中...',
      BUTTON_NEXT: '次へ',
      BUTTON_BACK: '戻る',
      SELECT_GAME: 'ゲームを選択してください',
    },

    // 配信者選択ステップ
    STREAMER: {
      TITLE: 'おすすめ配信者',
      SUBTITLE_PREFIX: '「',
      SUBTITLE_SUFFIX: '」のおすすめ配信者（直近3日間のクリップ再生数順）',
      LOADING: 'おすすめ配信者を取得中...',
      BUTTON_NEXT: 'お気に入りに追加',
      BUTTON_BACK: '戻る',
      SELECT_STREAMER: '少なくとも1人の配信者を選択してください',
      CLIP_VIEWS: 'クリップ再生数',
      CLIPS_COUNT: 'クリップ',
    },

    // 完了ステップ
    COMPLETION: {
      TITLE: 'セットアップ完了！',
      SUBTITLE_PREFIX: '',
      SUBTITLE_SUFFIX: '人の配信者をお気に入りに追加しました',
      DESCRIPTION: 'さっそくお気に入り配信者のクリップを楽しみましょう',
      BUTTON_START: 'クリップを見る',
    },

    // ローディング
    LOADING: {
      ADDING_FAVORITES: 'お気に入りに追加中...',
    },

    // ステップインジケーター
    STEPS: {
      GAME_SELECTION: 'ゲーム選択',
      STREAMER_SELECTION: '配信者選択',
    },
  },
} as const;

/**
 * バリデーション定数
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /\S+@\S+\.\S+/,
} as const;

/**
 * 時間設定
 */
export const TIMING = {
  TOAST_DURATION: 3000, // 3秒
  REDIRECT_DELAY: 1500, // 1.5秒
} as const;

/**
 * アニメーション設定
 */
export const ANIMATION = {
  CARD_DURATION: 300,         // カードアニメーション時間（ms）
  CARD_DELAY_STEP: 50,        // カード間の遅延（ms）
  SIDEBAR_DURATION: 300,      // サイドバー開閉時間（ms）
  SIDEBAR_CONTENT_DELAY: 300, // サイドバー開閉後の待機時間（ms）
  // いいねボタンアニメーション
  LIKE_HEART_DURATION: 1000,  // 浮遊ハートアニメーション時間（ms）
  LIKE_HEART_OFFSET: 40,      // 浮遊ハートのランダム横ずれ範囲（px）
  LIKE_DEBOUNCE: 500,         // いいねリクエストのDebounce時間（ms）
  // クリップグリッド関連
  GRID_SKELETON_COUNT: 10,    // ローディング時のスケルトン表示数
  GRID_INITIAL_DELAY: 350,    // 初回アニメーション完了待機時間（ms）
  LOAD_MORE_DELAY: 300,       // 追加読み込み時の遅延（ms）
} as const;

/**
 * 無限スクロール設定
 */
export const INFINITE_SCROLL = {
  ROOT_MARGIN: '100px',       // 発火位置（ビューポートからの距離）
  THRESHOLD: 0,               // 交差割合
} as const;

/**
 * ゲーム選択・配信者推薦設定
 */
export const RECOMMENDATION_LIMITS = {
  // オンボーディング用
  ONBOARDING: {
    MAX_GAMES: 1,           // ゲーム選択数
    STREAMER_COUNT: 6,      // 表示配信者数
  },
  // サイドバー「ゲームから追加」機能用
  GAME_BASED_ADD: {
    MAX_GAMES: 3,           // 最大ゲーム選択数
    STREAMER_COUNT: 15,     // 表示配信者数
  },
} as const;

/**
 * Twitch API クエリ設定
 */
export const TWITCH_API_CONFIG = {
  // クリップ取得件数
  CLIPS_PER_QUERY: 100,     // 1回のAPIリクエストで取得するクリップ数
  // おすすめ配信者の取得期間
  RECOMMENDATION_DAYS: 3,    // 直近N日間のクリップを取得
  // 代表クリップ数
  TOP_CLIPS_COUNT: 3,        // 配信者ごとに表示する代表クリップ数
} as const;

/**
 * React Query キャッシュ設定（ミリ秒）
 */
export const CACHE_TIME = {
  // ゲーム情報
  GAMES: 10 * 60 * 1000,           // 10分間（頻繁に変わらない）
  // 配信者情報
  STREAMERS: 5 * 60 * 1000,        // 5分間（中程度の更新頻度）
  // ライブステータス
  LIVE_STATUS: 2 * 60 * 1000,      // 2分間（頻繁に更新）
  // 人気クリップ
  POPULAR_CLIPS: 10 * 60 * 1000,   // 10分間
  // デフォルト設定（グローバル）
  DEFAULT_STALE_TIME: 5 * 60 * 1000,   // 5分間（デフォルトのstaleTime）
  DEFAULT_GC_TIME: 10 * 60 * 1000,     // 10分間（デフォルトのgcTime）
} as const;

/**
 * ページネーション設定
 */
export const PAGINATION = {
  // クリップ一覧（ダッシュボード）
  CLIPS_PER_PAGE: 20,
  // お気に入りクリップ
  LIKED_CLIPS_PER_PAGE: 20,
} as const;

/**
 * フォルダカラーパレット
 */
/**
 * 人気クリップ取得設定（未認証ユーザー向け）
 */
export const POPULAR_CLIPS_CONFIG = {
  TOP_GAMES_COUNT: 5,         // 取得するゲーム数
  CLIPS_PER_GAME: 100,        // 各ゲームから取得するクリップ数
  MAX_PER_STREAMER: 5,        // 各配信者の最大表示件数
  DAYS: 7,                    // 直近7日間
} as const;

/**
 * デフォルトフォルダ設定（新規登録時に自動作成）
 */
export const DEFAULT_FOLDER = {
  name: 'お気に入り配信者',
  color: '#a855f7',
} as const;

export const FOLDER_COLORS = [
  { name: '赤', value: '#ef4444' },
  { name: 'ピンク', value: '#ec4899' },
  { name: '紫', value: '#a855f7' },
  { name: '青', value: '#3b82f6' },
  { name: '緑', value: '#10b981' },
  { name: '黄色', value: '#f59e0b' },
  { name: 'オレンジ', value: '#f97316' },
  { name: 'グレー', value: '#6b7280' },
] as const;
