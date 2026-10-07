"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRepo() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, name, description, visibility }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create repository");
        return;
      }

      router.push(`/${user}/${name}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Create a new repository</h1>
      <p className="mb-6 text-xs text-foreground-lighter">
        A repository contains all project files, including the revision history.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-light">Owner</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="username"
              required
              className="w-full rounded-md border border-border bg-surface-100 px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <span className="pb-1.5 text-lg text-foreground-muted">/</span>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-light">Repository name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-project"
              required
              pattern="[a-zA-Z0-9_.\-]+"
              className="w-full rounded-md border border-border bg-surface-100 px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-light">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full rounded-md border border-border bg-surface-100 px-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground-light">Visibility</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-foreground-light">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
                className="accent-brand"
              />
              Public
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground-light">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
                className="accent-brand"
              />
              Private
            </label>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand px-4 py-2 text-xs font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create repository"}
        </button>
      </form>
    </main>
  );
}
