export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  if (url.startsWith("data:video")) return true;
  // Handles URLs with querystrings too
  return /(\.mp4|\.webm|\.mov|\.m4v)(\?|$)/i.test(url);
}
