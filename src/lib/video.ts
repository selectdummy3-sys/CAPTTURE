const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch)?\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtube\.com\/live\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

export function toVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(YOUTUBE_RE);
  if (yt) {
    const id = yt[1];
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0`;
  }
  const vm = url.match(VIMEO_RE);
  if (vm) {
    return `https://player.vimeo.com/video/${vm[1]}?background=1&autoplay=1&loop=1&muted=1&byline=0&title=0&portrait=0`;
  }
  return null;
}