'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Tag, Calendar, Clock, Type, Mic, Video, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiDeleteCheckInEntry, apiGetCheckInEntry, type CheckInEntry } from '@/lib/api';
import {
  deleteLocalCheckIn,
  getLocalCheckIn,
  parseLocalRouteId,
  type LocalCheckInRecord,
} from '@/lib/local-check-in-store';

type DetailEntry = {
  id: string;
  type: 'text' | 'voice' | 'video';
  content: string;
  dateLabel: string;
  timeLabel: string;
  tags: string[];
  dominantEmotion: string;
  confidence: number;
  allPredictions: { emotion: string; confidence: number }[];
  modelVersion: string;
  processingTime: number;
  isLocalOnly: boolean;
};

const EMOTION_COLORS: Record<string, string> = {
  happy: 'text-yellow-500',
  sad: 'text-blue-500',
  angry: 'text-red-500',
  anxious: 'text-purple-500',
  calm: 'text-teal-500',
  excited: 'text-orange-500',
  neutral: 'text-gray-500',
  surprised: 'text-pink-500',
  disgusted: 'text-green-500',
  fearful: 'text-indigo-500',
  confident: 'text-amber-500',
  grateful: 'text-emerald-500',
  loved: 'text-rose-500',
  frustrated: 'text-orange-600',
  energetic: 'text-yellow-400',
  bored: 'text-gray-400',
};

const TYPE_ICONS = {
  text: Type,
  voice: Mic,
  video: Video,
};

function getEmoji(emotion: string): string {
  const emojiMap: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    calm: '😌',
    excited: '🤩',
    neutral: '😐',
    surprised: '😲',
    disgusted: '🤢',
    fearful: '😨',
    confident: '😎',
    grateful: '🙏',
    loved: '🥰',
    frustrated: '😤',
    energetic: '⚡',
    bored: '😑',
  };
  return emojiMap[emotion] || '😊';
}

function mapApiToDetail(e: CheckInEntry): DetailEntry {
  const content = e.text_content || e.transcription || e.title || '';
  const dt = new Date(e.entry_date);
  const confPct = Math.round((e.emotion_confidence ?? 0) * 100);
  const preds = e.emotion
    ? [{ emotion: e.emotion, confidence: confPct }]
    : [{ emotion: 'neutral', confidence: 0 }];
  return {
    id: String(e.id),
    type: e.entry_type,
    content,
    dateLabel: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timeLabel: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    tags: e.tags || [],
    dominantEmotion: e.emotion || 'neutral',
    confidence: confPct,
    allPredictions: preds,
    modelVersion: 'Server',
    processingTime: 0,
    isLocalOnly: false,
  };
}

function mapLocalToDetail(rec: LocalCheckInRecord): DetailEntry {
  const p = rec.payload;
  const entryType = ((p.entry_type as string) || 'text') as DetailEntry['type'];
  const entryDateStr = (p.entry_date as string) || new Date(rec.createdAt).toISOString();
  const dt = new Date(entryDateStr);
  const content =
    (p.text_content as string) ||
    (p.transcription as string) ||
    (p.title as string) ||
    '';
  const emotion = (p.emotion as string) || 'neutral';
  const confRaw = p.emotion_confidence;
  const confPct =
    typeof confRaw === 'number' ? Math.round(confRaw * 100) : Math.round((Number(confRaw) || 0) * 100);
  const preds = [{ emotion, confidence: confPct }];
  return {
    id: `local-${rec.localId}`,
    type: entryType,
    content,
    dateLabel: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timeLabel: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    tags: (p.tags as string[]) || [],
    dominantEmotion: emotion,
    confidence: confPct,
    allPredictions: preds,
    modelVersion: 'This device',
    processingTime: 0,
    isLocalOnly: true,
  };
}

const EMOTION_BG: Record<string, string> = {
  happy: '#FEF9C3',
  sad: '#E0E7FF',
  angry: '#FEE2E2',
  anxious: '#FCE7F3',
  calm: '#DBEAFE',
  excited: '#FFEDD5',
  neutral: '#F3F4F6',
  surprised: '#FCE7F3',
  disgusted: '#ECFCCB',
  fearful: '#E0E7FF',
  confident: '#FEF3C7',
  grateful: '#D1FAE5',
  loved: '#FFE4E6',
  frustrated: '#FFEDD5',
  energetic: '#FEF9C3',
  bored: '#F3F4F6',
};

