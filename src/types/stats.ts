export interface StatsComparison {
  current: number;
  previous: number;
}

export interface StatsSeriesPoint {
  key: string;
  label: string;
  customerMessages: number;
  pageMessages: number;
  newConversations: number;
}

export interface Stats {
  range: { days: number; granularity: "hour" | "day"; from: string; to: string };
  overview: {
    newConversations: StatsComparison;
    customerMessages: StatsComparison;
    pageMessages: StatsComparison & { bot: number };
    unreadConversations: number;
  };
  series: StatsSeriesPoint[];
  byChannel: { type: number; conversations: number }[];
  firstResponse: {
    sampleCount: number;
    avgSeconds: number | null;
    medianSeconds: number | null;
  };
}

export interface StatsParams {
  days?: number;
  pageId?: string;
  type?: number;
}
