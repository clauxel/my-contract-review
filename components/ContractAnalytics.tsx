"use client";
import { useEffect } from "react";
type AnalyticsEvent = { id: string; name: string; path: string; occurredAt: string; visitorId: string; sessionId: string; referrerHost: string | null; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; metadata: Record<string, unknown> };
declare global { interface Window { contractReviewTrack?: (name: string, metadata?: Record<string, unknown>) => void } }
const visitorStorageKey = "contract-review-online-analytics-visitor";
const sessionStorageKey = "contract-review-online-analytics-session";
const queueStorageKey = "contract-review-online-analytics-queue";
const sessionInactivityMs = 30 * 60 * 1000;
const flushDelayMs = 1200;
const maxQueueLength = 120;
let pendingEvents: AnalyticsEvent[] = [];
let flushTimer: number | null = null;
function generateId() { return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
function getVisitorId() { try { const existing = localStorage.getItem(visitorStorageKey); if (existing) return existing; const created = generateId(); localStorage.setItem(visitorStorageKey, created); return created; } catch { return generateId(); } }
function getSessionId() { const now = Date.now(); try { const raw = sessionStorage.getItem(sessionStorageKey); if (raw) { const parsed = JSON.parse(raw) as { id?: string; seenAt?: number }; if (parsed.id && parsed.seenAt && now - parsed.seenAt < sessionInactivityMs) { sessionStorage.setItem(sessionStorageKey, JSON.stringify({ id: parsed.id, seenAt: now })); return parsed.id; } } const created = generateId(); sessionStorage.setItem(sessionStorageKey, JSON.stringify({ id: created, seenAt: now })); return created; } catch { return generateId(); } }
function getReferrerHost() { if (!document.referrer) return null; try { return new URL(document.referrer).host; } catch { return null; } }
function loadQueue() { try { const raw = localStorage.getItem(queueStorageKey); const parsed = raw ? JSON.parse(raw) : []; if (Array.isArray(parsed)) pendingEvents = parsed.slice(-maxQueueLength); } catch {} }
function persistQueue() { try { localStorage.setItem(queueStorageKey, JSON.stringify(pendingEvents.slice(-maxQueueLength))); } catch {} }
function buildEvent(name: string, metadata: Record<string, unknown> = {}): AnalyticsEvent { const query = new URLSearchParams(window.location.search); return { id: generateId(), name, path: `${window.location.pathname}${window.location.search}`, occurredAt: new Date().toISOString(), visitorId: getVisitorId(), sessionId: getSessionId(), referrerHost: getReferrerHost(), utmSource: query.get("utm_source"), utmMedium: query.get("utm_medium"), utmCampaign: query.get("utm_campaign"), metadata }; }
async function sendEvents(events: AnalyticsEvent[], useBeacon = false) { const body = JSON.stringify({ events }); if (useBeacon && typeof navigator.sendBeacon === "function") return navigator.sendBeacon("/api/analytics/events", new Blob([body], { type: "application/json" })); const response = await fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }); return response.ok; }
async function flushAnalytics(useBeacon = false) { if (pendingEvents.length === 0) return true; const batch = [...pendingEvents]; try { const delivered = await sendEvents(batch, useBeacon); if (!delivered) return false; pendingEvents = pendingEvents.slice(batch.length); persistQueue(); return true; } catch { return false; } }
function scheduleFlush() { if (flushTimer !== null) return; flushTimer = window.setTimeout(() => { flushTimer = null; void flushAnalytics(); }, flushDelayMs); }
function trackEvent(name: string, metadata: Record<string, unknown> = {}) { pendingEvents = [...pendingEvents, buildEvent(name, metadata)].slice(-maxQueueLength); persistQueue(); scheduleFlush(); }
export default function ContractAnalytics() { useEffect(() => { loadQueue(); window.contractReviewTrack = trackEvent; trackEvent("page_view", { title: document.title }); const flushOnHide = () => { if (document.visibilityState === "hidden") void flushAnalytics(true); }; const flushOnPageHide = () => { void flushAnalytics(true); }; document.addEventListener("visibilitychange", flushOnHide); window.addEventListener("pagehide", flushOnPageHide); return () => { document.removeEventListener("visibilitychange", flushOnHide); window.removeEventListener("pagehide", flushOnPageHide); if (window.contractReviewTrack === trackEvent) delete window.contractReviewTrack; }; }, []); return null; }
