/**
 * Twitch クリップの型定義
 * https://dev.twitch.tv/docs/api/reference#get-clips
 */
export interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number | null;
}

/**
 * Twitch ユーザー/配信者の型定義
 * https://dev.twitch.tv/docs/api/reference#get-users
 *
 * 現在未使用だが、将来的にユーザープロフィール詳細表示や
 * Get Users API を使用する機能追加時に使用予定
 */
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count?: number;
  created_at: string;
}

/**
 * チャンネル検索の型定義
 * https://dev.twitch.tv/docs/api/reference#search-channels
 */
export interface TwitchChannel {
  id: string;
  broadcaster_login: string;
  display_name: string;
  broadcaster_language: string;
  game_id: string;
  game_name: string;
  is_live: boolean;
  tags: string[];
  thumbnail_url: string;
  title: string;
  started_at: string;
}

/**
 * ゲーム/カテゴリの型定義
 * https://dev.twitch.tv/docs/api/reference#get-top-games
 */
export interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id?: string;
}

/**
 * おすすめ配信者の型定義（クリップベース）
 */
export interface RecommendedStreamer {
  userId: string;
  userName: string;
  userLogin: string;
  profileImageUrl: string;
  totalClipViews: number;
  clipCount: number;
  topClips: TwitchClip[];
}
