/**
 * アプリケーション全体で使用する定数を一元管理
 * 保守性・可読性向上のため、文字列やマジックナンバーをここに集約
 */

// Twitch API
export const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';
export const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';

// クリップ設定
export const DEFAULT_CLIPS_LIMIT = 20;
export const MAX_CLIPS_LIMIT = 100;

// 日付範囲（デフォルトは過去7日間）
export const DEFAULT_TIME_RANGE_DAYS = 7;

/**
 * クリップフィルターの設定
 * 各フィルターの期間と取得件数を定義
 */
export const CLIP_FILTERS = {
  WEEK: {
    days: 7,
    limit: 5, // 各配信者5件
    label: '過去7日間',
    icon: '📊',
    description: '各配信者の過去7日間のクリップ（各5件）',
  },
  THREE_DAYS: {
    days: 3,
    limit: 10, // 合計10件
    label: '直近3日・トップ10',
    icon: '🔥',
    description: '直近3日間の再生数トップ10',
  },
  MONTH: {
    days: 30,
    limit: 3, // 合計3件
    label: '30日間・トップ3',
    icon: '👑',
    description: '過去30日間の再生数トップ3',
  },
} as const;

export type ClipFilterType = keyof typeof CLIP_FILTERS;

/**
 * アプリケーション基本設定
 */
export const APP_CONFIG = {
  name: 'Twitch Clip Viewer',
  shortName: 'Clip Viewer',
  description: 'お気に入りの配信者のクリップを見つけよう',
  version: '1.0.0',
} as const;

/**
 * ルート定義
 * 使用例: router.push(ROUTES.DASHBOARD)
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  FAVORITES_CLIPS: '/favorites-clips',
  SETTINGS: '/settings',
} as const;

/**
 * API エンドポイント定義
 */
export const API_ENDPOINTS = {
  AUTH: {
    SESSION: '/api/auth/session',
  },
  FAVORITES: '/api/favorites',
  CLIPS: {
    FAVORITES: '/api/clips/favorites',
  },
  LIKED_CLIPS: {
    BASE: '/api/liked-clips',
    BY_ID: (clipId: string) => `/api/liked-clips/${clipId}`,
  },
  USER: {
    UPDATE: '/api/user/update',
    DELETE: '/api/user/delete',
  },
  TWITCH: {
    STREAMERS: '/api/twitch/streamers',
    CLIPS: '/api/twitch/clips',
    LIVE_STATUS: '/api/twitch/live-status',
  },
} as const;

/**
 * UI ラベル・テキスト定義
 */
export const LABELS = {
  // ナビゲーション
  NAV: {
    HOME: 'ホーム',
    FAVORITES: 'お気に入り',
    CLIPS: 'クリップ',
    MY_PAGE: 'マイページ',
    SETTINGS: '設定',
  },

  // セクションタイトル
  SECTIONS: {
    SEARCH_STREAMERS: '配信者を検索して追加',
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
    LIKE: 'いいね',
    LIKED: 'いいね済み',
    CLOSE: '閉じる',
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
    NO_FAVORITE_STREAMERS: 'お気に入り配信者のクリップがありません',
  },

  // ソートオプション
  SORT: {
    ALL: 'すべて',
    VIEWS: '再生数',
    DATE_DESC: '新しい順',
    DATE_ASC: '古い順',
  },

  // プレースホルダー
  PLACEHOLDERS: {
    SEARCH_CLIPS: 'クリップを検索...',
    EMAIL: 'your@email.com',
    PASSWORD: '6文字以上',
    NAME: 'あなたの名前',
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
