"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleDot, GitPullRequest, MessageSquare, Check, Bell } from "lucide-react";

interface Notification {
  id: number;
  type: "issue" | "pr" | "comment";
  title: string;
  repo: string;
  href: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "issue",
    title: "Bug: greet function doesnt handle empty names",
    repo: "eli/hello-world",
    href: "/eli/hello-world/issues/2",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "issue",
    title: "Add TypeScript support",
    repo: "eli/hello-world",
    href: "/eli/hello-world/issues/1",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "comment",
    title: "Comment on: Add TypeScript support",
    repo: "eli/hello-world",
    href: "/eli/hello-world/issues/1",
    time: "1 hour ago",
    read: true,
  },
];

const typeIcon = (type: string) => {
  switch (type) {
    case "issue": return <CircleDot size={16} className="text-green-500" />;
    case "pr": return <GitPullRequest size={16} className="text-purple-500" />;
    case "comment": return <MessageSquare size={16} className="text-foreground-lighter" />;
    default: return <Bell size={16} />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground-lighter transition-colors hover:text-foreground"
          >
            <Check size={14} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-4 border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={`flex items-center gap-1.5 border-b-2 px-1 pb-2 text-xs font-medium transition-colors ${
            filter === "all"
              ? "border-brand text-foreground"
              : "border-transparent text-foreground-lighter hover:text-foreground-light"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`flex items-center gap-1.5 border-b-2 px-1 pb-2 text-xs font-medium transition-colors ${
            filter === "unread"
              ? "border-brand text-foreground"
              : "border-transparent text-foreground-lighter hover:text-foreground-light"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <Bell size={32} className="mx-auto mb-3 text-foreground-muted" />
            <p className="text-sm text-foreground-muted">
              {filter === "unread" ? "No unread notifications." : "No notifications."}
            </p>
          </div>
        )}
        {filtered.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            onClick={() => markRead(n.id)}
            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-100 ${
              !n.read ? "bg-surface-100/50" : ""
            }`}
          >
            <div className="mt-0.5">{typeIcon(n.type)}</div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-foreground-light"}`}>
                {n.title}
              </p>
              <p className="mt-0.5 text-[11px] text-foreground-muted">
                {n.repo} &middot; {n.time}
              </p>
            </div>
            {!n.read && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
