import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Plus, Settings as SettingsIcon, Trash2, Pencil, Image as ImageIcon, Users, CalendarDays, Check, Cake, ExternalLink } from "lucide-react";
import { dbGet, dbSet } from "./firebase.js";

// ---------- helpers ----------
const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

const GEN_COLORS = ["#E4586B", "#EF9247", "#DEB23A", "#4FA37A", "#4A87C9", "#9075CE"];
const GEN_KEYS = ["G1", "G2", "G3", "G4", "G5", "G6"];

// 실제 도문디 멤버 로스터 (Gen1~6)
const MEMBER_GEN_MAP = {
  Mark: "G1", Park: "G1", Zee: "G1", Max: "G1", Poppy: "G1", Tommy: "G1", Jimmy: "G1",
  Net: "G2", Jamessu: "G2", Yim: "G2", Tutor: "G2", Nunew: "G2", Nat: "G2",
  Tle: "G3", Keng: "G3", Firstone: "G3", Latte: "G3", Namping: "G3", Thomas: "G3", Kong: "G3", Gems: "G3", Teetee: "G3",
  Kim: "G4", JJ: "G4", Ohm: "G4", Auau: "G4", Por: "G4", Save: "G4", Ryujin: "G4", Patji: "G4",
  Porsche: "G5", Phupha: "G5", Copper: "G5", Pung: "G5", Otto: "G5", North: "G5", Fifa: "G5", Wave: "G5", Pete: "G5",
  Ton: "G6", Few: "G6", Thee: "G6", Teddy: "G6", Reeonn: "G6", Nan: "G6", Nick: "G6",
};
const defaultMemberList = () => Object.keys(MEMBER_GEN_MAP);

// 멤버 생일 (MM-DD, 연도 무시하고 매년 반복)
const DEFAULT_BIRTHDAYS = {
  // Gen1
  Mark: "03-09",
  Park: "08-23",
  Zee: "09-10",
  Max: "10-25",
  Poppy: "03-26",
  Tommy: "09-29",
  Jimmy: "02-18",
  // Gen2
  Net: "07-08",
  Jamessu: "02-11",
  Yim: "06-18",
  Tutor: "09-04",
  Nunew: "07-25",
  Nat: "08-08",
  // Gen3
  Tle: "09-13",
  Keng: "08-19",
  Firstone: "08-01",
  Latte: "09-30",
  Namping: "02-17",
  Thomas: "04-09",
  Kong: "12-18",
  Gems: "01-02",
  Teetee: "03-29",
  // Gen4
  Kim: "10-01",
  JJ: "06-24",
  Ohm: "04-09",
  Auau: "03-08",
  Por: "10-17",
  Save: "06-27",
  Ryujin: "01-10",
  Patji: "08-12",
  // Gen5
  Porsche: "11-30",
  Phupha: "01-09",
  Copper: "09-16",
  Pung: "06-09",
  Otto: "01-25",
  North: "02-10",
  Fifa: "06-06",
  Wave: "10-29",
  Pete: "03-02",
  // Gen6
  Ton: "12-22",
  Few: "12-08",
  Thee: "08-09",
  Teddy: "03-23",
  Reeonn: "01-22",
  Nan: "03-29",
  Nick: "11-07",
};

