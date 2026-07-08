'use client';

import { ToolNames, type RenderUgcVideoSuccess } from '@ugc/types';
import type { UgcToolInvocation } from '@/lib/chat/tools';
import { RenderVideoToolCard } from './tools/render-video-tool-card';
import { ResearchProductToolCard } from './tools/research-product-tool-card';
import { ResearchTrendsToolCard } from './tools/research-trends-tool-card';
import { SearchAssetsToolCard } from './tools/search-assets-tool-card';

interface UgcPipelineToolCardProps {
  invocation: UgcToolInvocation;
}

export function UgcPipelineToolCard({ invocation }: UgcPipelineToolCardProps) {
  switch (invocation.toolName) {
    case ToolNames.researchProduct:
      return <ResearchProductToolCard invocation={invocation} />;
    case ToolNames.researchTrends:
      return <ResearchTrendsToolCard invocation={invocation} />;
    case ToolNames.searchAssets:
      return <SearchAssetsToolCard invocation={invocation} />;
    case ToolNames.renderUgcVideo:
      return <RenderVideoToolCard invocation={invocation} />;
    default:
      return null;
  }
}

export type { RenderUgcVideoSuccess };
