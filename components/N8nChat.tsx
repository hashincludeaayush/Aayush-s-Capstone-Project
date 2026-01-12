"use client";

import { useEffect, useRef } from "react";
import { createChat } from "@n8n/chat";
import "@n8n/chat/style.css"; // Import the default styles

export const N8nChat = () => {
  // Use a ref to prevent double-initialization in React Strict Mode
  const isInitialized = useRef(false);

  useEffect(() => {
    // Clear any existing chat sessions from localStorage
    const chatStorageKeys = Object.keys(localStorage).filter(
      (key) => key.includes("n8n") || key.includes("chat")
    );
    chatStorageKeys.forEach((key) => localStorage.removeItem(key));

    // Only run if not already initialized
    if (!isInitialized.current) {
      createChat({
        webhookUrl:
          "https://workflows.shoto.cloud/webhook/53f3c259-1b88-4571-9220-e0b8027b7a7f/chat", // <--- PASTE YOUR URL HERE
        mode: "window", // 'window' creates the floating bubble automatically
        target: "#n8n-chat", // We will render this div below
        showWelcomeScreen: true,
        initialMessages: [
          "Hi there! 👋",
          "I am your AI Price Detective. How can I help you save money today?",
        ],
        i18n: {
          en: {
            title: "Price Detective",
            subtitle: "AI Price History & Comparison",
            footer: "Powered by n8n",
            getStarted: "New Conversation",
            inputPlaceholder: "Type your message...",
            closeButtonTooltip: "",
          },
        },
      });

      // Mark as initialized so it doesn't run again
      isInitialized.current = true;

      // Style user messages to black color
      const style = document.createElement("style");
      style.textContent = `
        /* Target all user message text */
        [class*="chat"] [class*="user"] {
          color: black !important;
        }
        /* Target input and text areas */
        [class*="chat"] input,
        [class*="chat"] textarea {
          color: black !important;
        }
        /* Target message containers */
        .n8n-chat-message-user,
        .user-message,
        [class*="message-user"] {
          color: black !important;
        }
        /* Override any inline styles */
        * {
          --chat-user-text-color: black !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // We return a div with the specific ID for the chat to attach to
  return <div id="n8n-chat" />;
};
