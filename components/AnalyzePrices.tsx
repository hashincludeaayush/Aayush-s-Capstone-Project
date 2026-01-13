"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LineChart, Loader2, Sparkles } from "lucide-react";

interface Props {
  productName: string;
}

export const AnalyzePricesButton = ({ productName }: Props) => {
  const [isChatReady, setIsChatReady] = useState(false);
  const [isSending, setIsSending] = useState(false);

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
        ".chat-input textarea"
      ) as HTMLTextAreaElement;

      if (chatInput) {
        chatInput.value = message;
        chatInput.dispatchEvent(new Event("input", { bubbles: true }));
        chatInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("Message set in input");

        // Find the send button
        const sendButton = document.querySelector(
          ".chat-input-send-button"
        ) as HTMLElement;

        if (sendButton) {
          setTimeout(() => {
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
            "disabled:opacity-60"
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
              : "Analyze Prices"}
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
