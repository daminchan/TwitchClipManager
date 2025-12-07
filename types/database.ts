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

/**
 * フォルダ
 * データベースから取得した Folder の型
 */
export interface Folder {
  /** プライマリキー */
  id: string;
  /** ユーザー ID */
  userId: string;
  /** フォルダ名 */
  name: string;
  /** フォルダの色（HEXカラーコード） */
  color: string;
  /** 並び順 */
  order: number;
  /** 作成日時 */
  createdAt: Date | string;
  /** 更新日時 */
  updatedAt: Date | string;
  /** フォルダ内の配信者（リレーション） */
  folderStreamers?: FolderStreamer[];
}

/**
 * フォルダ内の配信者
 * データベースから取得した FolderStreamer の型
 */
export interface FolderStreamer {
  /** プライマリキー */
  id: string;
  /** フォルダ ID */
  folderId: string;
  /** Twitch の配信者 ID */
  streamerId: string;
  /** 配信者名 */
  streamerName: string;
  /** 配信者のログイン名 */
  streamerLogin: string;
  /** 配信者のプロフィール画像 URL */
  streamerImage?: string | null;
  /** 追加日時 */
  addedAt: Date | string;
}

/**
 * フォルダ作成時の入力型
 */
export interface CreateFolderInput {
  name: string;
  color: string;
}

/**
 * フォルダ更新時の入力型
 */
export interface UpdateFolderInput {
  name?: string;
  color?: string;
  order?: number;
}

/**
 * フォルダに配信者を追加する入力型
 */
export interface AddStreamerToFolderInput {
  streamerId: string;
  streamerName: string;
  streamerLogin: string;
  streamerImage?: string | null;
}
