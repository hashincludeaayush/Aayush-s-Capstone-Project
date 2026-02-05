"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LineChart, Loader2, Sparkles } from "lucide-react";

interface Props {
  productName: string;
}

const STATUS_LINES = [
  "Warming up the analysis engine…",
  "Connecting to pricing sources…",
  "Gathering recent price signals…",
  "Normalizing currencies and discounts…",
  "Scanning for comparable listings…",
  "Computing trend direction and volatility…",
  "Detecting seasonality and spikes…",
  "Synthesizing a buy-timing recommendation…",
  "Packaging the summary for you…",
  "Final checks before sending…",
] as const;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startChatStatusSequence() {
  const root = document.querySelector(".n8n-chat") as HTMLElement | null;
  if (!root) return () => {};

  root.classList.add("jynx-chat-status-active");

  let stopped = false;
  let rotateTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let observer: MutationObserver | null = null;

  const lines = shuffle(Array.from(STATUS_LINES));
  let index = 0;

  const getList = () =>
    (root.querySelector(".chat-messages-list") as HTMLElement | null) ??
    (document.querySelector(".chat-messages-list") as HTMLElement | null);

  const ensureEl = () => {
    const list = getList();
    if (!list) return null;

    let el = list.querySelector(".jynx-chat-status") as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.className = "jynx-chat-status";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.innerHTML =
        '<span class="jynx-chat-status__dot" aria-hidden="true"></span>' +
        '<span class="jynx-chat-status__text"></span>';
      list.appendChild(el);
    }

    // Keep it visible.
    try {
      list.scrollTop = list.scrollHeight;
    } catch {
      // ignore
    }

    return el;
  };

  const update = () => {
    const el = ensureEl();
    if (!el) return;
    const textEl = el.querySelector(
      ".jynx-chat-status__text",
    ) as HTMLElement | null;
    if (!textEl) return;
    const next = lines[Math.min(index, lines.length - 1)];
    textEl.textContent = next;
    index = Math.min(index + 1, lines.length - 1);
  };

  const getNextDelayMs = () => {
    // Random 5–10 seconds between status updates.
    const min = 5_000;
    const max = 10_000;
    return Math.floor(min + Math.random() * (max - min + 1));
  };

  const scheduleNext = () => {
    if (stopped) return;
    if (index >= lines.length - 1) return;
    rotateTimeoutId = setTimeout(() => {
      if (stopped) return;
      update();
      scheduleNext();
    }, getNextDelayMs());
  };

  const cleanup = () => {
    if (stopped) return;
    stopped = true;

    if (rotateTimeoutId) clearTimeout(rotateTimeoutId);
    if (timeoutId) clearTimeout(timeoutId);
    observer?.disconnect();

    root.querySelector(".jynx-chat-status")?.remove();
    root.classList.remove("jynx-chat-status-active");
  };

  // Start immediately; messages list may mount a bit later.
  update();
  scheduleNext();

  // Stop when the library removes typing indicator (response received).
  const checkDone = () => {
    if (stopped) return;
    const typing = root.querySelector(".chat-message-typing");
    if (!typing) cleanup();
  };

  observer = new MutationObserver(checkDone);
  observer.observe(root, { childList: true, subtree: true });

  // Safety cleanup in case the typing indicator never disappears.
  timeoutId = setTimeout(cleanup, 90_000);

  return cleanup;
}

export const AnalyzePricesButton = ({ productName }: Props) => {
  const [isChatReady, setIsChatReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const statusCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      statusCleanupRef.current?.();
      statusCleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Wait for the n8n chat widget to be present
    const checkChatReady = setInterval(() => {
      const chatContainer = document.querySelector("#n8n-chat");
      const chatToggle = document.querySelector(".chat-window-toggle");
      if (chatContainer && chatToggle) {
        setIsChatReady(true);
        clearInterval(checkChatReady);
      }
    }, 500);

    return () => clearInterval(checkChatReady);
  }, []);

  const handleAnalyzePrices = () => {
    if (!isChatReady || isSending) return;
    setIsSending(true);

    // 1. Open the chat window
    const chatToggle = document.querySelector(".chat-window-toggle");

    if (chatToggle) {
      (chatToggle as HTMLElement).click();
      console.log("Chat toggle clicked");
    } else {
      alert("Chat toggle button not found. Please check the selector.");
      setIsSending(false);
      return;
    }

    // 2. Wait for the chat input to appear, then send the message
    setTimeout(() => {
      const message = `Please analyze the prices for "${productName}". What are the price trends and is this a good time to buy?`;

      const chatInput = document.querySelector(
        ".chat-input textarea",
      ) as HTMLTextAreaElement;

      if (chatInput) {
        chatInput.value = message;
        chatInput.dispatchEvent(new Event("input", { bubbles: true }));
        chatInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("Message set in input");

        // Find the send button
        const sendButton = document.querySelector(
          ".chat-input-send-button",
        ) as HTMLElement;

        if (sendButton) {
          setTimeout(() => {
            statusCleanupRef.current?.();
            statusCleanupRef.current = startChatStatusSequence();
            sendButton.click();
            console.log("Send button clicked");
            setTimeout(() => setIsSending(false), 700);
          }, 100);
        } else {
          alert("Send button not found. Please check the selector.");
          setIsSending(false);
        }
      } else {
        alert("Chat input not found. Please check the selector.");
        setIsSending(false);
      }
    }, 700); // Slightly longer delay to ensure chat is open
  };

  return (
    <div className="w-full sm:w-auto">
      <div className="rounded-xl bg-gradient-to-r from-primary-orange/70 via-chart-1/70 to-primary-green/70 p-[1px] shadow-xs">
        <Button
          type="button"
          onClick={handleAnalyzePrices}
          disabled={!isChatReady || isSending}
          className={cn(
            "h-11 w-full rounded-xl bg-neutral-black/70 text-white-100 border border-white-100/10",
            "backdrop-blur-md px-5 font-semibold",
            "hover:bg-neutral-black/60",
            "focus-visible:ring-2 focus-visible:ring-white-100/30",
            "disabled:opacity-60",
          )}
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : !isChatReady ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}

          <span className="flex-1 text-left">
            {isSending
              ? "Analyzing…"
              : !isChatReady
                ? "Preparing assistant…"
                : "Analyze prices with AI agent chat"}
          </span>

          <LineChart className="ml-2 h-4 w-4 text-white-100/80" />
        </Button>
      </div>
      <p className="mt-2 text-xs text-white-200/80">
        Uses AI agents to fetch and explain price trends.
      </p>
    </div>
  );
};
