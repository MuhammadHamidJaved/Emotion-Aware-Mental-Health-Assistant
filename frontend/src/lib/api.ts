const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export type User = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  profile_picture?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  phone_number?: string | null;
  mental_health_concerns?: string[];
  journaling_goals?: string[];
  preferred_journal_time?: string | null;
  enable_biometric?: boolean;
  enable_notifications?: boolean;
  total_entries?: number;
  current_streak?: number;
  longest_streak?: number;
  created_at?: string;
  updated_at?: string;
};

type LoginResponse = {
  message: string;
  access: string;
  refresh: string;
  user: User;
};

type RegisterResponse = LoginResponse;

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = data.detail || data.message || 'Unable to sign in. Please check your credentials.';
    throw new Error(detail);
  }

  return res.json();
}

export async function apiRegister(payload: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<RegisterResponse> {
  const res = await fetch(`${API_URL}/api/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errors = typeof data === 'object' ? data : {};
    const firstError =
      (errors.email && errors.email[0]) ||
      (errors.password && errors.password[0]) ||
      (errors.confirm_password && errors.confirm_password[0]) ||
      errors.detail ||
      errors.message ||
      'Unable to create account. Please check your details.';
    throw new Error(firstError);
  }

  return res.json();
}

export async function apiGetCurrentUser(accessToken: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/me/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Unable to load user profile.');
  }

  return res.json();
}

export async function apiUpdateCurrentUser(
  accessToken: string,
  payload: FormData | Record<string, any>,
): Promise<User> {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;

  const res = await fetch(`${API_URL}/api/auth/me/`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: isFormData ? (payload as FormData) : JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail =
      data.detail ||
      data.message ||
      'Unable to update profile. Please check your details and try again.';
    throw new Error(detail);
  }

  return res.json();
}

export function storeAuthTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

// Chat API types
export type ChatMessage = {
  id: number;
  sender: 'user' | 'ai';
  message: string;
  entry_reference?: number | null;
  emotion_context?: Record<string, any>;
  created_at: string;
};

export type ChatResponse = {
  user_message: ChatMessage;
  ai_response: ChatMessage;
  response: {
    message: string;
    sources?: Array<{ content: string; metadata?: Record<string, any> }>;
    error?: string | null;
  };
};

// Chat API functions
export async function apiSendChatMessage(
  accessToken: string,
  message: string,
  entryReference?: number,
  emotionContext?: Record<string, any>
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat/send/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message,
      entry_reference: entryReference,
      emotion_context: emotionContext || {},
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = data.error || data.message || 'Failed to send message. Please try again.';
    throw new Error(error);
  }

  return res.json();
}

export async function apiGetChatHistory(accessToken: string, limit: number = 50): Promise<{ messages: ChatMessage[]; count: number }> {
  const res = await fetch(`${API_URL}/api/chat/history/?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load chat history.');
  }

  return res.json();
}

export async function apiClearChatHistory(accessToken: string): Promise<{ message: string; deleted_count: number }> {
  const res = await fetch(`${API_URL}/api/chat/clear/`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to clear chat history.');
  }

  return res.json();
}

// Dashboard API types
export type DashboardStats = {
  total_entries: number;
  current_streak: number;
  dominant_emotion: string;
  ml_predictions_count: number;
};

export type MoodTrendData = {
  date: string;
  avgValence: number;
  avgArousal: number;
};

export type EmotionDistribution = {
  emotion: string;
  count: number;
};

export type RecentEntry = {
  id: number;
  date: string;
  emotion: string;
  preview: string;
  confidence: number | null;
  type: string;
};

// Dashboard API functions
export async function apiGetDashboardStats(accessToken: string): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_URL}/api/dashboard/stats/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      // Return default stats if endpoint doesn't exist or fails
      return {
        current_streak: 0,
        total_entries: 0,
        dominant_emotion: 'neutral',
        ml_predictions_count: 0,
      };
    }

    return res.json();
  } catch (error) {
    // Return default stats on error (endpoint may not exist yet)
    return {
      current_streak: 0,
      total_entries: 0,
      dominant_emotion: 'neutral',
      ml_predictions_count: 0,
    };
  }
}

export async function apiGetMoodTrend(
  accessToken: string,
  days: number = 7
): Promise<MoodTrendData[]> {
  try {
    const res = await fetch(`${API_URL}/api/dashboard/mood-trend/?days=${days}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      // Return empty array if endpoint doesn't exist or fails
      return [];
    }

    return res.json();
  } catch (error) {
    // Return empty array on error (endpoint may not exist yet)
    return [];
  }
}

export async function apiGetEmotionDistribution(
  accessToken: string,
  days: number = 30
): Promise<EmotionDistribution[]> {
  try {
    const res = await fetch(`${API_URL}/api/dashboard/emotion-distribution/?days=${days}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      // Return empty array if endpoint doesn't exist or fails
      return [];
    }

    return res.json();
  } catch (error) {
    // Return empty array on error (endpoint may not exist yet)
    return [];
  }
}