export default function CheckInDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;
  const { user, getAccessToken, isLoading: authLoading } = useAuth();

  const [entry, setEntry] = useState<DetailEntry | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!entryId) {
      setLoading(false);
      setNotFound(true);
      setEntry(null);
      return;
    }
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      setNotFound(true);
      setEntry(null);
      return;
    }
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setNotFound(true);
      setEntry(null);
      return;
    }

    setLoading(true);
    setNotFound(false);
    try {
      const localKey = parseLocalRouteId(entryId);
      if (localKey) {
        const rec = await getLocalCheckIn(user.id, localKey);
        if (!rec) {
          setEntry(null);
          setNotFound(true);
        } else {
          setEntry(mapLocalToDetail(rec));
        }
      } else {
        const numericId = parseInt(entryId, 10);
        if (Number.isNaN(numericId)) {
          setEntry(null);
          setNotFound(true);
        } else {
          const e = await apiGetCheckInEntry(token, numericId);
          setEntry(mapApiToDetail(e));
        }
      }
    } catch {
      setEntry(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [entryId, user?.id, getAccessToken, authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    const token = getAccessToken();
    if (!token || !user?.id || !entry) return;
    setDeleting(true);
    try {
      if (entry.isLocalOnly) {
        const localKey = parseLocalRouteId(entry.id);
        if (localKey) await deleteLocalCheckIn(user.id, localKey);
      } else {
        await apiDeleteCheckInEntry(token, parseInt(entry.id, 10));
      }
      router.push('/check-in');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading check-in…</p>
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Check-In Not Found</h1>
        <p className="text-gray-500 mb-6">The check-in you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/check-in"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Check-In History
        </Link>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[entry.type];
  const emotionPanelBg = EMOTION_BG[entry.dominantEmotion] || EMOTION_BG.neutral;

  return (
    <div className="space-y-4">
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          href="/check-in"
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Check-In History</span>
        </Link>

        <div className="flex items-center gap-2">
          {!entry.isLocalOnly && (
            <Link
              href={`/check-in/${entryId}/edit`}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {entry.isLocalOnly && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This entry is stored only on this device. Use{' '}
          <strong>Settings → Privacy &amp; data → Sync device check-ins to cloud</strong> to copy it to your account.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg">
                  <TypeIcon className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 capitalize">{entry.type} Check-In</div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {entry.dateLabel}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {entry.timeLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {entry.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="prose max-w-none">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Emotion detection</h3>
            <div className="space-y-3">
              {entry.allPredictions.map((pred, idx) => (
                <div key={`${pred.emotion}-${idx}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getEmoji(pred.emotion)}</span>
                      <span
                        className={`font-medium capitalize ${EMOTION_COLORS[pred.emotion] || 'text-gray-700'}`}
                      >
                        {pred.emotion}
                      </span>
                    </div>
                    <span className="text-gray-600 font-medium">{pred.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-black' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(100, pred.confidence)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Dominant Emotion</h3>
            <div className="p-6 rounded-lg mb-4" style={{ backgroundColor: emotionPanelBg }}>
              <div className="text-center">
                <div className="text-6xl mb-3">{getEmoji(entry.dominantEmotion)}</div>
                <div
                  className={`text-2xl font-bold capitalize mb-2 ${EMOTION_COLORS[entry.dominantEmotion] || 'text-gray-700'}`}
                >
                  {entry.dominantEmotion}
                </div>
                <div className="text-sm text-gray-600">{entry.confidence}% confidence</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-t border-gray-200">
                <span className="text-gray-600">Source</span>
                <span className="flex items-center gap-1 font-medium text-gray-900">
                  <Zap className="w-3.5 h-3.5" />
                  {entry.modelVersion}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-200">
                <span className="text-gray-600">Check-In Type</span>
                <span className="font-medium text-gray-900 capitalize flex items-center gap-1.5">
                  <TypeIcon className="w-3.5 h-3.5" />
                  {entry.type}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Word Count</span>
                <span className="font-medium">
                  {entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Character Count</span>
                <span className="font-medium">{entry.content.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tags</span>
                <span className="font-medium">{entry.tags.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-2">Delete Check-In?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this check-in? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
