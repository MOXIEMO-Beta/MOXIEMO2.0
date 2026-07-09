import { useAuth } from "@/hooks/useAuth";
import MediaLibrary from "@/components/media/MediaLibrary";

export default function Media() {
  const { user } = useAuth();
  return <MediaLibrary userId={user?.id ?? null} mode="page" />;
}