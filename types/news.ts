export type NewsText = { zh: string; en: string };

export type NewsBlock =
  | { type: "paragraph" | "heading" | "caption" | "lead" | "quote"; text: NewsText }
  | { type: "image"; src: string; width: number; height: number; alt: NewsText };

export interface NewsContent {
  publishedAt: string;
  sourceUrl: string;
  blocks: NewsBlock[];
}

export interface NewsArticleData extends NewsContent {
  id: string;
  title: NewsText;
}
