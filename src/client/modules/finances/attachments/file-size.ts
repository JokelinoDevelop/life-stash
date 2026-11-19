const KB = 1024;

/** "184 KB", "1.2 MB". */
export const formatFileSize = (bytes: number): string =>
  bytes < KB * KB
    ? `${Math.max(1, Math.round(bytes / KB))} KB`
    : `${(bytes / KB / KB).toFixed(1)} MB`;