export async function apiGetRecentEntries(
  accessToken: string,
  limit: number = 5
): Promise<RecentEntry[]> {
  try {
    const res = await fetch(`${API_URL}/api/dashboard/recent-entries/?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      // Return empty array if endpoint doesn't exist or fails
      return [];
    }

    return res.json();
  } catch (error) {
    // Return empty array on error (endpoint may not exist yet)
    return [];
  }
}

// Insights API types
export type InsightsOverview = {
  overall_mood: number;
  overall_mood_change: number;
  positive_trend: number;
  positive_trend_status: string;
  avg_entries_per_day: number;
  best_streak: number;
};

export type MoodTimelineData = {
  date: string;
  valence: number;
  arousal: number;
  avgScore: number;
};

// Insights API functions
export async function apiGetInsightsOverview(
  accessToken: string,
  days: number = 30
): Promise<InsightsOverview> {
  const res = await fetch(`${API_URL}/api/insights/overview/?days=${days}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load insights overview.');
  }

  return res.json();
}

export async function apiGetInsightsMoodTimeline(
  accessToken: string,
  days: number = 30
): Promise<MoodTimelineData[]> {
  const res = await fetch(`${API_URL}/api/insights/mood-timeline/?days=${days}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load mood timeline data.');
  }

  return res.json();
}

// Calendar API types
export type CalendarDayEntry = {
  date: string;
  dominantEmotion: string;
  emoji: string;
  entryCount: number;
  moodScore: number;
};

export type CalendarMonthData = Record<string, CalendarDayEntry>;

export type DayEntryDetail = {
  id: number;
  title: string;
  text_content: string;
  emotion: string;
  entry_type: string;
  entry_date: string;
  word_count: number;
};

export type MonthSummary = {
  total_entries: number;
  days_logged: number;
  avg_mood_score: number;
};

// Calendar API functions
export async function apiGetCalendarMonth(
  accessToken: string,
  year: number,
  month: number
): Promise<CalendarMonthData> {
  const res = await fetch(`${API_URL}/api/calendar/month/?year=${year}&month=${month}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load calendar data.');
  }

  return res.json();
}

export async function apiGetCalendarDayDetails(
  accessToken: string,
  date: string
): Promise<DayEntryDetail[]> {
  const res = await fetch(`${API_URL}/api/calendar/day/?date=${date}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load day details.');
  }

  return res.json();
}

export async function apiGetCalendarMonthSummary(
  accessToken: string,
  year: number,
  month: number
): Promise<MonthSummary> {
  const res = await fetch(`${API_URL}/api/calendar/month-summary/?year=${year}&month=${month}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load month summary.');
  }

  return res.json();
}

// Settings API types
export type ProfileSettings = {
  first_name: string;
  last_name: string;
  email: string;
  bio: string;
  phone_number: string;
  profile_picture: string | null;
  total_entries: number;
  current_streak: number;
  longest_streak: number;
};

export type NotificationSettings = {
  journal_reminders: boolean;
  mood_insights: boolean;
  weekly_reports: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
};

export type PrivacySettings = {
  data_collection: boolean;
  share_analytics: boolean;
  cloud_backup: boolean;
  storage_type: 'cloud' | 'local' | 'hybrid';
};

export type AppearanceSettings = {
  mood_adaptive: boolean;
  dark_mode: boolean;
  color_scheme: 'default' | 'warm' | 'cool';
};

// Settings API functions
export async function apiGetProfileSettings(accessToken: string): Promise<ProfileSettings> {
  const res = await fetch(`${API_URL}/api/settings/profile/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load profile settings.');
  }

  return res.json();
}

export async function apiUpdateProfileSettings(
  accessToken: string,
  data: FormData | { first_name?: string; last_name?: string; bio?: string; phone_number?: string; profile_picture?: File }
): Promise<ProfileSettings> {
  const formData = data instanceof FormData ? data : new FormData();
  
  if (!(data instanceof FormData)) {
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.bio !== undefined) formData.append('bio', data.bio);
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number);
    if (data.profile_picture) formData.append('profile_picture', data.profile_picture);
  }

  const res = await fetch(`${API_URL}/api/settings/profile/`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update profile settings.');
  }

  return res.json();
}

export async function apiGetNotificationSettings(accessToken: string): Promise<NotificationSettings> {
  const res = await fetch(`${API_URL}/api/settings/notifications/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load notification settings.');
  }

  return res.json();
}

export async function apiUpdateNotificationSettings(
  accessToken: string,
  settings: NotificationSettings
): Promise<{ message: string; settings: NotificationSettings }> {
  const res = await fetch(`${API_URL}/api/settings/notifications/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update notification settings.');
  }

  return res.json();
}

export async function apiGetPrivacySettings(accessToken: string): Promise<PrivacySettings> {
  const res = await fetch(`${API_URL}/api/settings/privacy/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load privacy settings.');
  }

  return res.json();
}

export async function apiUpdatePrivacySettings(
  accessToken: string,
  settings: PrivacySettings
): Promise<{ message: string; settings: PrivacySettings }> {
  const res = await fetch(`${API_URL}/api/settings/privacy/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update privacy settings.');
  }

  return res.json();
}

export async function apiGetAppearanceSettings(accessToken: string): Promise<AppearanceSettings> {
  const res = await fetch(`${API_URL}/api/settings/appearance/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load appearance settings.');
  }

  return res.json();
}

export async function apiUpdateAppearanceSettings(
  accessToken: string,
  settings: AppearanceSettings
): Promise<{ message: string; settings: AppearanceSettings }> {
  const res = await fetch(`${API_URL}/api/settings/appearance/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update appearance settings.');
  }

  return res.json();
}

export async function apiExportData(accessToken: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/settings/export-data/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to request data export.');
  }

  return res.json();
}

export async function apiDeleteAccount(accessToken: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/settings/delete-account/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to request account deletion.');
  }

  return res.json();
}


