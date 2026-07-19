import { redirect } from "next/navigation";

// 予約カレンダーは「投稿」ページ内のタブに統合された
export default function CalendarRedirect() {
  redirect("/post?tab=calendar");
}
