'use client';

import { useState, useEffect } from 'react';
import { Thread } from '@/lib/types';
import { api } from '@/lib/api';
import { History, MessageSquare, Trash2, Plus } from 'lucide-react';
import { cn, formatTimeAgo, truncateText } from '@/lib/utils';

interface ThreadHistoryProps {
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  className?: string;
}

export default function ThreadHistory({ 
  currentThreadId, 
  onThreadSelect, 
  onNewThread,
  className 
}: ThreadHistoryProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      setIsLoading(true);
      const threadsData = await api.getThreads();
      setThreads(threadsData);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await api.deleteThread(threadId);
        setThreads(threads.filter(t => t.id !== threadId));
        if (currentThreadId === threadId) {
          onNewThread();
        }
      } catch (error) {
        console.error('Failed to delete thread:', error);
      }
    }
  };

  const getLastMessage = (thread: Thread) => {
    const lastMessage = thread.messages[thread.messages.length - 1];
    return lastMessage?.content || thread.title;
  };

  return (
    <div className={cn(
      "bg-white/70 backdrop-blur-sm border border-forest-200 rounded-2xl",
      "transition-all duration-300",
      isCollapsed ? "w-16" : "w-80",
      className
    )}>
      <div className="p-4 border-b border-forest-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="font-semibold text-forest-800 flex items-center gap-2">
              <History className="w-5 h-5" />
              Conversations
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-forest-100 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-forest-600" />
          </button>
        </div>
        
        {!isCollapsed && (
          <button
            onClick={onNewThread}
            className={cn(
              "mt-3 w-full p-3 rounded-xl",
              "bg-forest-500 hover:bg-forest-600",
              "text-white font-medium",
              "transition-colors duration-200",
              "flex items-center justify-center gap-2"
            )}
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-forest-500">
              Loading conversations...
            </div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-center text-forest-500">
              No conversations yet
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => onThreadSelect(thread.id)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left",
                    "transition-colors duration-200",
                    "group relative",
                    currentThreadId === thread.id
                      ? "bg-forest-100 border border-forest-300"
                      : "hover:bg-forest-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-forest-800 text-sm mb-1 line-clamp-1">
                        {thread.title}
                      </p>
                      <p className="text-forest-600 text-xs line-clamp-2 mb-1">
                        {truncateText(getLastMessage(thread), 100)}
                      </p>
                      <p className="text-forest-500 text-xs">
                        {formatTimeAgo(thread.updated_at)}
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className={cn(
                        "p-1 rounded hover:bg-red-100 text-red-500",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity duration-200"
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
