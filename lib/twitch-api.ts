import { TWITCH_API_BASE_URL, TWITCH_AUTH_URL, DEFAULT_CLIPS_LIMIT } from './constants';
import type { TwitchClip } from '@/types/twitch';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Twitch APIアクセストークンを取得
 */
async function getTwitchAccessToken(): Promise<string> {
  // トークンが有効期限内であれば再利用
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Twitch API credentials are not configured');
  }

  const response = await fetch(
    `${TWITCH_AUTH_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error('Failed to get Twitch access token');
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;

  return accessToken as string;
}

/**
 * Twitch API共通リクエスト関数
 */
async function twitchApiRequest(endpoint: string, params?: Record<string, string>) {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    throw new Error('TWITCH_CLIENT_ID is not configured');
  }

  const url = new URL(`${TWITCH_API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twitch API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * 配信者を検索
 */
export async function searchStreamers(query: string) {
  const data = await twitchApiRequest('/search/channels', {
    query,
    first: '10',
  });

  return data.data;
}

/**
 * 配信者IDから配信者情報を取得
 */
export async function getStreamerById(broadcasterId: string) {
  const data = await twitchApiRequest('/users', {
    id: broadcasterId,
  });

  return data.data[0] || null;
}

/**
 * ライブ配信中かチェック
 */
export async function getStreamsStatus(broadcasterIds: string[]) {
  if (broadcasterIds.length === 0) return [];

  const params: Record<string, string> = {};
  broadcasterIds.forEach((id, index) => {
    params[`user_id`] = id;
  });

  // 複数のIDを渡す場合はクエリパラメータを複数追加
  const url = new URL(`${TWITCH_API_BASE_URL}/streams`);
  broadcasterIds.forEach((id) => {
    url.searchParams.append('user_id', id);
  });

  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    throw new Error('TWITCH_CLIENT_ID is not configured');
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twitch API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * 配信者のクリップを取得（人気順）
 */
export async function getClipsByBroadcaster(
  broadcasterId: string,
  options: {
    first?: number;
    startedAt?: string;
    endedAt?: string;
  } = {}
) {
  const params: Record<string, string> = {
    broadcaster_id: broadcasterId,
    first: (options.first || DEFAULT_CLIPS_LIMIT).toString(),
  };

  if (options.startedAt) {
    params.started_at = options.startedAt;
  }

  if (options.endedAt) {
    params.ended_at = options.endedAt;
  }

  const data = await twitchApiRequest('/clips', params);

  // 視聴回数順にソート
  const sortedClips = data.data.sort(
    (a: TwitchClip, b: TwitchClip) => b.view_count - a.view_count
  );

  return sortedClips;
}

/**
 * 人気ゲーム一覧を取得（視聴者数順）
 */
export async function getTopGames(limit: number = 50) {
  const data = await twitchApiRequest('/games/top', {
    first: limit.toString(),
  });

  return data.data;
}

/**
 * ゲームを名前で検索
 */
export async function searchGames(query: string, limit: number = 20) {
  const data = await twitchApiRequest('/search/categories', {
    query,
    first: limit.toString(),
  });

  return data.data;
}

/**
 * ゲームIDでクリップを取得（期間指定可能、再生数順）
 */
export async function getClipsByGame(
  gameId: string,
  options: {
    first?: number;
    startedAt?: string;
    endedAt?: string;
  } = {}
) {
  const params: Record<string, string> = {
    game_id: gameId,
    first: (options.first || 100).toString(),
  };

  if (options.startedAt) {
    params.started_at = options.startedAt;
  }

  if (options.endedAt) {
    params.ended_at = options.endedAt;
  }

  const data = await twitchApiRequest('/clips', params);

  // APIは自動的に再生数順にソート済み
  return data.data;
}
