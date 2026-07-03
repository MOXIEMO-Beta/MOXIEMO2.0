import CalendarTab from "./CalendarTab";

type Props = {
  userId: string | null;
  onEditPost: (postId: string) => void;
  onCreateAtDate: (dateIso: string, pillar?: string) => void;
  onImportFromContent: () => void;
};

export default function CalendarTabWrapper(props: Props) {
  return <CalendarTab {...props} />;
}