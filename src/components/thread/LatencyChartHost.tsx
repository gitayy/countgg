import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { PostType } from '../../utils/types';
import { LatencyChart } from './LatencyChart';

const MAX_SAMPLES = 100;
const UI_TARGET_FPS = 10;
const UI_PUBLISH_INTERVAL_MS = Math.max(100, Math.floor(1000 / UI_TARGET_FPS));

export interface LatencySample {
  uuid: string;
  schedulingMs: number;
  dbReadMs: number;
  dbWriteMs: number;
  otherMs: number;
  ts: number;
}

export interface LatencyChartHandle {
  registerSampleFromPost(post: PostType): void;
  reset(): void;
  syncNow(): void;
}

interface UiState {
  samples: LatencySample[];
}

const EMPTY_UI: UiState = { samples: [] };

export const LatencyChartHost = memo(
  forwardRef<LatencyChartHandle, { threadName: string }>(function LatencyChartHost(
    { threadName },
    ref,
  ) {
    const samplesRef = useRef<LatencySample[]>([]);
    const pendingRef = useRef<LatencySample[]>([]);
    const hasChangesRef = useRef(false);
    const seenUuidsRef = useRef(new Set<string>());
    const [uiState, setUiState] = useState<UiState>(EMPTY_UI);

    function flushPending() {
      const pending = pendingRef.current;
      if (pending.length === 0) return;
      pendingRef.current = [];
      const next = [...samplesRef.current, ...pending];
      samplesRef.current = next.length > MAX_SAMPLES ? next.slice(next.length - MAX_SAMPLES) : next;
      hasChangesRef.current = true;
    }

    function publishUiSnapshot() {
      flushPending();
      if (!hasChangesRef.current) return;
      hasChangesRef.current = false;
      setUiState({ samples: [...samplesRef.current] });
    }

    useImperativeHandle(ref, () => ({
      registerSampleFromPost(post: PostType) {
        if (post.processingLatency == null) return;
        if (seenUuidsRef.current.has(post.uuid)) return;
        seenUuidsRef.current.add(post.uuid);
        const schedulingMs = post.schedulingMs ?? 0;
        const dbReadMs = post.dbReadMs ?? 0;
        const dbWriteMs = post.dbWriteMs ?? 0;
        const otherMs = post.otherMs ?? Math.max(0, post.processingLatency - schedulingMs - dbReadMs - dbWriteMs);
        pendingRef.current.push({ uuid: post.uuid, schedulingMs, dbReadMs, dbWriteMs, otherMs, ts: Date.now() });
        hasChangesRef.current = true;
      },
      reset() {
        samplesRef.current = [];
        pendingRef.current = [];
        seenUuidsRef.current = new Set();
        hasChangesRef.current = false;
        setUiState(EMPTY_UI);
      },
      syncNow() {
        publishUiSnapshot();
      },
    }));

    useEffect(() => {
      samplesRef.current = [];
      pendingRef.current = [];
      seenUuidsRef.current = new Set();
      hasChangesRef.current = false;
      setUiState(EMPTY_UI);
    }, [threadName]);

    useEffect(() => {
      const id = setInterval(publishUiSnapshot, UI_PUBLISH_INTERVAL_MS);
      return () => clearInterval(id);
    }, []);

    return <LatencyChart samples={uiState.samples} />;
  }),
);