// DOMUNDI 2026년 8월 공식 스케줄표 기반 시드 데이터
const DEFAULT_SCHEDULES = [
  { id: "seed-0801-1", title: "DMD SPORTS DAY", date: "2026-08-01", time: "14:30", cps: [], gens: [], members: [], memo: "전체 멤버 참여 · Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0802-1", title: "Dr.Ally Memory of Love with NorthOtto", date: "2026-08-02", time: "17:00", cps: ["cp13"], gens: ["G5"], members: ["North", "Otto"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0802-2", title: "FirstOne Fan Gathering (Happy FirstOne Day)", date: "2026-08-02", time: "17:00", cps: [], gens: ["G3"], members: ["Firstone"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0802-3", title: "MOSCHINO Toy 2 Gummy Yummy in Bangkok!", date: "2026-08-02", time: "18:30", cps: ["cp9"], gens: ["G3", "G4"], members: ["Teetee", "Por"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0802-4", title: "ที่สามของเธอ (Your Third) Series EP.2", date: "2026-08-03", time: "00:30", cps: [], gens: [], members: [], memo: "채널 GMM25 00:30 방영 / iQIYI·iQ.com 01:30 무편집본 스트리밍 (한국시간)", imageUrl: "", country: "태국" },
  { id: "seed-0803-1", title: "TAOKAENOI LIVE", date: "2026-08-03", time: "21:00", cps: ["cp9"], gens: ["G3", "G4"], members: ["Teetee", "Por"], memo: "Tmall, Douyin: Taokaenoi老板仔 · Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0804-1", title: "The Future of Next Generation Skin", date: "2026-08-04", time: "20:25", cps: ["cp3"], gens: ["G2"], members: ["Tutor", "Yim"], memo: "장소: Dusit Central Park", imageUrl: "", country: "태국" },
  { id: "seed-0804-2", title: "Garnier 15분 완성 촉촉피부 with TeeTee-Por", date: "2026-08-04", time: "21:00", cps: ["cp9"], gens: ["G3", "G4"], members: ["Teetee", "Por"], memo: "TikTok: GarnierThailand · Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0805-1", title: "FINO The First Drop with TeeTee-Por", date: "2026-08-05", time: "19:30", cps: ["cp9"], gens: ["G3", "G4"], members: ["Teetee", "Por"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0806-1", title: 'Behind the Scenes "TutorYim" (LABX Skin)', date: "2026-08-06", time: "22:00", cps: ["cp3"], gens: ["G2"], members: ["Tutor", "Yim"], memo: "TikTok: LABX SKIN · Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0807-1", title: "Sweet Bloom with TleFirstone", date: "2026-08-07", time: "18:00", cps: ["cp6"], gens: ["G3"], members: ["Tle", "Firstone"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0807-2", title: "Domundi Day in the USA 2", date: "2026-08-08", time: "02:30", cps: ["cp5", "cp9"], gens: ["G3", "G4"], members: ["Thomas", "Kong", "Teetee", "Por"], memo: "미국 동부시간 8/7 1PM 기준 · 한국시간 8/8 02:30 · Private Event", imageUrl: "", country: "미국" },
  { id: "seed-0808-1", title: "Fansign in China", date: "2026-08-08", time: "", cps: ["cp10"], gens: ["G4"], members: ["Auau", "Save"], memo: "미확정(TBC) · Private Event", imageUrl: "", country: "중국" },
  { id: "seed-0808-2", title: "First Date with RyuJin & PatJi", date: "2026-08-08", time: "", cps: ["cp11"], gens: ["G4"], members: ["Ryujin", "Patji"], memo: "미확정(TBC) · Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0808-3", title: "The Goody", date: "2026-08-08", time: "", cps: [], gens: ["G5", "G6"], members: ["Pete", "Reeonn"], memo: "미확정 · 장소: The Hill Zone, Central Northville · 근처에서 응원 가능", imageUrl: "", country: "태국" },
  { id: "seed-0808-4", title: "Zee Pruk x MOEV", date: "2026-08-08", time: "12:00", cps: [], gens: ["G1"], members: ["Zee"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0808-5", title: "Mela: A Cozy Day with JJ", date: "2026-08-08", time: "14:00", cps: [], gens: ["G4"], members: ["JJ"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0808-6", title: "Meet & Glow with KengNamping (RISEBYNUR Fansign)", date: "2026-08-08", time: "15:30", cps: ["cp4"], gens: ["G3"], members: ["Keng", "Namping"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0808-7", title: "8.8 Monday Moist x NorthOtto", date: "2026-08-08", time: "16:00", cps: ["cp13"], gens: ["G5"], members: ["North", "Otto"], memo: "TikTok: mondaymoist · Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0808-8", title: "Weibo Gala Thailand", date: "2026-08-08", time: "20:00", cps: ["cp3", "cp6"], gens: ["G2", "G3"], members: ["Jamessu", "Nunew", "Tutor", "Yim", "Tle", "Firstone"], memo: "Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0808-9", title: "8.8 Monday Moist x Copper Fifa", date: "2026-08-08", time: "21:00", cps: ["cp12"], gens: ["G5"], members: ["Copper", "Fifa"], memo: "TikTok: mondaymoist · Private Event", imageUrl: "", country: "태국" },
  { id: "seed-0808-10", title: 'Shopee Live Exclusive Fan Benefits x "Thee-Wave"', date: "2026-08-08", time: "21:30", cps: [], gens: ["G5", "G6"], members: ["Thee", "Wave"], memo: "Shopee · Private Event", imageUrl: "", country: "태국" },
];

const CP_NAMES = [
  "MaxNat", "ZeeNunew", "TutorYim", "KengNamping", "ThomasKong", "TleFirstone", "NetJJ",
  "LatteKim", "TeeteePor", "AuauSave", "RyujinPatji", "CopperFifa", "NorthOtto",
];

// 지정된 파스텔 팔레트 (순서: MaxNat → NorthOtto) — 원본 이미지에서 픽셀 추출
const CP_COLORS = [
  "#F7A4B8", "#F38A83", "#EE544D", "#F57E43", "#F9BE51", "#FDD443", "#9EC793",
  "#3B9D6A", "#0C77AF", "#16A6CA", "#8FA5D0", "#6D6685", "#C8B0E8",
];

const defaultCPList = () =>
  CP_NAMES.map((name, i) => ({
    id: `cp${i + 1}`,
    name,
    color: CP_COLORS[i],
  }));

// CP별 실제 멤버 구성 (cp{n} -> [멤버1, 멤버2]) — CP 선택 시 멤버/Gen 자동 태깅용
const CP_MEMBERS = {
  cp1: ["Max", "Nat"], cp2: ["Zee", "Nunew"], cp3: ["Tutor", "Yim"], cp4: ["Keng", "Namping"],
  cp5: ["Thomas", "Kong"], cp6: ["Tle", "Firstone"], cp7: ["Net", "JJ"], cp8: ["Latte", "Kim"],
  cp9: ["Teetee", "Por"], cp10: ["Auau", "Save"], cp11: ["Ryujin", "Patji"], cp12: ["Copper", "Fifa"],
  cp13: ["North", "Otto"],
};

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = toKey(new Date());

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

// ---------- storage ----------
// schedules & settings live in Firebase Realtime Database (shared, everyone sees them).
// editor-unlock is PERSONAL (kept in this browser's localStorage).
async function loadStorage() {
  let schedules = null;
  let settings = { cpList: defaultCPList(), memberList: defaultMemberList(), pin: "", cloudName: "", uploadPreset: "", birthdays: DEFAULT_BIRTHDAYS };
  let unlocked = false;
  try {
    const s = await dbGet("schedules");
    if (s) schedules = s;
  } catch (e) {
    // key not found yet, fine
  }
  if (schedules === null) schedules = DEFAULT_SCHEDULES;
  try {
    const s = await dbGet("settings");
    if (s) settings = { ...settings, ...s };
  } catch (e) {
    // key not found yet, fine
  }
  try {
    unlocked = localStorage.getItem("domundi-editor-unlocked") === "true";
  } catch (e) {
    // localStorage unavailable, fine
  }
  return { schedules, settings, unlocked };
}

async function saveSchedules(schedules) {
  try {
    await dbSet("schedules", schedules);
  } catch (e) {
    console.error("저장 실패", e);
  }
}
async function saveSettings(settings) {
  try {
    await dbSet("settings", settings);
  } catch (e) {
    console.error("저장 실패", e);
  }
}
async function saveUnlocked(value) {
  try {
    localStorage.setItem("domundi-editor-unlocked", value ? "true" : "false");
  } catch (e) {
    console.error("저장 실패", e);
  }
}

// ---------- small UI atoms ----------
function TicketChip({ color, colors, label, onClick, muted }) {
  const dots = colors && colors.length ? colors : [color];
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 rounded-md text-left overflow-hidden mb-1 transition-opacity px-1 py-1.5"
      style={{ opacity: muted ? 0.35 : 1, background: "transparent" }}
      title={label}
    >
      <span className="flex items-center gap-1 flex-shrink-0">
        {dots.map((c, i) => (
          <span key={i} style={{ width: 9, height: 9, borderRadius: 999, background: c, flexShrink: 0 }} />
        ))}
      </span>
      <span
        className="text-sm leading-snug font-medium flex-1"
        style={{
          fontFamily: "'Inter',sans-serif",
          color: "#111111",
          whiteSpace: "normal",
          wordBreak: "break-word",
        }}
      >
        {label}
      </span>
      <ChevronRight size={16} style={{ color: "#C7C7CC", flexShrink: 0 }} />
    </button>
  );
}

// 아이폰 캘린더 앱 스타일의 일정 목록 아이템 (시간 열 + 컬러바 + 제목/부제)
function DayListItem({ ev, colors, subtitle, onClick }) {
  const barColor = colors && colors[0] ? colors[0] : "#A8A296";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-stretch gap-3 py-2.5 text-left"
      style={{ borderBottom: "1px solid #F0F0F2" }}
    >
      <div className="flex-shrink-0 text-right" style={{ width: 52 }}>
        <p className="text-sm font-medium" style={{ color: "#111111", fontFamily: "'Inter',sans-serif" }}>
          {ev.allDay ? "종일" : (ev.time || "미확정")}
        </p>
      </div>
      <div className="flex flex-shrink-0" style={{ gap: 2 }}>
        {colors.map((c, i) => (
          <span key={i} style={{ width: 3, borderRadius: 999, background: c, alignSelf: "stretch" }} />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold truncate" style={{ color: "#111111", fontFamily: "'Inter',sans-serif" }}>{ev.title}</p>
        {subtitle && <p className="text-sm truncate" style={{ color: "#8E8E93", fontFamily: "'Inter',sans-serif" }}>{subtitle}</p>}
      </div>
      <div className="flex-shrink-0 self-center">
        <ChevronRight size={16} style={{ color: "#C7C7CC" }} />
      </div>
    </button>
  );
}

function Badge({ color, children }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}22`, color: color, border: `1px solid ${color}55` }}
    >
      {children}
    </span>
  );
}

function Modal({ onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(35,38,43,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full ${wide ? "sm:max-w-lg" : "sm:max-w-md"} sm:rounded-xl rounded-t-2xl max-h-[90vh] overflow-y-auto`}
        style={{ border: "1px solid #E5E5EA" }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------- Event Form ----------
function EventForm({ initial, cpList, memberList, cloudName, uploadPreset, onSave, onClose, onDelete }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || todayKey);
  const [time, setTime] = useState(initial?.time || "");
  const [allDay, setAllDay] = useState(initial?.allDay || false);
  const [cps, setCps] = useState(initial?.cps || (initial?.cp ? [initial.cp] : []));
  const [gens, setGens] = useState(initial?.gens || []);
  const [members, setMembers] = useState(initial?.members || []);
  const [memberInput, setMemberInput] = useState("");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [country, setCountry] = useState(initial?.country || "태국");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const canUpload = Boolean(cloudName && uploadPreset);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data?.secure_url) {
        setImageUrl(data.secure_url);
      } else {
        setUploadError(data?.error?.message || "업로드에 실패했어요.");
      }
    } catch (err) {
      setUploadError("업로드 중 오류가 발생했어요. 네트워크나 설정을 확인해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const toggleGen = (g) => setGens((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const nameOptionsForCategory = (cat) => {
    if (cat === "CP")
      return [...cpList].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.id, label: c.name }));
    return Object.keys(MEMBER_GEN_MAP)
      .filter((m) => MEMBER_GEN_MAP[m] === cat)
      .sort((a, b) => a.localeCompare(b))
      .map((m) => ({ value: m, label: m }));
  };
  const [pickCategory, setPickCategory] = useState("CP");
  const [pickValue, setPickValue] = useState(() => nameOptionsForCategory("CP")[0]?.value || "");

  const handleAddPick = () => {
    if (!pickValue) return;
    if (pickCategory === "CP") {
      setCps((prev) => (prev.includes(pickValue) ? prev : [...prev, pickValue]));
      const cpMembers = CP_MEMBERS[pickValue] || [];
      setMembers((prev) => Array.from(new Set([...prev, ...cpMembers])));
      const cpGens = cpMembers.map((m) => MEMBER_GEN_MAP[m]).filter(Boolean);
      setGens((prev) => Array.from(new Set([...prev, ...cpGens])));
    } else {
      if (!members.includes(pickValue)) setMembers((prev) => [...prev, pickValue]);
      setGens((prev) => (prev.includes(pickCategory) ? prev : [...prev, pickCategory]));
    }
  };
  const removeCp = (id) => setCps((prev) => prev.filter((c) => c !== id));

  const addMember = (name) => {
    const n = name.trim();
    if (!n) return;
    if (!members.includes(n)) setMembers([...members, n]);
    const autoGen = MEMBER_GEN_MAP[n];
    if (autoGen) setGens((prev) => (prev.includes(autoGen) ? prev : [...prev, autoGen]));
    setMemberInput("");
  };
  const removeMember = (n) => setMembers(members.filter((m) => m !== n));

  const fallbackTitle = () => {
    const parts = [];
    const cpNames = cps.map((id) => cpList.find((c) => c.id === id)?.name).filter(Boolean);
    if (cpNames.length) parts.push(cpNames.join(" · "));
    if (members.length) parts.push(members.join(", "));
    if (!parts.length && gens.length) parts.push(gens.join("/"));
    return parts.join(" · ");
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    const hasIdentifier = trimmedTitle || members.length || cps.length || gens.length;
    if (!hasIdentifier) {
      setError("제목이나 멤버, CP, Gen 중 최소 하나는 입력해주세요.");
      return;
    }
    if (!date) {
      setError("날짜를 선택해주세요.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id || uid(),
      title: trimmedTitle || fallbackTitle(),
      date,
      time,
      allDay,
      cps,
      gens,
      members,
      memo,
      imageUrl: imageUrl.trim(),
      country: country.trim() || "태국",
    });
  };

  const label = "block text-xs font-medium mb-1";
  const input = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2";

  return (
    <div className="p-5" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "'Inter',sans-serif" }}>
          {initial ? "일정 수정" : "일정 등록"}
        </h2>
        <button onClick={onClose}><X size={20} /></button>
      </div>

      <label className={label} style={{ color: "#8E8E93" }}>제목 (선택 — 비워두면 멤버/CP/Gen으로 자동 표시)</label>
      <input className={input} style={{ borderColor: "#E5E5EA" }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: Your Third 팬미팅 (안 써도 됨)" />

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div>
          <label className={label} style={{ color: "#8E8E93" }}>날짜</label>
          <input type="date" className={input} style={{ borderColor: "#E5E5EA" }} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className={label} style={{ color: "#8E8E93" }}>시간 (선택)</label>
          <input
            type="time"
            className={input}
            style={{ borderColor: "#E5E5EA", opacity: allDay ? 0.4 : 1 }}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={allDay}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 mt-2 text-sm" style={{ color: "#111111" }}>
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => {
            setAllDay(e.target.checked);
            if (e.target.checked) setTime("");
          }}
        />
        종일
      </label>

      <label className={`${label} mt-3`} style={{ color: "#8E8E93" }}>국가 (기본값: 태국)</label>
      <input className={input} style={{ borderColor: "#E5E5EA" }} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="태국" />

      <label className={`${label} mt-3`} style={{ color: "#8E8E93" }}>구분 / 이름 선택</label>
      <div className="flex gap-1.5">
        <select
          className={input}
          style={{ borderColor: "#E5E5EA", flex: "0 0 92px" }}
          value={pickCategory}
          onChange={(e) => {
            const newCat = e.target.value;
            setPickCategory(newCat);
            const opts = nameOptionsForCategory(newCat);
            setPickValue(opts[0]?.value || "");
          }}
        >
          <option value="CP">CP</option>
          {GEN_KEYS.map((g) => (
            <option key={g} value={g}>GEN{g.slice(1)}</option>
          ))}
        </select>
        <select className={input} style={{ borderColor: "#E5E5EA" }} value={pickValue} onChange={(e) => setPickValue(e.target.value)}>
          {nameOptionsForCategory(pickCategory).length === 0 && <option value="">항목 없음</option>}
          {nameOptionsForCategory(pickCategory).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button onClick={handleAddPick} className="px-3 rounded-md text-sm flex-shrink-0" style={{ background: "#111111", color: "#fff" }}>추가</button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {cps.map((id) => {
          const c = cpList.find((c) => c.id === id);
          if (!c) return null;
          return (
            <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${c.color}33`, color: "#111111", border: `1px solid ${c.color}` }}>
              {c.name}
              <X size={11} className="cursor-pointer" onClick={() => removeCp(id)} />
            </span>
          );
        })}
        {members.map((m) => (
          <span key={m} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "#F0F0F2", color: "#666666" }}>
            {m}{MEMBER_GEN_MAP[m] ? ` · ${MEMBER_GEN_MAP[m]}` : ""} <X size={11} className="cursor-pointer" onClick={() => removeMember(m)} />
          </span>
        ))}
      </div>

      <label className={`${label} mt-3`} style={{ color: "#8E8E93" }}>이미지</label>
      {canUpload && (
        <div className="mb-1.5">
          <label
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
            style={{ background: "#111111", color: "#fff" }}
          >
            <ImageIcon size={14} /> {uploading ? "업로드 중..." : "사진첩에서 선택"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploading} />
          </label>
          {uploadError && <p className="text-xs mt-1" style={{ color: "#B5495B" }}>{uploadError}</p>}
        </div>
      )}
      <input
        className={input}
        style={{ borderColor: "#E5E5EA" }}
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder={canUpload ? "또는 이미지 URL 직접 입력" : "https://... (설정에서 업로드 연동 가능)"}
      />
      {imageUrl && (
        <img src={imageUrl} alt="" className="mt-2 rounded-md w-full max-h-40 object-cover" onError={(e) => (e.target.style.display = "none")} />
      )}

      <label className={`${label} mt-3`} style={{ color: "#8E8E93" }}>메모</label>
      <textarea className={input} style={{ borderColor: "#E5E5EA" }} rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} />

      {error && <p className="text-xs mt-3" style={{ color: "#B5495B" }}>{error}</p>}

      <div className="flex gap-2 mt-3">
        <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-md text-sm font-medium" style={{ background: "#111111", color: "#fff" }}>
          {initial ? "저장" : "등록"}
        </button>
        {initial && (
          <button onClick={() => onDelete(initial.id)} className="px-4 py-2.5 rounded-md text-sm font-medium" style={{ background: "#FBEAEA", color: "#B5495B" }}>
            삭제
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Detail view ----------
function EventDetail({ event, cpList, onEdit, onClose, canEdit }) {
  const cpObjs = (event.cps || []).map((id) => cpList.find((c) => c.id === id)).filter(Boolean);
  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      {event.imageUrl && (
        <img src={event.imageUrl} alt="" className="w-full max-h-52 object-cover sm:rounded-t-xl" onError={(e) => (e.target.style.display = "none")} />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold pr-2" style={{ fontFamily: "'Inter',sans-serif" }}>{event.title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <p className="text-sm mt-1" style={{ color: "#8E8E93", fontFamily: "'Inter',sans-serif" }}>
          {event.date} {event.allDay ? "· 종일" : event.time && `· ${event.time}`}{event.country && ` · ${event.country}`}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {cpObjs.map((c) => <Badge key={c.id} color={c.color}>{c.name}</Badge>)}
          {event.gens?.map((g, i) => (
            <Badge key={g} color={GEN_COLORS[GEN_KEYS.indexOf(g)]}>{g}</Badge>
          ))}
        </div>

        {event.members?.length > 0 && (
          <div className="flex items-start gap-1.5 mt-3 text-sm">
            <Users size={15} className="mt-0.5 flex-shrink-0" style={{ color: "#8E8E93" }} />
            <span style={{ color: "#666666" }}>{event.members.join(", ")}</span>
          </div>
        )}

        {event.memo && <p className="text-sm mt-3 whitespace-pre-wrap" style={{ color: "#4A4A4A" }}>{event.memo}</p>}

        {canEdit && (
          <button onClick={onEdit} className="mt-5 w-full py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-1.5" style={{ background: "#111111", color: "#fff" }}>
            <Pencil size={14} /> 수정하기
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Settings ----------
function SettingsModal({ settings, onSave, onClose }) {
  const [cpList, setCpList] = useState(settings.cpList.map((c) => ({ ...c })));
  const [memberList, setMemberList] = useState([...settings.memberList]);
  const [newMember, setNewMember] = useState("");
  const [cloudName, setCloudName] = useState(settings.cloudName || "");
  const [uploadPreset, setUploadPreset] = useState(settings.uploadPreset || "");
  const [birthdays, setBirthdays] = useState({ ...(settings.birthdays || {}) });
  const [bdayMember, setBdayMember] = useState(memberList[0] || "");
  const [bdayDate, setBdayDate] = useState("2000-01-01");

  const addBirthday = () => {
    if (!bdayMember || !bdayDate) return;
    const md = bdayDate.slice(5); // "MM-DD"
    setBirthdays((prev) => ({ ...prev, [bdayMember]: md }));
  };
  const removeBirthday = (name) => {
    setBirthdays((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const updateCP = (id, field, value) => setCpList((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  const addMember = () => {
    const n = newMember.trim();
    if (n && !memberList.includes(n)) setMemberList([...memberList, n]);
    setNewMember("");
  };

  return (
    <div className="p-5" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "'Inter',sans-serif" }}>설정</h2>
        <button onClick={onClose}><X size={20} /></button>
      </div>

      <h3 className="text-sm font-semibold mb-2">CP 라벨 &amp; 색상 (13팀)</h3>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 mb-4">
        {cpList.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <input type="color" value={c.color} onChange={(e) => updateCP(c.id, "color", e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
            <input
              className="flex-1 border rounded-md px-2 py-1.5 text-sm"
              style={{ borderColor: "#E5E5EA" }}
              value={c.name}
              onChange={(e) => updateCP(c.id, "name", e.target.value)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-2">Gen 색상 (고정, 1~6)</h3>
      <div className="flex gap-1.5 mb-4">
        {GEN_KEYS.map((g, i) => (
          <span key={g} className="w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: GEN_COLORS[i] }}>{g}</span>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-2">멤버 목록 (자동완성용)</h3>
      <div className="flex gap-1.5 mb-2">
        <input
          className="flex-1 border rounded-md px-2 py-1.5 text-sm"
          style={{ borderColor: "#E5E5EA" }}
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
          placeholder="멤버 이름"
        />
        <button onClick={addMember} className="px-3 rounded-md text-sm" style={{ background: "#111111", color: "#fff" }}>추가</button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5 max-h-28 overflow-y-auto">
        {memberList.map((m) => (
          <span key={m} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "#F0F0F2" }}>
            {m} <X size={11} className="cursor-pointer" onClick={() => setMemberList(memberList.filter((x) => x !== m))} />
          </span>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-2">이미지 업로드 연동 (Cloudinary)</h3>
      <p className="text-xs mb-2" style={{ color: "#8E8E93" }}>
        본인 소유의 Cloudinary 계정에서 Cloud name과 Unsigned upload preset을 만든 뒤 여기에 입력하면, 일정 등록 화면에서 사진첩 사진을 바로 업로드할 수 있어요. 비워두면 URL 입력 방식만 사용됩니다.
      </p>
      <label className="block text-xs font-medium mb-1" style={{ color: "#8E8E93" }}>Cloud name</label>
      <input
        className="w-full border rounded-md px-2 py-1.5 text-sm mb-2"
        style={{ borderColor: "#E5E5EA" }}
        value={cloudName}
        onChange={(e) => setCloudName(e.target.value)}
        placeholder="예: my-cloud-name"
      />
      <label className="block text-xs font-medium mb-1" style={{ color: "#8E8E93" }}>Unsigned upload preset</label>
      <input
        className="w-full border rounded-md px-2 py-1.5 text-sm mb-5"
        style={{ borderColor: "#E5E5EA" }}
        value={uploadPreset}
        onChange={(e) => setUploadPreset(e.target.value)}
        placeholder="예: domundi_unsigned"
      />

      <h3 className="text-sm font-semibold mb-2">멤버 생일 (🎂 캘린더 표시)</h3>
      <div className="flex gap-1.5 mb-2">
        <select className="border rounded-md px-2 py-1.5 text-sm flex-1 min-w-0" style={{ borderColor: "#E5E5EA" }} value={bdayMember} onChange={(e) => setBdayMember(e.target.value)}>
          {memberList.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="date" className="border rounded-md px-2 py-1.5 text-sm" style={{ borderColor: "#E5E5EA" }} value={bdayDate} onChange={(e) => setBdayDate(e.target.value)} />
        <button onClick={addBirthday} className="px-3 rounded-md text-sm flex-shrink-0" style={{ background: "#111111", color: "#fff" }}>추가</button>
      </div>
      <p className="text-xs mb-2" style={{ color: "#8E8E93" }}>연도는 무시되고 월·일만 매년 반복 적용돼요.</p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {Object.entries(birthdays).map(([name, md]) => (
          <span key={name} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "#F0F0F2" }}>
            🎂 {name} ({md}) <X size={11} className="cursor-pointer" onClick={() => removeBirthday(name)} />
          </span>
        ))}
      </div>

      <button
        onClick={() => onSave({ cpList, memberList, cloudName: cloudName.trim(), uploadPreset: uploadPreset.trim(), birthdays })}
        className="w-full py-2.5 rounded-md text-sm font-medium"
        style={{ background: "#111111", color: "#fff" }}
      >
        저장
      </button>
    </div>
  );
}

// ---------- PIN gate ----------
function PinModal({ mode, onSubmit, onClose, error }) {
  // mode: "setup" (no pin exists yet) | "unlock" (pin exists, need to enter it)
  const [pin, setPin] = useState("");
  return (
    <div className="p-5" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "'Inter',sans-serif" }}>
          {mode === "setup" ? "관리자 PIN 설정" : "PIN 입력"}
        </h2>
        <button onClick={onClose}><X size={20} /></button>
      </div>
      <p className="text-sm mb-3" style={{ color: "#8E8E93" }}>
        {mode === "setup"
          ? "이 캘린더는 공유되지만, 등록·수정·설정 변경은 PIN을 아는 사람만 할 수 있어요. 처음이니 PIN을 하나 정해주세요."
          : "편집하려면 관리자 PIN을 입력하세요. 보기만 하려면 그냥 닫으셔도 됩니다."}
      </p>
      <input
        type="password"
        inputMode="numeric"
        className="w-full border rounded-md px-3 py-2 text-sm"
        style={{ borderColor: "#E5E5EA" }}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && pin) onSubmit(pin); }}
        placeholder="PIN"
        autoFocus
      />
      {error && <p className="text-xs mt-1.5" style={{ color: "#B5495B" }}>{error}</p>}
      <button
        onClick={() => pin && onSubmit(pin)}
        className="mt-4 w-full py-2.5 rounded-md text-sm font-medium"
        style={{ background: "#111111", color: "#fff" }}
      >
        {mode === "setup" ? "설정하기" : "확인"}
      </button>
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [settings, setSettings] = useState({ cpList: defaultCPList(), memberList: defaultMemberList(), cloudName: "", uploadPreset: "", birthdays: DEFAULT_BIRTHDAYS });
  const [cursor, setCursor] = useState(new Date());
  const [dayKey, setDayKey] = useState(null); // day panel
  const [detailEvent, setDetailEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(undefined); // undefined = closed, null = new, obj = edit
  const [showSettings, setShowSettings] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL"); // "ALL" | "CP" | "G1".."G6"
  const [filterValue, setFilterValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinModal, setPinModal] = useState(null); // null | "setup" | "unlock"
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    loadStorage().then(({ schedules, settings, unlocked }) => {
      setSchedules(schedules);
      setSettings(settings);
      setUnlocked(unlocked);
      setLoading(false);
    });
  }, []);

  const handleGearClick = () => {
    setPinError("");
    if (unlocked) { setShowSettings(true); return; }
    setPinModal(!settings.pin ? "setup" : "unlock");
  };

  const handlePinSubmit = (pin) => {
    if (pinModal === "setup") {
      const nextSettings = { ...settings, pin };
      persistSettings(nextSettings);
      setUnlocked(true);
      saveUnlocked(true);
      setPinModal(null);
      setShowSettings(true);
    } else {
      if (pin === settings.pin) {
        setUnlocked(true);
        saveUnlocked(true);
        setPinModal(null);
        setShowSettings(true);
      } else {
        setPinError("PIN이 일치하지 않습니다.");
      }
    }
  };

  const persistSchedules = useCallback((next) => {
    setSchedules(next);
    saveSchedules(next);
  }, []);
  const persistSettings = useCallback((next) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const gridDays = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const ev of schedules) {
      (map[ev.date] ||= []).push(ev);
    }
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => {
        const rank = (ev) => (ev.allDay ? 0 : ev.time ? 1 : 2);
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        if (ra === 1) return a.time.localeCompare(b.time);
        return 0;
      })
    );
    return map;
  }, [schedules]);

  const eventMatchesFilter = (ev) => {
    if (filterCategory === "ALL") return true;
    if (filterCategory === "CP") return ev.cps?.includes(filterValue);
    if (filterValue === "__ALL__") return ev.gens?.includes(filterCategory);
    return ev.members?.includes(filterValue);
  };

  const colorForEvent = (ev) => {
    if (ev.cps?.length) {
      const c = settings.cpList.find((c) => c.id === ev.cps[0]);
      if (c) return c.color;
    }
    return "#A8A296";
  };

  const colorsForEvent = (ev) => {
    if (ev.cps?.length) {
      const colors = ev.cps.map((id) => settings.cpList.find((c) => c.id === id)?.color).filter(Boolean);
      if (colors.length) return colors;
    }
    return ["#A8A296"];
  };

  // 캘린더 칩에는 일정 제목 대신 CP명 > 멤버 이름 > Gen 순으로 표시
  const labelForEvent = (ev) => {
    const parts = [];
    const cpNames = (ev.cps || []).map((id) => settings.cpList.find((c) => c.id === id)?.name).filter(Boolean);
    if (cpNames.length) {
      parts.push(cpNames.join(" · "));
    } else if (ev.members?.length) {
      parts.push(ev.members.join(", "));
    } else if (ev.gens?.length) {
      parts.push(ev.gens.join("/"));
    }
    return parts.length ? parts.join(" · ") : ev.title;
  };

  // 제목과 별개로 CP/멤버/Gen 정보만 부제로 반환 (없으면 빈 문자열)
  const subtitleForEvent = (ev) => {
    const cpNames = (ev.cps || []).map((id) => settings.cpList.find((c) => c.id === id)?.name).filter(Boolean);
    if (cpNames.length) return cpNames.join(" · ");
    if (ev.members?.length) return ev.members.join(", ");
    if (ev.gens?.length) return ev.gens.join("/");
    return "";
  };

  const handleSaveEvent = (ev) => {
    const exists = schedules.some((s) => s.id === ev.id);
    const next = exists ? schedules.map((s) => (s.id === ev.id ? ev : s)) : [...schedules, ev];
    persistSchedules(next);
    if (ev.members?.length) {
      const newNames = ev.members.filter((m) => !settings.memberList.includes(m));
      if (newNames.length) persistSettings({ ...settings, memberList: [...settings.memberList, ...newNames] });
    }
    setEditingEvent(undefined);
    setDetailEvent(null);
  };
  const handleDeleteEvent = (id) => {
    persistSchedules(schedules.filter((s) => s.id !== id));
    setEditingEvent(undefined);
    setDetailEvent(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F1F1F1" }}>불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#F1F1F1", fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      <div className="max-w-3xl mx-auto px-3 pt-4 pb-24 flex flex-col gap-3">
        {/* header row */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} style={{ color: "#111111" }} />
            <h1 className="text-xl font-bold" style={{ color: "#111111" }}>Domundi 스케줄</h1>
          </div>
          <button onClick={handleGearClick} style={{ color: unlocked ? "#111111" : "#8E8E93" }}><SettingsIcon size={20} /></button>
        </div>

        {/* Blog link - medium emphasis */}
        <a
          href="https://blog.naver.com/boyslog"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl px-4 py-2.5 flex items-center justify-between"
          style={{ background: "#EEF0FC", textDecoration: "none" }}
        >
          <span className="text-sm font-medium" style={{ color: "#111111" }}>DMD Late Check-In 블로그</span>
          <ExternalLink size={14} style={{ color: "#5C6BAA" }} />
        </a>

        {/* Today summary widget */}
        {(() => {
          const todays = (eventsByDay[todayKey] || []);
          return (
            <div className="rounded-3xl p-5" style={{ background: "#fff" }}>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold" style={{ color: "#111111" }}>오늘</span>
                <span className="text-sm font-medium" style={{ color: "#8E8E93" }}>{todays.length}개 일정</span>
              </div>
              {todays.length === 0 ? (
                <p className="text-sm mt-2" style={{ color: "#8E8E93" }}>오늘은 등록된 일정이 없어요.</p>
              ) : (
                <div className="mt-3 overflow-y-auto" style={{ maxHeight: 220 }}>
                  {todays.map((ev) => (
                    <DayListItem
                      key={ev.id}
                      ev={ev}
                      colors={colorsForEvent(ev)}
                      subtitle={subtitleForEvent(ev)}
                      onClick={() => setDetailEvent(ev)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* navigation + filter widget */}
        <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
          <div className="flex items-center justify-between">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1.5 rounded-full" style={{ background: "#F0F0F2" }}><ChevronLeft size={16} /></button>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold" style={{ color: "#111111" }}>{year}. {MONTH_NAMES[month]}</span>
              <button onClick={() => setCursor(new Date())} className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#F0F0F2", color: "#8E8E93" }}>오늘</button>
            </div>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1.5 rounded-full" style={{ background: "#F0F0F2" }}><ChevronRight size={16} /></button>
          </div>

          <div className="flex gap-1.5 mt-3">
            <select
              className="border-0 rounded-lg px-2 py-1.5 text-xs font-medium"
              style={{ background: "#F0F0F2", flex: "0 0 96px" }}
              value={filterCategory}
              onChange={(e) => {
                const cat = e.target.value;
                setFilterCategory(cat);
                if (cat === "ALL") setFilterValue("");
                else if (cat === "CP") setFilterValue(settings.cpList[0]?.id || "");
                else setFilterValue("__ALL__");
              }}
            >
              <option value="ALL">전체보기</option>
              <option value="CP">CP</option>
              {GEN_KEYS.map((g) => (
                <option key={g} value={g}>GEN{g.slice(1)}</option>
              ))}
            </select>

            {filterCategory !== "ALL" && (
              <select
                className="border-0 rounded-lg px-2 py-1.5 text-xs font-medium flex-1 min-w-0"
                style={{ background: "#F0F0F2" }}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                {filterCategory === "CP"
                  ? [...settings.cpList].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                  : [
                      <option key="__ALL__" value="__ALL__">전체 인원</option>,
                      ...Object.keys(MEMBER_GEN_MAP)
                        .filter((m) => MEMBER_GEN_MAP[m] === filterCategory)
                        .sort((a, b) => a.localeCompare(b))
                        .map((m) => <option key={m} value={m}>{m}</option>),
                    ]}
              </select>
            )}

            {filterCategory !== "ALL" && (
              <button
                onClick={() => {
                  setFilterCategory("ALL");
                  setFilterValue("");
                }}
                className="flex-shrink-0 flex items-center justify-center rounded-lg"
                style={{ width: 30, height: 30, background: "#F0F0F2" }}
                title="필터 초기화"
              >
                <X size={14} style={{ color: "#8E8E93" }} />
              </button>
            )}
          </div>
        </div>

        {/* Calendar widget */}
        <div className="rounded-3xl p-3" style={{ background: "#fff" }}>
          <div className="grid grid-cols-7 text-center text-sm font-semibold py-1" style={{ color: "#8E8E93" }}>
            {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((d, i) => {
              const key = toKey(d);
              const inMonth = d.getMonth() === month;
              const isToday = key === todayKey;
              const dayEvents = (eventsByDay[key] || []);
              const visibleEvents = dayEvents.filter(eventMatchesFilter);
              const dayColors = Array.from(new Set(visibleEvents.map(colorForEvent)));
              const monthDay = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
              const birthdayNames = Object.entries(settings.birthdays || {})
                .filter(([, md]) => md === monthDay)
                .map(([name]) => name);
              return (
                <div
                  key={i}
                  onClick={() => setDayKey(key)}
                  title={birthdayNames.length > 0 ? `${birthdayNames.join(", ")} 생일` : undefined}
                  className="rounded-xl p-1.5 h-[64px] sm:h-[74px] cursor-pointer relative flex flex-col overflow-hidden"
                  style={{
                    background: birthdayNames.length > 0 ? "#9DA9EBCC" : "#F8F8F8",
                    opacity: inMonth ? 1 : 0.35,
                    minHeight: 0,
                  }}
                >
                  <div className="flex items-center">
                    <span
                      className="inline-flex items-center justify-center text-sm font-bold"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        background: isToday ? "#111111" : "transparent",
                        color: isToday ? "#fff" : "#111111",
                      }}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  {visibleEvents.length > 0 && (
                    <span
                      className="absolute bottom-1 right-1.5 text-xs font-normal"
                      style={{ color: birthdayNames.length > 0 ? "#fff" : "#8E8E93" }}
                    >
                      +{visibleEvents.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* floating add button - editors only */}
      {unlocked && (
        <button
          onClick={() => setEditingEvent(null)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "#111111", color: "#fff" }}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Day panel */}
      {dayKey && (
        <Modal onClose={() => setDayKey(null)}>
          <div className="p-5" style={{ fontFamily: "'Inter',sans-serif" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "'Inter',sans-serif" }}>{dayKey}</h2>
              <button onClick={() => setDayKey(null)}><X size={20} /></button>
            </div>
            {(() => {
              const [, mm, dd] = dayKey.split("-");
              const names = Object.entries(settings.birthdays || {}).filter(([, md]) => md === `${mm}-${dd}`).map(([n]) => n);
              return names.length > 0 ? (
                <p className="text-base font-medium mb-3 flex items-center gap-2"><Cake size={19} style={{ color: "#9DA9EB" }} /> {names.join(", ")} 생일</p>
              ) : null;
            })()}
            <div>
              {(eventsByDay[dayKey] || []).filter(eventMatchesFilter).length === 0 && (
                <p className="text-sm" style={{ color: "#8E8E93" }}>등록된 일정이 없습니다.</p>
              )}
              {(eventsByDay[dayKey] || []).filter(eventMatchesFilter).map((ev) => (
                <DayListItem
                  key={ev.id}
                  ev={ev}
                  colors={colorsForEvent(ev)}
                  subtitle={subtitleForEvent(ev)}
                  onClick={() => setDetailEvent(ev)}
                />
              ))}
            </div>
            {unlocked && (
              <button
                onClick={() => setEditingEvent({ date: dayKey })}
                className="mt-4 w-full py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-1.5"
                style={{ background: "#111111", color: "#fff" }}
              >
                <Plus size={14} /> 이 날짜에 일정 추가
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Detail modal */}
      {detailEvent && (
        <Modal onClose={() => setDetailEvent(null)} wide>
          <EventDetail
            event={detailEvent}
            cpList={settings.cpList}
            canEdit={unlocked}
            onEdit={() => { setEditingEvent(detailEvent); setDetailEvent(null); }}
            onClose={() => setDetailEvent(null)}
          />
        </Modal>
      )}

      {/* PIN gate modal */}
      {pinModal && (
        <Modal onClose={() => setPinModal(null)}>
          <PinModal mode={pinModal} error={pinError} onSubmit={handlePinSubmit} onClose={() => setPinModal(null)} />
        </Modal>
      )}

      {/* Add/Edit form - editors only */}
      {unlocked && editingEvent !== undefined && (
        <Modal onClose={() => setEditingEvent(undefined)} wide>
          <EventForm
            initial={editingEvent?.id ? editingEvent : editingEvent?.date ? { date: editingEvent.date } : null}
            cpList={settings.cpList}
            memberList={settings.memberList}
            cloudName={settings.cloudName}
            uploadPreset={settings.uploadPreset}
            onSave={handleSaveEvent}
            onClose={() => setEditingEvent(undefined)}
            onDelete={handleDeleteEvent}
          />
        </Modal>
      )}

      {/* Settings modal - editors only */}
      {unlocked && showSettings && (
        <Modal onClose={() => setShowSettings(false)}>
          <SettingsModal
            settings={settings}
            onSave={(next) => { persistSettings({ ...settings, ...next }); setShowSettings(false); }}
            onClose={() => setShowSettings(false)}
          />
        </Modal>
      )}
    </div>
  );
}
