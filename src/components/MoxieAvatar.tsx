import moxieIcon from "@/assets/moxie/moxie-icon.png";
import moxieWave from "@/assets/moxie/moxie-wave.png";
import moxiePhone from "@/assets/moxie/moxie-phone.png";
import moxieMagnify from "@/assets/moxie/moxie-magnify.png";
import moxiePoint from "@/assets/moxie/moxie-point.png";
import moxieCheer from "@/assets/moxie/moxie-cheer.png";

export type MoxiePose = "icon" | "wave" | "phone" | "magnify" | "point" | "cheer";

const FIGURE_RATIO = 1140 / 1080;

const POSES: Record<MoxiePose, { src: string; alt: string; ratio: number }> = {
  icon: { src: moxieIcon, alt: "MOXIE", ratio: 1 },
  wave: { src: moxieWave, alt: "MOXIE waving", ratio: FIGURE_RATIO },
  phone: { src: moxiePhone, alt: "MOXIE holding up his phone", ratio: FIGURE_RATIO },
  magnify: { src: moxieMagnify, alt: "MOXIE with a magnifying glass", ratio: FIGURE_RATIO },
  point: { src: moxiePoint, alt: "MOXIE pointing", ratio: FIGURE_RATIO },
  cheer: { src: moxieCheer, alt: "MOXIE cheering", ratio: FIGURE_RATIO },
};

interface MoxieAvatarProps {
  pose: MoxiePose;
  size: number;
  decorative?: boolean;
  className?: string;
  loading?: "lazy" | "eager";
}

export function MoxieAvatar({ pose, size, decorative = false, className, loading }: MoxieAvatarProps) {
  const { src, alt, ratio } = POSES[pose];
  return (
    <img
      src={src}
      width={size}
      height={Math.round(size * ratio)}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      className={className}
      loading={loading}
      decoding="async"
      style={{ width: size, height: "auto", display: "block" }}
    />
  );
}
