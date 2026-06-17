import type { Checkin } from "../types";

export const initialCheckins: Checkin[] = [
  { id: "ck001", loanId: "ln001", parentId: "pt001", bookId: "bk001", checkinDate: "2026-05-02", photoUrl: "https://picsum.photos/seed/ck1/400/300", notes: "第一次阅读，宝宝很喜欢", durationMinutes: 25, createdAt: "2026-05-02" },
  { id: "ck002", loanId: "ln001", parentId: "pt001", bookId: "bk001", checkinDate: "2026-05-04", photoUrl: "https://picsum.photos/seed/ck2/400/300", notes: "反复读了好几遍", durationMinutes: 35, createdAt: "2026-05-04" },
  { id: "ck003", loanId: "ln001", parentId: "pt001", bookId: "bk001", checkinDate: "2026-05-07", photoUrl: "https://picsum.photos/seed/ck3/400/300", notes: "和爸爸一起共读", durationMinutes: 30, createdAt: "2026-05-07" },
  { id: "ck004", loanId: "ln002", parentId: "pt002", bookId: "bk002", checkinDate: "2026-05-05", photoUrl: "https://picsum.photos/seed/ck4/400/300", notes: "毛毛虫洞洞很有趣", durationMinutes: 20, createdAt: "2026-05-05" },
  { id: "ck005", loanId: "ln002", parentId: "pt002", bookId: "bk002", checkinDate: "2026-05-10", photoUrl: "https://picsum.photos/seed/ck5/400/300", notes: "学习数数", durationMinutes: 28, createdAt: "2026-05-10" },
  { id: "ck006", loanId: "ln003", parentId: "pt003", bookId: "bk003", checkinDate: "2026-04-22", photoUrl: "https://picsum.photos/seed/ck6/400/300", notes: "宝宝看得很入神", durationMinutes: 18, createdAt: "2026-04-22" },
  { id: "ck007", loanId: "ln003", parentId: "pt003", bookId: "bk003", checkinDate: "2026-04-28", photoUrl: "https://picsum.photos/seed/ck7/400/300", notes: "自己翻页了", durationMinutes: 22, createdAt: "2026-04-28" },
  { id: "ck008", loanId: "ln004", parentId: "pt004", bookId: "bk004", checkinDate: "2026-05-08", photoUrl: "https://picsum.photos/seed/ck8/400/300", notes: "说爸爸也是超人", durationMinutes: 32, createdAt: "2026-05-08" },
  { id: "ck009", loanId: "ln005", parentId: "pt005", bookId: "bk005", checkinDate: "2026-04-18", photoUrl: "https://picsum.photos/seed/ck9/400/300", notes: "问了好多为什么", durationMinutes: 40, createdAt: "2026-04-18" },
  { id: "ck010", loanId: "ln005", parentId: "pt005", bookId: "bk005", checkinDate: "2026-04-25", photoUrl: "https://picsum.photos/seed/ck10/400/300", notes: "对太空很感兴趣", durationMinutes: 45, createdAt: "2026-04-25" },
  { id: "ck011", loanId: "ln006", parentId: "pt001", bookId: "bk006", checkinDate: "2026-05-10", photoUrl: "https://picsum.photos/seed/ck11/400/300", notes: "读三字经跟读", durationMinutes: 15, createdAt: "2026-05-10" },
  { id: "ck012", loanId: "ln006", parentId: "pt001", bookId: "bk006", checkinDate: "2026-05-15", photoUrl: "https://picsum.photos/seed/ck12/400/300", notes: "会背几句了", durationMinutes: 20, createdAt: "2026-05-15" },
  { id: "ck013", loanId: "ln007", parentId: "pt002", bookId: "bk007", checkinDate: "2026-05-12", photoUrl: "https://picsum.photos/seed/ck13/400/300", notes: "学习弟子规", durationMinutes: 25, createdAt: "2026-05-12" },
  { id: "ck014", loanId: "ln008", parentId: "pt006", bookId: "bk008", checkinDate: "2026-05-06", photoUrl: "https://picsum.photos/seed/ck14/400/300", notes: "brown bear 英语跟读", durationMinutes: 18, createdAt: "2026-05-06" },
  { id: "ck015", loanId: "ln009", parentId: "pt003", bookId: "bk009", checkinDate: "2026-05-11", photoUrl: "https://picsum.photos/seed/ck15/400/300", notes: "英语绘本阅读", durationMinutes: 30, createdAt: "2026-05-11" },
];

export default initialCheckins;
