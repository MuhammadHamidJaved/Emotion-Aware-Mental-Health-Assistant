'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DUMMY_TAGS } from '@/data/dummy-data';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';

export default function TagsPage() {
  const [tags, setTags] = useState(DUMMY_TAGS);
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
            <p className="text-gray-600 mt-1">Organize your check-ins with tags</p>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Tag
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TagIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{tags.length}</p>
                <p className="text-sm text-gray-600">Total Tags</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TagIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tags.reduce((sum, tag) => sum + tag.usageCount, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Usage</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TagIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tags.sort((a, b) => b.usageCount - a.usageCount)[0]?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Most Used</p>
              </div>
            </div>
          </Card>
        </div>

        {/* New Tag Form */}
        {isAdding && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Create New Tag</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <Button onClick={() => {
                if (newTagName.trim()) {
                  // Add new tag logic
                  setNewTagName('');
                  setIsAdding(false);
                }
              }}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Tags List */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">All Tags</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.sort((a, b) => b.usageCount - a.usageCount).map((tag) => (
              <div
                key={tag.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Used in <span className="font-medium text-gray-900">{tag.usageCount}</span> entries
                </p>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${(tag.usageCount / tags.reduce((max, t) => Math.max(max, t.usageCount), 0)) * 100}%`,
                      backgroundColor: tag.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
  );
}
