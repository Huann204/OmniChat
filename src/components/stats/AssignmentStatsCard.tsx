"use client";

import Link from "next/link";
import { MemberAvatar } from "@/components/inbox/AssigneePicker";
import { cn } from "@/lib/utils";
import type { ShopMember } from "@/types/shopMember";
import type { Stats, StatsStaffRow } from "@/types/stats";

// "45 giây" / "12 phút" / "1 giờ 5 phút" / "2 ngày 3 giờ" — cùng định dạng với
// thẻ "Phản hồi đầu tiên" ở StatsView.tsx.
function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${Math.round(seconds)} giây`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} ngày ${restHours} giờ` : `${days} ngày`;
}

const EMPTY_ROW = (userId: string): StatsStaffRow => ({
  userId,
  assigned: 0,
  unread: 0,
  assignedInRange: 0,
  responded: 0,
  avgResponseSeconds: null,
  replies: 0,
});

interface AssignmentStatsCardProps {
  assignment: Stats["assignment"];
  members: ShopMember[];
  myUserId: string;
  // true = chủ Shop/quản trị viên, thấy số liệu cả đội. Nhân viên thường chỉ có
  // đúng 1 dòng (của mình): server đã lọc, nhưng danh sách thành viên ở đây vẫn
  // đủ mọi người nên phải tự cắt theo cờ này, nếu không các dòng còn lại sẽ hiện
  // toàn số 0 gây hiểu nhầm.
  canSeeTeam: boolean;
}

// Bảng phân công & hiệu suất theo nhân viên — số liệu từ stats.assignment (xem
// server/src/controllers/stats.controller.ts). Dựng dòng theo DANH SÁCH THÀNH
// VIÊN (không chỉ người có số liệu) để thấy cả người chưa được giao hội thoại
// nào — đó chính là thông tin cần khi kiểm tra xoay vòng có chia đều không.
export function AssignmentStatsCard({ assignment, members, myUserId, canSeeTeam }: AssignmentStatsCardProps) {
  const dataByUser = new Map(assignment.staff.map((s) => [s.userId, s]));

  const memberRows = members
    .filter((m) => canSeeTeam || m.user.id === myUserId)
    .map((m) => ({ member: m, row: dataByUser.get(m.user.id) ?? EMPTY_ROW(m.user.id) }))
    .sort((a, b) => b.row.assigned - a.row.assigned);

  // Người có số liệu nhưng không còn trong danh sách thành viên (đã rời Shop).
  const knownIds = new Set(members.map((m) => m.user.id));
  const formerRows = canSeeTeam ? assignment.staff.filter((s) => !knownIds.has(s.userId)) : [];

  const maxAssigned = Math.max(1, ...memberRows.map((r) => r.row.assigned), ...formerRows.map((r) => r.assigned));
  const hasAnyData =
    assignment.unassigned > 0 ||
    assignment.staff.some((s) => s.assigned > 0 || s.assignedInRange > 0 || s.replies > 0);

  const cellClass = "px-3 py-2.5 text-right tabular-nums text-slate-700";

  function renderStats(row: StatsStaffRow) {
    const respondedLabel =
      row.assignedInRange > 0
        ? `${row.responded}/${row.assignedInRange} (${Math.round((row.responded / row.assignedInRange) * 100)}%)`
        : "—";
    return (
      <>
        <td className={cellClass}>
          <div>{row.assigned.toLocaleString("vi-VN")}</div>
          <div className="ml-auto mt-1 h-1 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(row.assigned / maxAssigned) * 100}%` }}
            />
          </div>
        </td>
        <td className={cn(cellClass, row.unread > 0 && "font-semibold text-rose-600")}>
          {row.unread.toLocaleString("vi-VN")}
        </td>
        <td className={cellClass}>{row.assignedInRange.toLocaleString("vi-VN")}</td>
        <td className={cellClass}>{respondedLabel}</td>
        <td className={cellClass}>{formatDuration(row.avgResponseSeconds)}</td>
        <td className={cellClass}>{row.replies.toLocaleString("vi-VN")}</td>
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 md:p-5 print:break-inside-avoid">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Phân công hội thoại</h2>

      <div
        className={cn(
          "mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3.5 py-2.5 text-sm",
          assignment.unassigned > 0 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"
        )}
      >
        <span className="font-semibold">
          {assignment.unassigned > 0
            ? `${assignment.unassigned.toLocaleString("vi-VN")} hội thoại chưa phân công`
            : "Không còn hội thoại nào chưa phân công"}
        </span>
        {assignment.unassigned > 0 && (
          <span className="text-xs">
            {assignment.unassignedUnread.toLocaleString("vi-VN")} chưa đọc · mở Livechat, tab &quot;Chưa phân
            công&quot; để xử lý
          </span>
        )}
      </div>

      {!hasAnyData ? (
        <p className="py-8 text-center text-sm text-slate-400">
          Chưa có hội thoại nào được phân công.{" "}
          {canSeeTeam && (
            <Link href="/settings/rotation" className="font-medium text-primary hover:underline">
              Bật chế độ xoay vòng
            </Link>
          )}
        </p>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                <th className="px-3 py-2 text-left">Nhân viên</th>
                <th className="px-3 py-2 text-right" title="Số hội thoại đang phụ trách hiện tại">
                  Đang phụ trách
                </th>
                <th className="px-3 py-2 text-right" title="Trong số đang phụ trách, bao nhiêu chưa đọc">
                  Chưa đọc
                </th>
                <th className="px-3 py-2 text-right" title="Số hội thoại được giao trong kỳ đang xem">
                  Được giao (kỳ)
                </th>
                <th
                  className="px-3 py-2 text-right"
                  title="Hội thoại được giao trong kỳ mà chính người đó đã trả lời"
                >
                  Đã phản hồi
                </th>
                <th
                  className="px-3 py-2 text-right"
                  title="Trung bình từ lúc được giao tới lúc người đó trả lời (không tính bot)"
                >
                  Phản hồi TB
                </th>
                <th
                  className="px-3 py-2 text-right"
                  title="Số tin đã gửi trong kỳ (chỉ tính tin gửi qua web này)"
                >
                  Tin đã gửi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {memberRows.map(({ member, row }) => (
                <tr key={member.id}>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <MemberAvatar member={member.user} />
                      <span className="truncate font-medium text-slate-800">{member.user.name}</span>
                      {member.user.id === myUserId && <span className="text-xs text-slate-400">(tôi)</span>}
                    </span>
                  </td>
                  {renderStats(row)}
                </tr>
              ))}
              {formerRows.map((row) => (
                <tr key={row.userId}>
                  <td className="px-3 py-2.5 italic text-slate-400">Nhân viên cũ</td>
                  {renderStats(row)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        &quot;Được giao (kỳ)&quot; tính theo lần giao gần nhất của hội thoại. &quot;Phản hồi TB&quot; chỉ tính tin người
        thật gửi qua web này — tin bot hoặc tin trả lời thẳng trên app Facebook/Zalo gốc không biết là ai nên không
        tính.
      </p>
    </div>
  );
}
