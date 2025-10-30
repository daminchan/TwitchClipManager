/**
 * データベース関連の型定義
 * Prisma スキーマに対応するアプリケーション層の型
 */

/**
 * お気に入り配信者
 * データベースから取得した FavoriteStreamer の型
 */
export interface FavoriteStreamer {
  /** プライマリキー */
  id: string;
  /** Twitch の配信者 ID */
  streamerId: string;
  /** 配信者の表示名 */
  streamerName: string;
  /** 配信者のログイン名 */
  streamerLogin: string;
  /** 配信者のプロフィール画像 URL */
  streamerImage?: string | null;
  /** お気に入りに追加した日時 */
  createdAt: Date | string;
}

/**
 * いいねしたクリップ
 * データベースから取得した LikedClip の型
 */
export interface LikedClip {
  /** プライマリキー */
  id: string;
  /** ユーザー ID */
  userId: string;
  /** Twitch のクリップ ID */
  clipId: string;
  /** クリップの URL */
  clipUrl: string;
  /** クリップの埋め込み URL */
  clipEmbedUrl: string;
  /** クリップのタイトル */
  clipTitle: string;
  /** 配信者 ID */
  broadcasterId: string;
  /** 配信者名 */
  broadcasterName: string;
  /** クリップ作成者名 */
  creatorName: string;
  /** サムネイル URL */
  thumbnailUrl: string;
  /** 再生回数（いいねした時点） */
  viewCount: number;
  /** クリップの長さ（秒） */
  duration: number;
  /** クリップ作成日時 */
  clipCreatedAt: string;
  /** いいねした日時 */
  likedAt: Date | string;
}

/**
 * いいねクリップ作成時の入力型
 */
export interface CreateLikedClipInput {
  clipId: string;
  clipUrl: string;
  clipEmbedUrl: string;
  clipTitle: string;
  broadcasterId: string;
  broadcasterName: string;
  creatorName: string;
  thumbnailUrl: string;
  viewCount: number;
  duration: number;
  clipCreatedAt: string;
}
