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
 * サーバーアクションの実行結果
 * actions/*.ts で使用される共通の戻り値型
 */
export interface ActionResult {
  /** 処理が成功したかどうか */
  success: boolean;
  /** ユーザーに表示するメッセージ */
  message: string;
  /** エラー詳細（エラー時のみ） */
  error?: string;
}
