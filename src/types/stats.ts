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

// Thống kê phân công hội thoại — xem server/src/controllers/stats.controller.ts.
export interface StatsStaffRow {
  userId: string;
  // Ảnh chụp HIỆN TẠI (không đổi theo kỳ): đang phụ trách bao nhiêu, chưa đọc bao nhiêu.
  assigned: number;
  unread: number;
  // Trong kỳ đang xem: được giao bao nhiêu hội thoại, trong đó bao nhiêu đã có
  // phản hồi của chính người đó, và thời gian phản hồi trung bình tính từ lúc được giao.
  assignedInRange: number;
  responded: number;
  avgResponseSeconds: number | null;
  // Số tin nhân viên đã gửi trong kỳ (chỉ tính tin gửi qua web này).
  replies: number;
}

export interface StatsAssignment {
  // Hàng chờ: hội thoại 1-1 chưa ai phụ trách (không tính nhóm).
  unassigned: number;
  unassignedUnread: number;
  staff: StatsStaffRow[];
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
  assignment: StatsAssignment;
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
