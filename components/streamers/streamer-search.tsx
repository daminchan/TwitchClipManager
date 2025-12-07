// 適用スキル: component-creator
// 適用ルール:
// - セクション4.1: ファイル命名規則（kebab-case）
// - セクション4.6: コンポーネント構造（型定義 → コンポーネント → フック → ハンドラー → JSX）
// - セクション8.2: Props型定義
// - API Routes を使用して配信者検索（キャッシュ最適化）

'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_ENDPOINTS } from '@/lib/constants';

import type { TwitchChannel } from '@/types/twitch';

interface StreamerSearchProps {
  onSelectStreamer: (streamer: TwitchChannel) => void;
}

export function StreamerSearch({ onSelectStreamer }: StreamerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TwitchChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectStreamer = (streamer: TwitchChannel) => {
    // 配信者を追加
    onSelectStreamer(streamer);

    // 検索結果をクリア
    setQuery('');
    setResults([]);
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query || query.trim().length === 0) {
      setError('配信者名を入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // API Route で配信者を検索（キャッシュ最適化）
      const response = await fetch(
        `${API_ENDPOINTS.TWITCH.STREAMERS}?q=${encodeURIComponent(query.trim())}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error('データが取得できませんでした');
      }

      setResults(result.data);

      if (result.data.length === 0) {
        setError('配信者が見つかりませんでした');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('検索中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="配信者名を検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-400"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? '検索中...' : '検索'}
        </Button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((streamer) => (
            <Card
              key={streamer.id}
              className="p-3 bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer transition"
              onClick={() => handleSelectStreamer(streamer)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={streamer.thumbnail_url.replace('{width}', '50').replace('{height}', '50')}
                    alt={streamer.display_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-100">{streamer.display_name}</div>
                    <div className="text-xs text-gray-500">
                      {streamer.game_name || '配信中ではありません'}
                    </div>
                  </div>
                </div>
                {streamer.is_live && (
                  <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
