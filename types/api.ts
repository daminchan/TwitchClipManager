/**
 * API レスポンスの共通型定義
 */

/**
 * 標準的な API レスポンス形式
 * @template T レスポンスデータの型
 */
export interface ApiResponse<T = any> {
  /** 成功時のデータ */
  data?: T;
  /** エラーメッセージ */
  error?: string;
  /** エラーコード */
  code?: string;
  /** 追加の詳細情報 */
  details?: any;
}

/**
 * ページネーション情報
 */
export interface Pagination {
  /** 現在のページ */
  page: number;
  /** 1ページあたりのアイテム数 */
  limit: number;
  /** 総アイテム数 */
  total: number;
  /** 総ページ数 */
  totalPages: number;
}

/**
 * ページネーション付き API レスポンス
 * @template T レスポンスデータの型
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** ページネーション情報 */
  pagination?: Pagination;
}
