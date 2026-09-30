// Extract YouTube Video ID from various URL formats or direct ID string

export const extractYouTubeId = (urlOrId) => {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  const trimmed = urlOrId.trim();

  // If already a valid 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex for standard youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regex);

  return match ? match[1] : null;
};
