"use client";

import { useEffect, useRef } from "react";
import { createChat } from "@n8n/chat";
import "@n8n/chat/style.css"; // Import the default styles

export const N8nChat = () => {
  // Use a ref to prevent double-initialization in React Strict Mode
  const isInitialized = useRef(false);

  useEffect(() => {
    // Reset only the n8n chat session (avoid clearing unrelated app keys)
    try {
      localStorage.removeItem("n8n-chat/sessionId");
    } catch {
      // Ignore storage access errors (e.g. blocked in some contexts)
    }

    // Only run if not already initialized
    if (!isInitialized.current) {
      createChat({
        webhookUrl:
          "https://workflows.shoto.cloud/webhook/53f3c259-1b88-4571-9220-e0b8027b7a7f/chat", // <--- PASTE YOUR URL HERE
        mode: "window", // 'window' creates the floating bubble automatically
        target: "#n8n-chat", // We will render this div below
        loadPreviousSession: false,
        showWelcomeScreen: false,
        initialMessages: [
          "Hi there! 👋",
          "I am your AI Price Detective. How can I help you save money today?",
        ],
        i18n: {
          en: {
            title: "Price Detective",
            subtitle: "AI Price History & Comparison",
            footer: "",
            getStarted: "New Conversation",
            inputPlaceholder: "Type your message...",
            closeButtonTooltip: "",
          },
        },
      });

      // Mark as initialized so it doesn't run again
      isInitialized.current = true;
    }
  }, []);

  // We return a div with the specific ID for the chat to attach to
  return <div id="n8n-chat" />;
};
