import importedContent from "@/lib/news-imported.json";
import { newsItems } from "@/lib/news";
import type { NewsArticleData, NewsContent } from "@/types/news";
const imported = importedContent as Record<string, NewsContent>;
export function getNewsArticle(id:string): NewsArticleData | undefined { const item=newsItems.find(entry=>entry.id===id); const content=imported[id]; return item && content ? {id,title:item.title,...content} : undefined; }
