"use client";

import { useEffect, useState } from "react";

interface Props {
  productName: string;
}

export const AnalyzePricesButton = ({ productName }: Props) => {
  const [isChatReady, setIsChatReady] = useState(false);

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
    // 1. Open the chat window
    const chatToggle = document.querySelector(".chat-window-toggle");

    if (chatToggle) {
      (chatToggle as HTMLElement).click();
      console.log("Chat toggle clicked");
    } else {
      alert("Chat toggle button not found. Please check the selector.");
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
          }, 100);
        } else {
          alert("Send button not found. Please check the selector.");
        }
      } else {
        alert("Chat input not found. Please check the selector.");
      }
    }, 700); // Slightly longer delay to ensure chat is open
  };

  return (
    <button
      onClick={handleAnalyzePrices}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
      disabled={!isChatReady}
    >
      Analyze Prices
    </button>
  );
};
