export const ToolNames = {
  researchProduct: 'research_product',
  researchTrends: 'research_trends',
  searchAssets: 'search_assets',
  renderUgcVideo: 'render_ugc_video',
} as const;

export type ToolName = (typeof ToolNames)[keyof typeof ToolNames];

export const UgcPipelineToolNames = Object.values(ToolNames);
