import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TiptapImage from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  List,
  ListOrdered,
  Minus,
  MousePointerClick,
  Palette,
  Image as ImageIconLucide,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const PRESET_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Coral", value: "#FF6B5C" },
  { name: "Navy", value: "#262833" },
  { name: "Gray", value: "#6b7280" },
  { name: "White", value: "#ffffff" },
];

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function LinkButton({ editor }: { editor: Editor }) {
  function handleClick() {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank" })
      .run();
  }

  return (
    <ToolbarButton
      onClick={handleClick}
      active={editor.isActive("link")}
      title="Insert link"
    >
      <Link2 className="h-4 w-4" />
    </ToolbarButton>
  );
}

function ColorPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("#000000");

  function pick(color: string) {
    editor.chain().focus().setColor(color).run();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton title="Text color">
          <Palette className="h-4 w-4" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent className="w-56 space-y-3">
        <div className="grid grid-cols-5 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => pick(c.value)}
              className="h-8 w-8 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Custom</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="h-9 w-12 rounded border border-input cursor-pointer"
            />
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => pick(custom)} className="w-full mt-1">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CtaPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("Get started");
  const [url, setUrl] = useState("");

  function insert() {
    if (!url.trim() || !text.trim()) return;
    const html = `<p><a href="${url}" style="display:inline-block;background:#FF6B5C;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">${text}</a></p>`;
    editor.chain().focus().insertContent(html).run();
    setOpen(false);
    setUrl("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton title="Insert CTA button">
          <MousePointerClick className="h-4 w-4" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Button text</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <Button onClick={insert} className="w-full" size="sm">
          Insert Button
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function ImageButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function insertImage(src: string) {
    editor
      .chain()
      .focus()
      .setImage({ src })
      .run();
    // Apply default 100% width via attributes
    setTimeout(() => {
      editor
        .chain()
        .focus()
        .updateAttributes("image", { width: "100%" })
        .run();
    }, 0);
    setOpen(false);
    setUrl("");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type);
    if (!ok) {
      alert("Please choose a JPG, PNG, GIF, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be 5MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => insertImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <>
      <ToolbarButton onClick={() => setOpen(true)} title="Insert image">
        <ImageIconLucide className="h-4 w-4" />
      </ToolbarButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-3 pt-3">
              <Label className="text-xs">Choose an image (max 5MB)</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFile}
              />
            </TabsContent>
            <TabsContent value="url" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Image URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => url.trim() && insertImage(url.trim())}
              >
                Insert
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ImageResizeControls({ editor }: { editor: Editor }) {
  if (!editor.isActive("image")) return null;
  const current = (editor.getAttributes("image").width as string) || "100%";
  const set = (w: string) =>
    editor.chain().focus().updateAttributes("image", { width: w }).run();
  return (
    <div className="flex items-center gap-1 border-t border-border bg-muted/30 px-3 py-1.5 text-xs">
      <span className="text-muted-foreground mr-1">Image width:</span>
      {(["50%", "75%", "100%"] as const).map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => set(w)}
          className={cn(
            "rounded px-2 py-0.5 hover:bg-muted",
            current === w && "bg-foreground text-background hover:bg-foreground",
          )}
        >
          {w}
        </button>
      ))}
    </div>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      TiptapImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded max-w-full h-auto cursor-pointer",
          style: "height:auto;",
        },
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] p-6 [&_p]:my-2 [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:mt-4 [&_h2]:mb-2",
      },
    },
  });

  // Sync external content changes (e.g. AI-generated draft)
  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
     
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="rounded-md border border-input bg-white min-h-[460px]" />
    );
  }

  const setHeading = (level: 1 | 2 | null) => {
    if (level === null) editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level }).run();
  };

  const setAlign = (align: "left" | "center" | "right") => {
    editor.chain().focus().setTextAlign(align).run();
  };

  return (
    <div className="rounded-md border border-input bg-white overflow-hidden">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1.5 backdrop-blur">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => setHeading(1)}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setHeading(2)}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setHeading(null)}
          active={editor.isActive("paragraph")}
          title="Normal text"
        >
          <Type className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => setAlign("left")}
          active={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setAlign("center")}
          active={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setAlign("right")}
          active={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <LinkButton editor={editor} />
        <ColorPopover editor={editor} />
        <ImageButton editor={editor} />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <CtaPopover editor={editor} />
      </div>

      <ImageResizeControls editor={editor} />

      <div className="bg-white" data-placeholder={placeholder}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}