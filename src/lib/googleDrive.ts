const DRIVE_ID_PATTERNS = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/,   // https://drive.google.com/file/d/<ID>/view
  /[?&]id=([a-zA-Z0-9_-]+)/,       // https://drive.google.com/open?id=<ID> / uc?id=<ID>
];

export function driveFileId(url: string): string | null {
  for (const re of DRIVE_ID_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function driveEmbedUrl(url: string): string | null {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}
