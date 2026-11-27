import { useState } from "react";
import { X, Send } from "lucide-react";
import moxieIcon from "@/assets/moxie/moxie-icon.svg";

export function MoxieFloatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Moxie" : "Chat with Moxie"}
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 60,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#FF6B5C",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(255,107,92,0.45)",
          transition: "transform 150ms ease, box-shadow 150ms ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        {open ? (
          <X size={22} color="#fff" />
        ) : (
          <img src={moxieIcon} alt="Moxie" style={{ width: 32, height: 32 }} />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            left: 24,
            zIndex: 60,
            width: 320,
            maxHeight: "60vh",
            background: "#FFFFFF",
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding: "14px 16px", background: "#FF6B5C", display: "flex", alignItems: "center", gap: 10 }}>
            <img src={moxieIcon} alt="" style={{ width: 28, height: 28 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Moxie</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Your AI marketing strategist</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              background: "#F7F5F1",
              borderRadius: "12px 12px 12px 2px",
              padding: "10px 14px",
              fontSize: 13,
              color: "#15171C",
              lineHeight: 1.5,
              maxWidth: "85%",
            }}>
              Hey! I'm Moxie — your AI marketing strategist. Ask me anything about your strategy, content, or next moves. 👋
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #ECEAE5", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Ask Moxie anything…"
              style={{
                flex: 1,
                border: "1px solid #ECEAE5",
                borderRadius: 20,
                padding: "8px 14px",
                fontSize: 13,
                outline: "none",
                background: "#F7F5F1",
                color: "#15171C",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#FF6B5C"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#ECEAE5"; }}
            />
            <button
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#FF6B5C",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
