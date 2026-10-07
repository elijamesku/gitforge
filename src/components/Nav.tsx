import Link from "next/link";
import { Anvil } from "lucide-react";

export default function Nav() {
  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Anvil size={20} className="text-brand" />
            Forge
          </Link>
          <Link
            href="/explore"
            className="text-xs text-foreground-lighter transition-colors hover:text-foreground"
          >
            Explore
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-md border border-border bg-surface-100 px-3 py-1 text-xs text-foreground-muted sm:block">
            Search or jump to...
          </div>
          <Link
            href="/new"
            className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white transition-colors hover:brightness-110"
          >
            New repository
          </Link>
        </div>
      </div>
    </nav>
  );
}
