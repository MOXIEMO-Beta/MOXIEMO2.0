import { MoxieAvatar } from "@/components/MoxieAvatar";

export function MoxieBlogImage({ className = "" }: { className?: string }) {
  return (
    <div className={`relative bg-[var(--cookie-surface)] ${className}`}>
      <MoxieAvatar pose="magnify" size={280} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 !h-[60%] !w-auto object-contain" />
    </div>
  );
}