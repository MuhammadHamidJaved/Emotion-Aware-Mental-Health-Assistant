'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  Calendar, Flame, BookOpen, Target, 
  Mail, Edit, Camera, Phone, Clock
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const hasConcerns = !!(user.mental_health_concerns && user.mental_health_concerns.length > 0);
  const hasGoals = !!(user.journaling_goals && user.journaling_goals.length > 0);

  return (
    <div className="space-y-4">
      {/* Hero Card - Compact */}
      <Card className="border-0 bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar - Smaller */}
            <div 
              className="relative group cursor-pointer flex-shrink-0"
              onMouseEnter={() => setIsHoveringAvatar(true)}
              onMouseLeave={() => setIsHoveringAvatar(false)}
            >
              <Avatar 
                size="xl"
                src={user.profile_picture || undefined}
                alt={displayName}
                fallback={initials}
                className="border-2 border-white/20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
              />
              {isHoveringAvatar && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h1 className="text-xl font-bold">{displayName}</h1>
                  <p className="text-gray-300 text-xs">@{user.email.split('@')[0]}</p>
                </div>
                <Link href="/profile/edit">
                  <Button size="sm" variant="outline" className="h-7 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </Link>
              </div>
              {user.bio && (
                <p className="text-gray-200 text-xs line-clamp-2">{user.bio}</p>
              )}
              
              {/* Meta Info - Compact */}
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-300">
                {user.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </span>
                )}
                {user.date_of_birth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(user.date_of_birth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {user.phone_number && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {user.phone_number}
                  </span>
                )}
                {user.preferred_journal_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {user.preferred_journal_time}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats - Compact */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600">{user.total_entries || 0}</div>
            <p className="text-xs text-gray-600 mt-0.5">Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />
              {user.current_streak || 0}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{user.longest_streak || 0}</div>
            <p className="text-xs text-gray-600 mt-0.5">Best</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {user.total_entries ? Math.round((user.total_entries / 7) * 100) / 100 : 0}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">Avg/Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout - Compact */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-3">
          {/* Mental Health Focus */}
          {(hasConcerns || !hasGoals) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-semibold">Mental Health Focus</h2>
                </div>
                {hasConcerns ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.mental_health_concerns.map((concern, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                        {concern}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No concerns added yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Journaling Goals */}
          {(hasGoals || !hasConcerns) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-semibold">Wellness Goals</h2>
                </div>
                {hasGoals ? (
                  <ul className="space-y-1">
                    {user.journaling_goals.map((goal, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">No goals set yet</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Recent Activity */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Recent Activity
            </h2>
            <div className="space-y-2">
              {[
                { date: '2 days ago', action: 'Logged mood', emotion: '😊' },
                { date: '5 days ago', action: 'Completed breathing exercise', emotion: '😌' },
                { date: '1 week ago', action: 'Updated profile', emotion: '✨' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded bg-gray-50">
                  <span className="text-lg">{activity.emotion}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Card - Compact */}
      {(!hasConcerns || !hasGoals) && (
        <Card className="border-dashed">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Complete your profile to get personalized insights</p>
            <Link href="/profile/edit">
              <Button size="sm" className="h-8 text-xs">
                Complete Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
