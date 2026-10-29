import postImage from "@/assets/blog/moxie-founder-story.jpg.asset.json";

export function MoxieBlogImage({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={postImage.url} alt="Neon sunset over geometric mountains and a pink perspective grid" className="absolute inset-0 h-full w-full object-cover object-center" />
    </div>
  );
}