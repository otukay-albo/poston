import { redirect } from "next/navigation";

// 傾向分析は「アナリティクス」ページ内のタブに統合された
export default function AnalysisRedirect() {
  redirect("/analytics?tab=trend");
}
