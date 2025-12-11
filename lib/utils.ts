import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 視聴回数をフォーマット (例: 1234 -> 1.2K)
 */
export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * 日付を相対表示 (例: "2 days ago")
 * SSR対応: 基準時刻を指定可能（指定がない場合はクリップ作成日をそのまま表示）
 */
export function formatRelativeTime(dateString: string, baseTime?: Date): string {
  const date = new Date(dateString);
  // baseTimeが指定されていない場合は日付フォーマットを返す（SSR安全）
  if (!baseTime) {
    // YYYY/MM/DD形式で返す
    return date.toLocaleDateString('ja-JP');
  }

  const diffMs = baseTime.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * 秒数を時間表示 (例: 125 -> "2:05")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * ライブ中の配信者を上位にソート
 * @param items ソート対象の配列
 * @param isLiveKey ライブ状態を示すキー（デフォルト: 'isLive' または 'is_live'）
 */
export function sortByLiveStatus<T extends { isLive?: boolean; is_live?: boolean }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const aIsLive = a.isLive ?? a.is_live ?? false;
    const bIsLive = b.isLive ?? b.is_live ?? false;
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    return 0;
  });
}
