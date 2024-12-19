import { Document }  from '@/types/document'

export interface SearchResult {
    metadata: Document['metadata'];
    content: string;
}