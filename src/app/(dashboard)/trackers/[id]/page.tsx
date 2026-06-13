// Server component page — exports generateStaticParams for static export.
// The actual client-side UI is in ./tracker-detail-client.tsx
import TrackerDetailClient from "./tracker-detail-client";

export async function generateStaticParams() {
  // Pre-render a placeholder shell. Cloudflare Pages _redirects rewrites
  // any /trackers/* request to this shell, and useParams() reads the real ID.
  return [{ id: "view" }];
}

export default function TrackerDetailPage() {
  return <TrackerDetailClient />;
}
