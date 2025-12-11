// 適用スキル: component-creator
// 適用ルール:
// - セクション4.1: ファイル命名規則（kebab-case）
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義
// - モーダルデザイン

'use client';

import { useState, useMemo } from 'react';
import { X, Search, Plus, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_ENDPOINTS } from '@/lib/constants';
import { sortByLiveStatus } from '@/lib/utils';

import type { TwitchChannel } from '@/types/twitch';

interface StreamerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStreamer: (streamer: TwitchChannel) => void;
  addedStreamerIds?: string[]; // 既に追加済みの配信者ID
}

export function StreamerSearchModal({
  isOpen,
  onClose,
  onSelectStreamer,
  addedStreamerIds = [],
}: StreamerSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TwitchChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingStreamerId, setAddingStreamerId] = useState<string | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // 検索結果をソート（ライブ中を上位に）
  const sortedResults = useMemo(() => sortByLiveStatus(results), [results]);

  const handleSelectStreamer = async (streamer: TwitchChannel, e: React.MouseEvent) => {
    e.stopPropagation();

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query || query.trim().length === 0) {
      setError('配信者名を入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setRecentlyAddedIds(new Set()); // 新しい検索時にリセット

    try {
      // API Route で配信者を検索
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

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setRecentlyAddedIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-800 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            配信者を検索して追加
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-100 transition"
            aria-label="閉じる"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 検索フォーム */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="配信者名を検索... (例: ゆきお)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                className="pl-10 bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-400"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? '検索中...' : '検索'}
            </Button>
          </form>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* 検索結果 */}
          {sortedResults.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                {sortedResults.length}件の配信者が見つかりました
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedResults.map((streamer) => {
                  const isAddingThis = addingStreamerId === streamer.id;
                  const isAlreadyAdded = addedStreamerIds.includes(streamer.id) || recentlyAddedIds.has(streamer.id);

                  return (
                    <Card
                      key={streamer.id}
                      className="p-4 bg-gray-900 border-gray-700 hover:bg-gray-800 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <img
                            src={streamer.thumbnail_url.replace('{width}', '70').replace('{height}', '70')}
                            alt={streamer.display_name}
                            className="w-14 h-14 rounded-full flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-base text-gray-100 truncate">{streamer.display_name}</div>
                            <div className="text-sm text-gray-400 truncate">
                              @{streamer.broadcaster_login}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
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
                              追加済み
                            </Button>
                          ) : isAddingThis ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled
                              className="bg-purple-600/20 text-purple-400 border border-purple-600/50"
                            >
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              追加中
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
            </div>
          )}

          {/* 初期状態 */}
          {!isLoading && results.length === 0 && !error && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">
                配信者名を入力して検索してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
