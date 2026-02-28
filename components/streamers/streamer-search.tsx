// - API Routes を使用して配信者検索（キャッシュ最適化）

'use client';

import { useState, useMemo } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_ENDPOINTS, LABELS } from '@/lib/constants';
import { sortByLiveStatus } from '@/lib/utils';

import type { TwitchChannel } from '@/types/twitch';

const EMPTY_STREAMER_IDS: string[] = [];

interface StreamerSearchProps {
  onSelectStreamer: (streamer: TwitchChannel) => void;
  addedStreamerIds?: string[]; // 既に追加済みの配信者ID
}

export function StreamerSearch({ onSelectStreamer, addedStreamerIds = EMPTY_STREAMER_IDS }: StreamerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TwitchChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingStreamerId, setAddingStreamerId] = useState<string | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // 検索結果をソート（ライブ中を上位に）
  const sortedResults = useMemo(() => sortByLiveStatus(results), [results]);

  const handleSelectStreamer = async (streamer: TwitchChannel, e: React.MouseEvent) => {
    e.stopPropagation(); // カードクリックを防ぐ

    // 既に追加中または追加済みの場合は何もしない
    if (addingStreamerId === streamer.id || addedStreamerIds.includes(streamer.id) || recentlyAddedIds.has(streamer.id)) {
      return;
    }

    setAddingStreamerId(streamer.id);

    try {
      // 配信者を追加（親コンポーネントの処理を待つ）
      await onSelectStreamer(streamer);

      // 追加完了を記録
      setRecentlyAddedIds(prev => new Set(prev).add(streamer.id));
    } finally {
      setAddingStreamerId(null);
    }
  };

  const handleClearResults = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setAddingStreamerId(null);
    setRecentlyAddedIds(new Set());
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query || query.trim().length === 0) {
      setError(LABELS.ERRORS.STREAMER_NAME_REQUIRED);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setRecentlyAddedIds(new Set()); // 新しい検索時にリセット

    try {
      // API Route で配信者を検索（キャッシュ最適化）
      const response = await fetch(
        `${API_ENDPOINTS.TWITCH.STREAMERS}?q=${encodeURIComponent(query.trim())}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error(LABELS.ERRORS.SEARCH_FAILED);
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error('データが取得できませんでした');
      }

      setResults(result.data);

      if (result.data.length === 0) {
        setError(LABELS.ERRORS.STREAMER_NOT_FOUND);
      }
    } catch (error) {

      setError(LABELS.ERRORS.SEARCH_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder={LABELS.PLACEHOLDERS.SEARCH_STREAMERS}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-white border-gray-200 text-gray-900 placeholder-gray-500"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? LABELS.BUTTONS.SEARCHING : '検索'}
        </Button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {sortedResults.length > 0 && (
        <div className="space-y-2">
          {/* 検索結果ヘッダー */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <p className="text-sm text-gray-500">
              {sortedResults.length}件の配信者が見つかりました
            </p>
            <button
              onClick={handleClearResults}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition"
              aria-label="検索結果を閉じる"
            >
              <X className="w-4 h-4" />
              <span>閉じる</span>
            </button>
          </div>

          {/* 検索結果一覧 */}
          {sortedResults.map((streamer) => {
            const isAddingThis = addingStreamerId === streamer.id;
            const isAlreadyAdded = addedStreamerIds.includes(streamer.id) || recentlyAddedIds.has(streamer.id);

            return (
              <Card
                key={streamer.id}
                className="p-3 bg-white border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <img
                      src={streamer.thumbnail_url.replace('{width}', '50').replace('{height}', '50')}
                      alt={streamer.display_name}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{streamer.display_name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {streamer.game_name || '配信中ではありません'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* ライブバッジ */}
                    {streamer.is_live && (
                      <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
                    )}

                    {/* 追加ボタン */}
                    {isAlreadyAdded ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        className="bg-green-600/20 text-green-400 border border-green-600/50 cursor-default"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {LABELS.BUTTONS.ADDED}
                      </Button>
                    ) : isAddingThis ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        className="bg-purple-600/20 text-purple-400 border border-purple-600/50"
                      >
                        <div className="animate-spin"><Loader2 className="w-4 h-4" /></div>
                        {LABELS.BUTTONS.ADDING}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => handleSelectStreamer(streamer, e)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        追加
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
