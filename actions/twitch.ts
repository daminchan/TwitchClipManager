/**
 * Twitch API関連のサーバーアクション
 * セキュアなサーバー側処理
 *
 * 適用ルール:
 * - CLAUDE.md セクション801-903: サーバーアクション
 * - CLAUDE.md セクション541-564: エラーハンドリング
 */

'use server';

import { getStreamsStatus, searchStreamers } from '@/lib/twitch-api';
import type { TwitchChannel } from '@/types/twitch';

export interface LiveStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface GetLiveStatusResult {
  success: boolean;
  data?: LiveStream[];
  error?: string;
}

export interface SearchStreamersResult {
  success: boolean;
  data?: TwitchChannel[];
  error?: string;
}

/**
 * 配信者を検索
 *
 * @param query - 検索クエリ
 */
export async function searchTwitchStreamers(
  query: string
): Promise<SearchStreamersResult> {
  try {
    // バリデーション
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'Search query is required'
      };
    }

    // Twitch APIで配信者を検索
    const streamers = await searchStreamers(query.trim());

    return {
      success: true,
      data: streamers || []
    };
  } catch (error) {
    console.error('Search streamers error:', error);
    return {
      success: false,
      error: 'Failed to search streamers'
    };
  }
}

/**
 * 複数の配信者のライブ配信状態を取得
 *
 * @param broadcasterIds - 配信者IDの配列
 */
export async function getLiveStatus(
  broadcasterIds: string[]
): Promise<GetLiveStatusResult> {
  try {
    // バリデーション
    if (!broadcasterIds || broadcasterIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 有効なIDのみフィルタリング
    const validIds = broadcasterIds.filter((id) => id && id.trim().length > 0);

    if (validIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // Twitch APIからライブステータスを取得
    const liveStreams = await getStreamsStatus(validIds);

    return {
      success: true,
      data: liveStreams
    };
  } catch (error) {
    console.error('Get live status error:', error);
    return {
      success: false,
      error: 'Failed to fetch live status'
    };
  }
}
