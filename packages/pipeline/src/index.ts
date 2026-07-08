export { ChatAgentPrompt, createPipelineDeps } from './prompts';
export type { PipelineDeps } from './prompts';
export {
  scrapeUrl,
  summarizeScrapedPage,
  extractUrlFromMessage,
  normalizeProductUrl,
} from './scrape';
export {
  composeVideo,
  downloadSelectedAssets,
  buildPublicVideoUrl,
  cleanupWorkDir,
  loadPipelinePresets,
} from './compose';
export type { AssetBundle, ResolvedAssets, VideoCopy, SelectedAssetUrls } from './compose';
export { createGenerationId } from './generation-id';
export { createPipelineTools } from './tools';
export type { CreatePipelineToolsOptions, PipelineToolContext } from './tools';
export { loadAudioPresets, findPresetById, resolvePresetPath } from './assets/audio';
export type { AudioPreset } from './assets/audio';
export {
  ensureDemoAudioFile,
  ensureDemoAudioPresets,
  isPlaceholderAudioFile,
  PlaceholderAudioMaxBytes,
} from './assets/demo-audio';
export { listGiphyCandidates, downloadAssetFromUrl } from './assets/giphy';
export { listPexelsCandidates, listPexelsMemeCandidates } from './assets/pexels';
export { listJamendoCandidates } from './assets/jamendo';
