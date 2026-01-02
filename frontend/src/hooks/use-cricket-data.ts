// Custom hooks for data fetching - backend-aligned (NO adapters)

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ScheduleMatch, LiveMatch } from "@/lib/types";
import {
  fetchMockNews,
  fetchMockDiscussions,
  fetchMockCommentary,
  fetchMockScorecard,
} from "@/lib/mock-data";

/* ---------------- LIVE MATCHES ---------------- */

// Fetch all live matches (Redis-backed)
export function useLiveMatches(options?: { refetchInterval?: number }) {
  return useQuery<LiveMatch[]>({
    queryKey: ["live-matches"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/v1/matches/live");
        return res.data?.data ?? [];
      } catch {
        return [];
      }
    },
    refetchInterval: options?.refetchInterval ?? 30_000,
  });
}

/* ---------------- SCHEDULES ---------------- */

// Fetch schedules (Postgres-backed)
export function useSchedules() {
  return useQuery<ScheduleMatch[]>({
    queryKey: ["schedules"],
    queryFn: async () => {
      const res = await api.get("/api/v1/schedules");
      console.log("SCHEDULE API RESPONSE:", res.data);
      return res.data.data; // backend returns { data: ScheduleMatch[] }
    },
  });
}

/* ---------------- SINGLE MATCH ---------------- */

// Fetch a single live match by ID
export function useLiveMatch(matchId: number | undefined) {
  return useQuery<LiveMatch>({
    queryKey: ["live-match", matchId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/matches/${matchId}/live`);
      return res.data; // single match endpoint returns LiveMatch directly
    },
    enabled: typeof matchId === "number",
    refetchInterval: 10_000,
  });
}

// Combined match hook (for detail pages) - merges schedule + live data
export function useMatch(matchId: number | undefined, options?: { refetchInterval?: number }) {
  const { data: schedules } = useSchedules();
  const { data: liveMatch, isLoading: liveLoading } = useLiveMatch(matchId);

  return useQuery<ScheduleMatch | LiveMatch | undefined>({
    queryKey: ["match", matchId],
    queryFn: async () => {
      if (!matchId) return undefined;

      // Try live match first
      if (liveMatch) return liveMatch;

      // Fallback to schedule
      const scheduleMatch = schedules?.find(m => m.match_id === matchId);
      return scheduleMatch;
    },
    enabled: typeof matchId === "number",
    refetchInterval: options?.refetchInterval ?? 30_000,
  });
}

/* ---------------- MOCK-ONLY HOOKS (PHASE 1 CONTENT) ---------------- */

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: fetchMockNews,
  });
}

export function useDiscussions(matchId?: number) {
  return useQuery({
    queryKey: ["discussions", matchId],
    queryFn: () => fetchMockDiscussions(matchId?.toString()),
  });
}

export function useCommentary(matchId: number | undefined) {
  return useQuery({
    queryKey: ["commentary", matchId],
    queryFn: () => fetchMockCommentary(matchId!),
    enabled: typeof matchId === "number",
  });
}

export function useScorecard(matchId: number | undefined) {
  return useQuery({
    queryKey: ["scorecard", matchId],
    queryFn: () => fetchMockScorecard(matchId!),
    enabled: typeof matchId === "number",
  });
}