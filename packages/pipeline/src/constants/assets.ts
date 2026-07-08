export const JamendoEndpoints = {
  tracks: 'https://api.jamendo.com/v3.0/tracks/',
} as const;

export const PexelsEndpoints = {
  searchVideos: 'https://api.pexels.com/videos/search',
} as const;

export const GiphyEndpoints = {
  search: 'https://api.giphy.com/v1/gifs/search',
  clipsSearch: 'https://api.giphy.com/v1/clips/search',
  clipsTrending: 'https://api.giphy.com/v1/clips/trending',
} as const;

export const AssetLimits = {
  pexelsPerPage: 15,
  pexelsMaxPage: 5,
  giphyLimit: 25,
  giphyMaxOffset: 40,
  jamendoLimit: 15,
  jamendoMaxOffset: 40,
  giphyQueryMaxChars: 50,
  pexelsQueryMaxChars: 80,
  downloadTimeoutMs: 30_000,
} as const;
