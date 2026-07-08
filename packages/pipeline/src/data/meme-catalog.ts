export interface MemeCatalogEntry {
  name: string;
  giphyQuery: string;
  searchVariants?: string[];
  niches: string[];
  energy: string;
}

export const MemeCatalog: MemeCatalogEntry[] = [
  {
    name: 'confused math lady',
    giphyQuery: 'confused nick young',
    searchVariants: ['nick young meme', 'math lady meme', 'confused math lady'],
    niches: ['fitness', 'calorie', 'health', 'macro'],
    energy: 'chaotic realization',
  },
  { name: 'side eye chloe', giphyQuery: 'side eye chloe', niches: ['fitness', 'diet', 'wellness'], energy: 'skeptical judgment' },
  { name: 'pikachu shocked', giphyQuery: 'pikachu shocked face', niches: ['fitness', 'food', 'snack'], energy: 'surprise reveal' },
  { name: 'sigma stare', giphyQuery: 'sigma stare meme', niches: ['fitness', 'gym', 'grindset'], energy: 'unbothered flex' },
  { name: 'chef kiss', giphyQuery: 'chef kiss meme', niches: ['food', 'cooking', 'recipe'], energy: 'perfectionist approval' },
  { name: 'this is fine dog', giphyQuery: 'this is fine dog fire', niches: ['health', 'stress', 'burnout'], energy: 'deadpan chaos' },
  { name: 'crying jordan', giphyQuery: 'crying jordan meme', niches: ['fitness', 'fail', 'relatable'], energy: 'tragic comedy' },
  { name: 'stonks', giphyQuery: 'stonks meme', niches: ['saas', 'startup', 'business'], energy: 'ironic success' },
  { name: 'distracted boyfriend', giphyQuery: 'distracted boyfriend meme', niches: ['saas', 'productivity', 'app'], energy: 'temptation switch' },
  { name: 'galaxy brain', giphyQuery: 'galaxy brain meme', niches: ['saas', 'ai', 'tech'], energy: 'big brain moment' },
  { name: 'they dont know', giphyQuery: 'they dont know meme', niches: ['saas', 'founder', 'startup'], energy: 'insider flex' },
  { name: 'oh no anyway', giphyQuery: 'oh no anyway meme', niches: ['fitness', 'cheat meal', 'food'], energy: 'shameless pivot' },
  { name: 'record scratch', giphyQuery: 'record scratch meme', niches: ['general', 'storytime'], energy: 'plot twist intro' },
  { name: 'npc streaming', giphyQuery: 'npc meme stare', niches: ['general', 'brainrot', 'tiktok'], energy: 'blank stare' },
  { name: 'roman empire', giphyQuery: 'roman empire meme', niches: ['wellness', 'obsession', 'fitness'], energy: 'hyperfixation' },
  { name: 'khaby lame shrug', giphyQuery: 'khaby lame', searchVariants: ['khaby lame shrug', 'khaby lame reaction'], niches: ['general', 'reaction', 'tiktok'], energy: 'unimpressed deadpan' },
  { name: 'khaby lame', giphyQuery: 'khaby lame', searchVariants: ['khaby lame shrug', 'khaby lame reaction'], niches: ['general', 'reaction', 'viral'], energy: 'signature shrug reaction' },
  {
    name: 'ishowspeed',
    giphyQuery: 'ishowspeed',
    searchVariants: ['ishowspeed reaction', 'ishowspeed screaming', 'speed streamer'],
    niches: ['general', 'reaction', 'tiktok', 'sports'],
    energy: 'chaotic hype reaction',
  },
  { name: 'skibidi', giphyQuery: 'skibidi meme', niches: ['general', 'brainrot', 'tiktok', 'gen z'], energy: 'chaotic brainrot' },
  { name: 'gyatt', giphyQuery: 'gyatt reaction meme', niches: ['fitness', 'gym', 'tiktok'], energy: 'hype reaction' },
  { name: 'rizz face', giphyQuery: 'rizz face meme', niches: ['general', 'dating', 'tiktok'], energy: 'smug confidence' },
  { name: 'eye roll', giphyQuery: 'eye roll meme reaction', niches: ['general', 'skeptical', 'wellness'], energy: 'unimpressed shade' },
  { name: 'mind blown', giphyQuery: 'mind blown meme', niches: ['saas', 'ai', 'tech', 'fitness'], energy: 'shocked revelation' },
  { name: 'crying laughing', giphyQuery: 'crying laughing meme', niches: ['general', 'funny', 'relatable'], energy: 'hysterical laughter' },
  { name: 'duke dennis reaction', giphyQuery: 'duke dennis reaction', niches: ['general', 'sports', 'fitness', 'tiktok'], energy: 'hype disbelief' },
];

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

function findCatalogEntry(query: string): MemeCatalogEntry | undefined {
  const normalized = normalizeQuery(query);
  const exact = MemeCatalog.find(
    (entry) =>
      normalizeQuery(entry.name) === normalized ||
      normalizeQuery(entry.giphyQuery) === normalized ||
      entry.searchVariants?.some((variant) => normalizeQuery(variant) === normalized),
  );
  if (exact) return exact;

  return MemeCatalog.find((entry) => {
    const name = normalizeQuery(entry.name);
    const giphy = normalizeQuery(entry.giphyQuery);
    if (normalized.startsWith(`${giphy} `) || normalized === giphy) return true;
    if (normalized.startsWith(`${name} `) || normalized === name) return true;
    if (giphy.length >= 4 && normalized.includes(giphy)) return true;
    return entry.searchVariants?.some((variant) => normalized.includes(normalizeQuery(variant))) ?? false;
  });
}

export function expandMemeSearchQueries(query: string, maxChars = 50): string[] {
  const base = query.trim().slice(0, maxChars);
  const entry = findCatalogEntry(query);
  const variants = entry?.searchVariants ?? [];
  const seen = new Set<string>();
  const queries: string[] = [];

  const ordered = entry
    ? [entry.giphyQuery, ...variants, base]
    : [base, ...variants];

  for (const candidate of ordered) {
    const trimmed = candidate?.trim().slice(0, maxChars);
    if (!trimmed) continue;
    const key = normalizeQuery(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(trimmed);
  }

  return queries;
}

export function filterMemeCatalog(niche: string, vibe?: string): MemeCatalogEntry[] {
  const haystack = `${niche} ${vibe ?? ''}`.toLowerCase();
  const scored = MemeCatalog.map((entry) => {
    const score = entry.niches.reduce(
      (total, tag) => (haystack.includes(tag) ? total + 2 : total),
      0,
    );
    return { entry, score };
  });

  const matched = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  if (matched.length > 0) return matched.map((item) => item.entry);

  return MemeCatalog.slice(0, 8);
}

export function formatCatalogContext(entries: MemeCatalogEntry[]): string {
  return entries
    .map((entry) => {
      const variants = entry.searchVariants?.length
        ? ` (also try: ${entry.searchVariants.map((v) => `"${v}"`).join(', ')})`
        : '';
      return `- ${entry.name} (${entry.energy}) → search: "${entry.giphyQuery}"${variants}`;
    })
    .join('\n');
}
