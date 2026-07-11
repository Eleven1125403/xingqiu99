"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Maximize2, Search, Shuffle, Volume2, VolumeX, X } from "lucide-react";
import { archiveEvents, type ArchiveEvent } from "./archive-data";
import { titleOverrides } from "./title-overrides";

type PlacedEvent = ArchiveEvent & {
  previewX: number;
  previewY: number;
  trackX: number;
  trackY: number;
};

const endingEvent: ArchiveEvent = {
  id: 999999,
  date: "",
  displayDate: "",
  title: "\u672a\u5b8c\u5f85\u7eed",
  shortTitle: "\u672a\u5b8c\u5f85\u7eed",
  category: "ending",
  summary: "\u55e8\u55e8\uff01\u611f\u8c22\u4f60\u770b\u5230\u8fd9\u91cc\uff0c\u91cd\u65b0\u8d70\u4e86\u4e00\u904d\u4ed6\u4eec\u7684\u6765\u65f6\u8def\u3002\n\n\u65f6\u95f4\u5728\u6b64\u6253\u4e86\u4e2a\u7ed3\uff0c\u672a\u6765\u4f1a\u6709\u66f4\u591a\u66f4\u591a\u7684\u6545\u4e8b\u7b49\u7740\u6211\u4eec\u02f6>\u15dc<\u02f6\n\n\u5e0c\u671b\u5728\u4e0b\u4e00\u523b\uff0c\u56de\u5934\u65f6\uff0c\u6211\u4eec\u4f9d\u7136\u5728\u5f7c\u6b64\u8eab\u8fb9\u3002\u8fd9\u6761\u8def\uff0c\u6211\u4eec\u548c\u4ed6\u4eec\u4e00\u8d77\u8d70\u3002\n\n\u795d\u4f60\u73b0\u751f\u6109\u5feb\uff0c\u597d\u4e8b\u82b1\u751f\ud83e\udd5c\n\n\u671f\u5f85\u4ed6\u4eec\uff0c\u4f1a\u6709\u4e00\u4e2a\u98ce\u5149\u660e\u5a9a\u7684\u672a\u6765\u3002",
  tags: ["\u672a\u5b8c\u5f85\u7eed"],
  imageGroups: { qiu: [], xing: [], other: [] },
};

const events = [...archiveEvents, endingEvent];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const encodeAssetPath = (url: string) => url.split("/").map((part, index) => index === 0 ? part : encodeURIComponent(decodeURIComponent(part))).join("/");
const assetUrl = (url: string) => url.startsWith("/") ? `${basePath}${encodeAssetPath(url)}` : url;
const previewAssetPath = (url: string) => url.startsWith("/archive/") ? url.replace(/^\/archive\//, "/archive-preview/").replace(/\.[^.\/]+$/, ".jpg") : url;
const previewAssetUrl = (url: string) => assetUrl(previewAssetPath(url));
const imageKey = (url: string) => decodeURIComponent(url.split("/").pop() || "").replace(/\.[^.]+$/, "").toLowerCase();
const isCommentImage = (url: string | null) => Boolean(url?.includes("/comment/"));



const starField = Array.from({ length: 30 }, (_, index) => ({
  left: (index * 37 + 11) % 100,
  top: (index * 61 + 17) % 100,
  size: 0.7 + ((index * 7) % 18) / 10,
  delay: (index % 16) * 0.16,
  opacity: 0.12 + ((index * 13) % 30) / 100,
}));


function ImageSwitcher({ label, images, comments, onOpen, onCommentOpen }: { label: string; images: string[]; comments?: Record<string, string[]>; onOpen: (image: string) => void; onCommentOpen: (image: string) => void }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const current = images[index % images.length];
  const currentComments = comments?.[imageKey(current)] || [];
  const next = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    setIndex((value) => (value + 1) % images.length);
  };

  return (
    <div className="image-switcher">
      <button className="image-open" onClick={() => onOpen(current)} type="button" aria-label={label + "截图放大"}>
        <img src={previewAssetUrl(current)} alt={label + "截图"} loading="eager" decoding="async" />
      </button>
      <div className="image-actions">
        {images.length > 1 && (
          <button className="image-switcher-label" onClick={next} type="button" aria-label="切换截图">
            {index + 1}/{images.length}，点击可切换
          </button>
        )}
        {currentComments.length > 0 && (
          <button className="comment-button" onClick={() => onCommentOpen(currentComments[0])} type="button" aria-label="查看评论截图">
            点击查看评论
          </button>
        )}
      </div>
    </div>
  );
}

