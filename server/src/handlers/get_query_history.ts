
import { type QueryHistoryItem } from '../schema';

export declare function getQueryHistory(limit?: number): Promise<QueryHistoryItem[]>;
