import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TwitchClip } from '@/types/twitch';
import type { SortType } from '@/components/dashboard/clip-sort-tabs';
import { API_ENDPOINTS, LABELS, CACHE_TIME } from '@/lib/constants';

export function usePopularClips() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('views');

  // 人気クリップを取得
  const {
    data: allClips = [],
    isLoading: isLoadingClips,
  } = useQuery({
    queryKey: ['clips', 'popular'],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.CLIPS.POPULAR, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(LABELS.ERRORS.CLIPS_FETCH_FAILED);
      }

      const result = await response.json();
      return (result.data || []) as TwitchClip[];
    },
    staleTime: CACHE_TIME.POPULAR_CLIPS,
  });

  // 未認証なのでlikedClipIdsは空
  const likedClipIds = useMemo(() => new Set<string>(), []);

  // フィルターとソート
  const filteredClips = useMemo(() => {
    const filtered = searchQuery.trim()
      ? allClips.filter((clip) => {
          const query = searchQuery.toLowerCase();
          return (
            clip.title.toLowerCase().includes(query) ||
            clip.broadcaster_name.toLowerCase().includes(query) ||
            clip.creator_name.toLowerCase().includes(query)
          );
        })
      : allClips;

    // toSorted()でイミュータブルに（ルール7.12）
    if (sortType === 'views') {
      return filtered.toSorted((a, b) => b.view_count - a.view_count);
    }
    if (sortType === 'date-desc') {
      return filtered.toSorted((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (sortType === 'date-asc') {
      return filtered.toSorted((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return filtered;
  }, [allClips, searchQuery, sortType]);

  return {
    allClips,
    filteredClips,
    isLoadingClips,
    searchQuery,
    sortType,
    likedClipIds,
    setSearchQuery,
    setSortType,
  };
}
