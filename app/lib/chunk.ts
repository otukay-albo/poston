// TikTok Content Posting API のアップロード分割ルール。
// - 各チャンクは 5MB以上 64MB以下（最終チャンクのみ超過可・最大128MB）
// - 5MB未満の動画は分割せず、chunk_size = 動画サイズ で丸ごと送る
// - total_chunk_count = floor(video_size / chunk_size)
// - 動画は最大4GB・最大1000チャンク

export const MAX_VIDEO_BYTES = 4 * 1024 * 1024 * 1024; // 4GB
const MIN_CHUNK = 5 * 1024 * 1024; // 5MB（APIの下限）
const MAX_CHUNK = 60 * 1024 * 1024; // 64MB上限に対し余裕を持たせた分割単位

export interface ChunkPlan {
  chunk_size: number;
  total_chunk_count: number;
}

// 動画サイズからチャンク構成を決める。
// 1チャンクで送れる場合は chunk_size = video_size（APIは単一チャンク時に
// 両者の一致を期待する）。超える場合は動画を均等に割り、
// total_chunk_count は必ず floor(video_size / chunk_size) と整合させる。
export function planChunks(video_size: number): ChunkPlan {
  if (video_size <= MAX_CHUNK) {
    return { chunk_size: video_size, total_chunk_count: 1 };
  }
  const n = Math.ceil(video_size / MAX_CHUNK); // 必要なチャンク数
  let chunk_size = Math.floor(video_size / n); // 均等割り（端数は最終チャンクへ）
  if (chunk_size < MIN_CHUNK) chunk_size = MIN_CHUNK;
  const total_chunk_count = Math.max(1, Math.floor(video_size / chunk_size));
  return { chunk_size, total_chunk_count };
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

export { MIN_CHUNK, MAX_CHUNK };
