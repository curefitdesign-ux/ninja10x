import { useEffect, useMemo, useState } from "react";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnZ7bvrdOxuF-Z9j8TnZVmY2AeERAnfeqO7kRE8yZAecyfSpP4thQCZcX3Nwig_dnF2ECg9N-EORt7/pub?output=csv";

type ActivityDataPointMap = Record<string, { label1: string; label2: string }>;

let cachedMap: ActivityDataPointMap | null = null;
let inflight: Promise<ActivityDataPointMap> | null = null;

const normalize = (s: string) => s.toLowerCase().trim();

const cleanLabel = (s: string) => s.replace(/\(.*\)/g, "").replace(/\s+/g, " ").trim();

const normalizeDataPoint = (s: string) => {
  const cleaned = cleanLabel(s);
  // When sheet contains alternatives like "Duration / Avg Speed", keep it consistent with our UI.
  if (normalize(cleaned).includes("duration")) return "Duration";
  return cleaned;
};

const splitCsvLine = (line: string): string[] => {
  // Split on commas not inside quotes.
  const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g);
  return parts.map((p) => p.trim().replace(/^"|"$/g, ""));
};

const parseCsvToMap = (csv: string): ActivityDataPointMap => {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Expect header: Activity,Data Point 1,Data Point 2
  const dataLines = lines.slice(1);
  const map: ActivityDataPointMap = {};

  for (const line of dataLines) {
    const [activity, dp1, dp2] = splitCsvLine(line);
    if (!activity) continue;

    map[activity] = {
      label1: normalizeDataPoint(dp1 || "Metric"),
      label2: normalizeDataPoint(dp2 || "Duration"),
    };
  }

  return map;
};

const findBestActivityMatch = (activity: string, map: ActivityDataPointMap): string | null => {
  const a = normalize(activity);
  if (!a) return null;

  let bestKey: string | null = null;
  let bestScore = 0;

  for (const key of Object.keys(map)) {
    const k = normalize(key);

    // Direct contains match
    if (k.includes(a)) {
      const score = a.length;
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
      continue;
    }

    // Token match (handles "Running / Jogging" and similar)
    const tokens = k
      .replace(/[()]/g, "")
      .split(/[/,]/g)
      .map((t) => normalize(t))
      .filter(Boolean);

    for (const t of tokens) {
      if (!t) continue;
      if (t === a || a.includes(t) || t.includes(a)) {
        const score = Math.min(t.length, a.length);
        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }
    }
  }

  return bestKey;
};

export const getActivityDataPoints = (
  activity: string,
  map?: ActivityDataPointMap | null
): { label1: string; label2: string } => {
  const safeActivity = activity || "";
  const safeMap = map || cachedMap;

  if (safeMap) {
    const matchKey = findBestActivityMatch(safeActivity, safeMap);
    if (matchKey && safeMap[matchKey]) return safeMap[matchKey];
  }

  return { label1: "Metric", label2: "Duration" };
};

export const useActivityDataPoints = (activity: string) => {
  const [map, setMap] = useState<ActivityDataPointMap | null>(cachedMap);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (cachedMap) {
      setMap(cachedMap);
      return;
    }

    if (!inflight) {
      inflight = fetch(CSV_URL)
        .then((r) => r.text())
        .then(parseCsvToMap)
        .then((m) => {
          cachedMap = m;
          return m;
        })
        .finally(() => {
          inflight = null;
        });
    }

    inflight
      .then((m) => {
        if (!isMounted) return;
        setMap(m);
      })
      .catch(() => {
        if (!isMounted) return;
        setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const labels = useMemo(() => getActivityDataPoints(activity, map), [activity, map]);

  return {
    ...labels,
    isLoading: !map && !hasError,
  };
};
