// TikTok Content Posting API のアップロード分割ルール。
// - 各チャンクは 5MB以上 64MB以下（最終チャンクのみ超過可・最大128MB）
// - 5MB未満の動画は分割せず、chunk_size = 動画サイズ で丸ごと送る
// - total_chunk_count = floor(video_size / chunk_size)
// - 動画は最大4GB・最大1000チャンク

export const MAX_VIDEO_BYTES = 4 * 1024 * 1024 * 1024; // 4GB
const MIN_CHUNK = 5 * 1024 * 1024; // 5MB
const CHUNK = 50 * 1024 * 1024; // 分割時のチャンクサイズ（64MB上限に対し余裕を持たせる）

export interface ChunkPlan {
  chunk_size: number;
  total_chunk_count: number;
}

export function planChunks(video_size: number): ChunkPlan {
  // 64MB以下は1回で送れる（chunk_sizeが上限内に収まる）
  if (video_size <= 64 * 1024 * 1024) {
    return { chunk_size: video_size, total_chunk_count: 1 };
  }
  // 64MB超は分割。最終チャンクが余りを含む（chunk_size超過が許容される）
  const total = Math.max(1, Math.floor(video_size / CHUNK));
  return { chunk_size: CHUNK, total_chunk_count: total };
}

// 各チャンクのバイト範囲を返す（最終チャンクは末尾まで含む）
export function chunkRanges(video_size: number, plan: ChunkPlan): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  for (let i = 0; i < plan.total_chunk_count; i++) {
    const start = i * plan.chunk_size;
    const isLast = i === plan.total_chunk_count - 1;
    const end = isLast ? video_size - 1 : start + plan.chunk_size - 1;
    ranges.push({ start, end });
  }
  return ranges;
}

export { MIN_CHUNK };