function MemoryImages({ event, onOpen, onCommentOpen }: { event: PlacedEvent; onOpen: (image: string) => void; onCommentOpen: (image: string) => void }) {
  const { qiu, xing, other } = event.imageGroups;
  const hasPair = qiu.length > 0 || xing.length > 0;
  const hasImages = hasPair || other.length > 0;

  if (!hasImages && event.category === "ending") return null;

  if (!hasImages) {
    return (
      <div className="placeholder-shot mt-8">
        <div className="shot-orbit" />
        <span>微博截图 / 活动图片占位</span>
      </div>
    );
  }

  return (
    <div className="memory-images mt-5">
      {hasPair && (
        <div className={"memory-image-pair " + (qiu.length === 0 || xing.length === 0 ? "is-single" : "") }>
          <ImageSwitcher label="xing" images={xing} comments={event.comments} onOpen={onOpen} onCommentOpen={onCommentOpen} />
          <ImageSwitcher label="qiu" images={qiu} comments={event.comments} onOpen={onOpen} onCommentOpen={onCommentOpen} />
        </div>
      )}
      {other.length > 0 && (
        <div className="memory-image-extra">
          {other.map((image) => {
            const currentComments = event.comments?.[imageKey(image)] || [];
            return (
              <div className="image-switcher" key={image}>
                <button className="extra-image-button image-open" type="button" onClick={() => onOpen(image)}>
                  <img src={previewAssetUrl(image)} alt={event.title + "截图"} loading="eager" decoding="async" />
                </button>
                {currentComments.length > 0 && (
                  <div className="image-actions">
                    <button className="comment-button" onClick={() => onCommentOpen(currentComments[0])} type="button" aria-label="查看评论截图">点击查看评论</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const eventShortTitle = (event: ArchiveEvent) => titleOverrides[event.displayDate] || titleOverrides[event.date] || event.shortTitle || "";

const eventLabel = (event: ArchiveEvent) => {
  const title = eventShortTitle(event);
  if (!event.displayDate) return title || event.title;
  return title ? `${event.displayDate} \u00b7 ${title}` : event.displayDate;
};

const eventSearchText = (event: ArchiveEvent) => [event.date, event.displayDate, event.title, eventShortTitle(event), event.category, ...event.tags].filter(Boolean).join(" ").toLowerCase();
const eventTags = (event: ArchiveEvent) => [event.category, ...event.tags].filter(Boolean).map((tag) => tag.toLowerCase());

const eventMatchesQuery = (event: ArchiveEvent, queryText: string) => {
  const normalized = queryText.trim().toLowerCase();
  if (!normalized) return false;
  const searchText = eventSearchText(event);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return event.date.startsWith(normalized) || event.displayDate.startsWith(normalized) || tokens.every((token) => searchText.includes(token));
};

const roundCoord = (value: number) => Math.round(value * 1000) / 1000;

const collectPreloadAssets = () => {
  const archiveImages = events.flatMap((event) => [
    ...event.imageGroups.qiu,
    ...event.imageGroups.xing,
    ...event.imageGroups.other,
    ...Object.values(event.comments || {}).flat(),
  ]);
  return Array.from(new Set(["/constellation-bg.jpg", "/title-handwriting.png", ...archiveImages.map(previewAssetPath)]));
};

const preloadImage = (url: string) => new Promise<void>((resolve) => {
  const image = new Image();
  image.onload = () => resolve();
  image.onerror = () => resolve();
  image.src = assetUrl(url);
});

const placeEvents = (items: ArchiveEvent[]): PlacedEvent[] => {
  const total = Math.max(items.length - 1, 1);
  return items.map((event, index) => {
    const progress = index / total;
    const wave = Math.sin(progress * Math.PI * 7.2) * 52 + Math.sin(progress * Math.PI * 17) * 18;
    const softDrift = Math.cos(progress * Math.PI * 3.5) * 24;
    return {
      ...event,
      previewX: roundCoord(5 + progress * 90),
      previewY: roundCoord(50 + Math.sin(progress * Math.PI * 6.4) * 18 + Math.cos(progress * Math.PI * 13) * 5),
      trackX: roundCoord(140 + index * 112),
      trackY: roundCoord(290 + wave + softDrift),
    };
  });
};

export default function Home() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [focusId, setFocusId] = useState<number | null>(null);
  const [isVoyaging, setIsVoyaging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cameraX, setCameraX] = useState(0);
  const [isTrackDragging, setIsTrackDragging] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [musicBlockedByUser, setMusicBlockedByUser] = useState(false);
  const [searchResults, setSearchResults] = useState<{ query: string; events: PlacedEvent[] } | null>(null);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const archiveRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startCameraX: number; moved: boolean } | null>(null);
  const suppressStarClickRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const placedEvents = useMemo(() => placeEvents(events), []);
  const preloadAssets = useMemo(() => collectPreloadAssets(), []);
  const selected = placedEvents.find((event) => event.id === selectedId);
  const selectedIndex = selected ? placedEvents.findIndex((event) => event.id === selected.id) : -1;
  const trackWidth = Math.max(1800, placedEvents.length * 112 + 280);

  const previewPoints = useMemo(() => placedEvents.map((event) => event.previewX + "," + event.previewY).join(" "), [placedEvents]);
  const trackPoints = useMemo(() => placedEvents.map((event) => event.trackX + "," + event.trackY).join(" "), [placedEvents]);

  const getCameraBounds = () => {
    if (typeof window === "undefined") return { min: 0, max: 0, visibleWidth: trackWidth };
    const panelReserve = window.innerWidth > 980 ? 420 : 0;
    const visibleWidth = Math.max(320, window.innerWidth - panelReserve);
    return { min: Math.min(0, -(trackWidth - visibleWidth + 120)), max: 0, visibleWidth };
  };

  const clampCameraX = (value: number) => {
    const bounds = getCameraBounds();
    return Math.min(bounds.max, Math.max(bounds.min, value));
  };

  const centerCameraOn = (event: PlacedEvent) => {
    if (typeof window === "undefined") return;
    const { visibleWidth } = getCameraBounds();
    setCameraX(clampCameraX(visibleWidth * 0.45 - event.trackX));
  };

  const beginTrackDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isExpanded || event.pointerType === "mouse") return;
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;
    dragStateRef.current = { pointerId: event.pointerId, startX: event.clientX, startCameraX: cameraX, moved: false };
    setIsTrackDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveTrackDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    if (drag.moved) {
      suppressStarClickRef.current = true;
      setCameraX(clampCameraX(drag.startCameraX + delta));
    }
  };

  const endTrackDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    setIsTrackDragging(false);
    window.setTimeout(() => { suppressStarClickRef.current = false; }, 80);
  };

  const nudgeTrack = (direction: -1 | 1) => {
    const { visibleWidth } = getCameraBounds();
    setCameraX((value) => clampCameraX(value - direction * Math.max(280, visibleWidth * 0.55)));
  };
  const focusEvent = (event: PlacedEvent, ceremonial = false) => {
    setSearchResults(null);
    setCommentImage(null);
    setIsExpanded(true);
    setFocusId(event.id);
    centerCameraOn(event);
    archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    if (ceremonial && !reduceMotion) {
      setIsVoyaging(true);
      window.setTimeout(() => setIsVoyaging(false), 1900);
    }
    window.setTimeout(() => setSelectedId(event.id), ceremonial ? 1200 : 320);
  };

  const searchDate = () => {
    const normalized = query.trim();
    if (!normalized) return;
    const lowered = normalized.toLowerCase();
    const matches = placedEvents.filter((event) => eventMatchesQuery(event, normalized));
    if (matches.length === 0) {
      setSelectedId(null);
      setCommentImage(null);
      setSearchResults({ query: normalized, events: [] });
      return;
    }

    const exactDate = matches.find((event) => event.date === normalized || event.displayDate === normalized);
    const exactTitle = matches.find((event) => event.title.toLowerCase() === lowered || eventShortTitle(event).toLowerCase() === lowered);
    const exactTag = matches.some((event) => eventTags(event).includes(lowered));

    if (exactDate) {
      focusEvent(exactDate);
      return;
    }

    if (exactTitle) {
      focusEvent(exactTitle);
      return;
    }

    if (exactTag || matches.length > 1) {
      setSelectedId(null);
      setCommentImage(null);
      setSearchResults({ query: normalized, events: matches });
      return;
    }

    focusEvent(matches[0]);
  };

  const randomMemory = () => {
    const pool = placedEvents.filter((event) => event.id !== selected?.id);
    focusEvent(pool[Math.floor(Math.random() * pool.length)], true);
  };

  const goTo = (direction: -1 | 1) => {
    if (selectedIndex < 0) return;
    const nextIndex = (selectedIndex + direction + placedEvents.length) % placedEvents.length;
    focusEvent(placedEvents[nextIndex]);
  };

  const playMusic = async (force = false) => {
    if (musicBlockedByUser && !force) return;
    const audio = audioRef.current;
    if (!audio || !audio.paused) return;

    try {
      audio.volume = 0.45;
      await audio.play();
      setMusicBlockedByUser(false);
      setIsMusicOn(true);
    } catch {
      setIsMusicOn(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let completed = 0;
    const total = Math.max(preloadAssets.length, 1);
    const queue = [...preloadAssets];
    const workers = Array.from({ length: Math.min(8, queue.length) }, async () => {
      while (queue.length > 0 && !cancelled) {
        const asset = queue.shift();
        if (!asset) continue;
        await preloadImage(asset);
        completed += 1;
        if (!cancelled) setPreloadProgress(Math.round((completed / total) * 100));
      }
    });

    void Promise.all(workers).then(() => {
      if (!cancelled) {
        setPreloadProgress(100);
        window.setTimeout(() => setIsPreloading(false), 520);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [preloadAssets]);

  useEffect(() => {
    if (isPreloading) return;
    const timer = window.setTimeout(() => {
      void playMusic();
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [isPreloading, musicBlockedByUser]);

  const handleFirstInteraction = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(".cover-music-button") || target.closest(".floating-music-button")) return;
    void playMusic();
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setMusicBlockedByUser(true);
      setIsMusicOn(false);
      return;
    }

    setMusicBlockedByUser(false);
    await playMusic(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white selection:bg-fuchsia-200/30" onPointerDownCapture={handleFirstInteraction}>
      <audio ref={audioRef} src={assetUrl("/music/bgm.mp3")} loop preload="auto" playsInline />
      <AnimatePresence>
        {isPreloading && (
          <motion.div
            className="preload-screen"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="preload-inner">
              <p className="preload-kicker">Constellation Archive</p>
              <h2>{"\u6b63\u5728\u70b9\u4eae\u661f\u56fe"}</h2>
              <div className="preload-bar" aria-hidden="true">
                <motion.span animate={{ width: `${preloadProgress}%` }} transition={{ duration: 0.28, ease: "easeOut" }} />
              </div>
              <p className="preload-progress">{preloadProgress}%</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div className="cosmic-bg" style={{ "--constellation-bg": `url("${assetUrl("/constellation-bg.jpg")}")` } as CSSProperties} initial={{ opacity: 0 }} animate={{ opacity: isPreloading ? 0 : 1 }} transition={{ delay: isPreloading ? 0 : 1, duration: 2, ease: "easeOut" }} />
      <motion.div className="nebula-layer" initial={{ opacity: 0 }} animate={{ opacity: isPreloading ? 0 : 1 }} transition={{ delay: isPreloading ? 0 : 1.15, duration: 2, ease: "easeOut" }} />
      <motion.div className="opening-blackout" initial={{ opacity: 1 }} animate={{ opacity: isPreloading ? 1 : 0 }} transition={{ delay: isPreloading ? 0 : 1, duration: 2, ease: "easeInOut" }} />
      <div className="grain" />
      <div className="fixed inset-0 pointer-events-none">
        {starField.map((star, index) => (
          <motion.span
            key={index}
            className="ambient-star"
            style={{ left: star.left + "%", top: star.top + "%", width: star.size, height: star.size }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: star.opacity, scale: 1 }}
            transition={{ delay: (isPreloading ? 0 : 2.35) + star.delay * 0.28, duration: 1.2 }}
          />
        ))}
      </div>

      <motion.header
        className="fixed left-0 right-0 top-0 z-30 flex items-start justify-between gap-4 px-5 py-5 sm:px-9"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isPreloading ? 0 : 3.05, duration: 0.9 }}
      >
        <div className="search-shell">
          <Search size={16} strokeWidth={1.5} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && searchDate()}
            placeholder={"\u641c\u7d22\u65f6\u95f4 / tag / \u8282\u70b9\u540d\u79f0"}
            aria-label="时间搜索"
          />
          <button onClick={searchDate} aria-label="时间搜索">定位</button>
        </div>
        <div className="header-actions">
          <button
            className={"cover-music-button " + (isMusicOn ? "is-playing" : "")}
            type="button"
            onClick={toggleMusic}
            aria-label={isMusicOn ? "\u5173\u95ed\u58f0\u97f3" : "\u6253\u5f00\u58f0\u97f3"}
          >
            {isMusicOn ? <Volume2 size={17} strokeWidth={1.6} /> : <VolumeX size={17} strokeWidth={1.6} />}
            <span>{isMusicOn ? "\u5173\u95ed\u58f0\u97f3" : "\u6253\u5f00\u58f0\u97f3"}</span>
          </button>
          <button className="memory-button" onClick={randomMemory}>
            <Shuffle size={16} strokeWidth={1.6} />
            <span>{"\u968f\u673a\u56de\u5230\u67d0\u4e00\u5929"}</span>
          </button>
        </div>
      </motion.header>

      <section className="relative z-10 min-h-screen px-5 pb-12 pt-28 sm:px-9 lg:pt-24">
        <motion.div
          className="mb-6 max-w-[980px] lg:fixed lg:left-10 lg:top-24 lg:mb-0"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isPreloading ? 0 : 3.1, duration: 1 }}
        >
          <p className="mb-5 text-[15px] uppercase tracking-[0.5em] text-violet-100/66">Rumors fly, Love is the only truth</p>
          <h1 className="handwriting-title-wrap" aria-label="这趟路，我只想和你走">
            <img className="handwriting-title" src={assetUrl("/title-handwriting.png")} alt="" aria-hidden="true" decoding="async" />
          </h1>
        </motion.div>

        <motion.div
          ref={archiveRef}
          className={"constellation-stage " + (isExpanded ? "is-expanded" : "is-overview")}
          animate={isVoyaging ? { scale: [1, 1.025, 1], y: [0, 16, 0] } : { scale: 1, y: 0 }}
          transition={{ duration: 1.9, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.button
                key="overview"
                className="galaxy-overview"
                onClick={() => setIsExpanded(true)}
                onPointerDown={() => setIsExpanded(true)}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                aria-label="放大星河"
              >
                <svg className="overview-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <motion.polyline
                    points={previewPoints}
                    fill="none"
                    stroke="rgba(255, 187, 112, 0.2)"
                    strokeWidth="0.1"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: isPreloading ? 0 : 3.15, duration: 2.1, ease: "easeInOut" }}
                  />
                </svg>
                {placedEvents.map((event, index) => (
                  <motion.span
                    key={event.id}
                    className="overview-star"
                    style={{ left: event.previewX + "%", top: event.previewY + "%" }}
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (isPreloading ? 0 : 3) + index * (2 / Math.max(placedEvents.length - 1, 1)), duration: 0.42, ease: "easeOut" }}
                  />
                ))}
                <span className="overview-hint"><Maximize2 size={14} />点击放大星河</span>
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                className={"expanded-viewport" + (isTrackDragging ? " is-dragging" : "")}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                onPointerDown={beginTrackDrag}
                onPointerMove={moveTrackDrag}
                onPointerUp={endTrackDrag}
                onPointerCancel={endTrackDrag}
              >
                <motion.div
                  className="expanded-track"
                  style={{ width: trackWidth }}
                  animate={{ x: cameraX }}
                  transition={{ duration: isTrackDragging ? 0 : (isVoyaging ? 1.8 : 1.05), ease: [0.22, 1, 0.36, 1] }}
                >
                  <svg className="expanded-lines" width={trackWidth} height="620" viewBox={"0 0 " + trackWidth + " 620"} aria-hidden="true">
                    <motion.polyline
                      points={trackPoints}
                      fill="none"
                      stroke="rgba(255, 187, 112, 0.24)"
                      strokeWidth="1"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.6, ease: "easeInOut" }}
                    />
                  </svg>

                  {placedEvents.map((event, index) => {
                    const active = event.id === selected?.id || event.id === focusId;
                    const showLabel = active || index % 5 === 0 || placedEvents.length <= 36;
                    return (
                      <motion.button
                        key={event.id}
                        className={"memory-star " + (active ? "is-active " : "") + (showLabel ? "show-label" : "hide-label")}
                        style={{ left: event.trackX, top: event.trackY }}
                        onClick={() => {
                          if (suppressStarClickRef.current) return;
                          focusEvent(event);
                        }}
                        initial={{ opacity: 0, scale: 0.35 }}
                        animate={{ opacity: 1, scale: active ? 1.2 : 1 }}
                        transition={{ delay: index * (1.35 / Math.max(placedEvents.length - 1, 1)), duration: 0.48, ease: "easeOut" }}
                        aria-label={eventLabel(event)}
                      >
                        <span className="star-core" />
                        <span className="date-label">{eventLabel(event)}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              <div className="track-controls" aria-label="移动星轨">
                  <button type="button" onClick={() => nudgeTrack(-1)} aria-label="向左移动星轨"><ChevronLeft size={22} /></button>
                  <button type="button" onClick={() => nudgeTrack(1)} aria-label="向右移动星轨"><ChevronRight size={22} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>


      <button
        className={"floating-music-button " + (isMusicOn ? "is-playing" : "")}
        type="button"
        onClick={toggleMusic}
        aria-label={isMusicOn ? "\u5173\u95ed\u58f0\u97f3" : "\u6253\u5f00\u58f0\u97f3"}
      >
        {isMusicOn ? <Volume2 size={20} strokeWidth={1.7} /> : <VolumeX size={20} strokeWidth={1.7} />}
      </button>


      <AnimatePresence>
        {searchResults && (
          <motion.aside
            key="search-results"
            className="search-results-panel"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-violet-100/60">{"\u641c\u7d22\u7ed3\u679c"}</p>
                <h2 className="mt-3 text-3xl font-light tracking-normal text-white">{searchResults.query}</h2>
              </div>
              <button className="icon-button" onClick={() => setSearchResults(null)} aria-label="Close search results"><X size={18} /></button>
            </div>

            <div className="mt-7 flex items-center justify-between text-sm text-violet-100/56">
              <span>{searchResults.events.length}{"\u4e2a\u5339\u914d\u8282\u70b9"}</span>
            </div>

            <div className="search-result-list mt-5">
              {searchResults.events.length === 0 ? (
                <div className="search-empty">{"\u6682\u65f6\u6ca1\u6709\u627e\u5230\u5339\u914d\u7684\u661f\u661f"}</div>
              ) : searchResults.events.map((event) => (
                <button className="search-result-item" key={event.id} type="button" onClick={() => focusEvent(event)}>
                  <span className="search-result-date">{event.displayDate || event.title}</span>
                  <span className="search-result-title">{event.title}</span>
                  <span className="search-result-tags">
                    {event.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  </span>
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.aside
            key={selected.id}
            className="detail-panel"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                {selected.displayDate && <p className="flex items-center gap-2 text-sm text-violet-100/60"><CalendarDays size={15} />{selected.displayDate}</p>}
                <h2 className="mt-3 text-3xl font-light tracking-normal text-white">{eventLabel(selected)}</h2>
              </div>
              <button className="icon-button" onClick={() => { setSelectedId(null); setCommentImage(null); }} aria-label="关闭详情"><X size={18} /></button>
            </div>

            <MemoryImages event={selected} onOpen={setLightboxImage} onCommentOpen={setCommentImage} />

            {selected.category === "ending" && <p className="mt-7 whitespace-pre-line text-base leading-8 text-violet-50/72">{selected.summary}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {selected.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="nav-card" onClick={() => goTo(-1)}><ChevronLeft size={18} />上一页</button>
              <button className="nav-card justify-end" onClick={() => goTo(1)}>下一篇<ChevronRight size={18} /></button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {commentImage && selected && (
          <motion.aside
            className="comment-side-panel"
            initial={{ opacity: 0, x: 26, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 18, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="comment-side-head">
              <span>评论截图</span>
              <button type="button" onClick={() => setCommentImage(null)} aria-label="关闭评论截图"><X size={16} /></button>
            </div>
            <img src={previewAssetUrl(commentImage)} alt="评论截图" loading="eager" decoding="async" />
          </motion.aside>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lightboxImage && (
          <motion.button
            className={"image-lightbox" + (isCommentImage(lightboxImage) ? " is-comment" : "")}
            onClick={() => setLightboxImage(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            type="button"
            aria-label="关闭放大图片"
          >
            <motion.img
              src={previewAssetUrl(lightboxImage)}
              alt={isCommentImage(lightboxImage) ? "评论截图放大" : "微博截图放大"}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}





















