"use client";

import { scrapeAndStoreProduct } from "@/lib/actions";
import {
  CSSProperties,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

const WAIT_VIDEOS = [
  {
    title: "Evenfall",
    src: "/assets/videos/video-1.mp4",
  },
  {
    title: "Aurora",
    src: "/assets/videos/video-2.mp4",
  },
  {
    title: "Cosmos",
    src: "/assets/videos/video-3.mp4",
  },
] satisfies ReadonlyArray<{ title: string; src: string }>;

const isValidProductURL = (value: string) => {
  const url = value.trim();
  if (!url) return false;

  try {
    const parsed = new URL(url);

    // Only allow web URLs.
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return false;

    // Basic hostname sanity.
    if (!parsed.hostname) return false;

    return true;
  } catch {
    return false;
  }
};

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState<{
    text: string;
    tone: "gaming" | "ecommerce" | "digital" | "marketplace" | "general";
  }>({ text: "", tone: "general" });
  const quoteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [isActiveMuted, setIsActiveMuted] = useState(false);
  const [isActivePlaying, setIsActivePlaying] = useState(false);

  const quoteGenerator = useMemo(() => {
    const pools = {
      gaming: [
        "Game prices often move around major seasonal events.",
        "In-game stores use scarcity to drive quick decisions—watch for it.",
        "Regional pricing can change perceived value drastically.",
        "Bundles can be value, but compare the price history too.",
      ],
      ecommerce: [
        "Price history beats gut-feel when timing a buy.",
        "Free shipping thresholds often change cart behavior.",
        "Clear return policies reduce purchase anxiety.",
        "A “good deal” often depends on seasonality and stock.",
      ],
      digital: [
        "For digital goods, promotions are frequent—track the baseline price.",
        "Subscriptions win on retention when pricing is predictable.",
        "Trials convert better when cancellation is easy.",
        "Versioning changes can shift willingness-to-pay quickly.",
      ],
      marketplace: [
        "Small friction changes can shift conversion fast in marketplaces.",
        "Trust signals (reviews, badges) are often stronger than discounts.",
        "Stable pricing builds trust; sudden spikes raise churn.",
        "Clean product titles help both search and trust.",
      ],
      general: [
        "Wishlist tracking is the simplest way to catch dips.",
        "Discounts feel bigger when the baseline price is consistent.",
        "Compare alternatives—similar products can reveal the true range.",
        "Track price drops, not hype.",
      ],
    } as const;

    const openers = ["Quick tip:", "Fun fact:", "Meanwhile:", "Pro move:"];
    const tones: Array<keyof typeof pools> = [
      "gaming",
      "ecommerce",
      "digital",
      "marketplace",
      "general",
    ];

    return () => {
      const tone = tones[Math.floor(Math.random() * tones.length)];
      const opener = openers[Math.floor(Math.random() * openers.length)];
      const tip = pools[tone][Math.floor(Math.random() * pools[tone].length)];
      return { tone, text: `${opener} ${tip}` };
    };
  }, []);

  const quoteStyle = useMemo(() => {
    switch (loadingQuote.tone) {
      case "gaming":
        return {
          chip: "border-l-4 border-primary-green bg-primary-green/10",
          label: "Gaming",
        };
      case "ecommerce":
        return {
          chip: "border-l-4 border-primary-orange bg-primary-orange/10",
          label: "Ecommerce",
        };
      case "digital":
        return {
          chip: "border-l-4 border-destructive bg-destructive/10",
          label: "Digital",
        };
      case "marketplace":
        return {
          chip: "border-l-4 border-chart-1 bg-chart-1/10",
          label: "Marketplace",
        };
      default:
        return {
          chip: "border-l-4 border-white-100/30 bg-white-100/10",
          label: "Insight",
        };
    }
  }, [loadingQuote.tone]);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
      quoteIntervalRef.current = null;
      return;
    }

    // Reset carousel state each time a new scrape starts
    setActiveVideoIndex(0);
    // Pause any previously playing videos
    videoRefs.current.forEach((v) => {
      try {
        v?.pause();
      } catch {
        // ignore
      }
    });

    setLoadingQuote(quoteGenerator());
    quoteIntervalRef.current = setInterval(() => {
      setLoadingQuote(quoteGenerator());
    }, 2600);

    return () => {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
      quoteIntervalRef.current = null;
    };
  }, [isLoading, quoteGenerator]);

  useEffect(() => {
    // Keep UI simple on very small screens (avoid 3D offscreen cards).
    const media = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsSmallScreen(media.matches);
    onChange();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    // When switching cards, pause non-active videos so audio doesn't stack.
    videoRefs.current.forEach((v, idx) => {
      if (!v) return;
      if (idx !== activeVideoIndex) {
        try {
          v.pause();
        } catch {
          // ignore
        }
      }
    });

    const active = videoRefs.current[activeVideoIndex];
    setIsActiveMuted(Boolean(active?.muted));
    setIsActivePlaying(active ? !active.paused : false);
  }, [activeVideoIndex]);

  const goPrevVideo = () => {
    setActiveVideoIndex(
      (prev) => (prev - 1 + WAIT_VIDEOS.length) % WAIT_VIDEOS.length
    );
  };

  const goNextVideo = () => {
    setActiveVideoIndex((prev) => (prev + 1) % WAIT_VIDEOS.length);
  };

  const getCardStyle = (index: number): CSSProperties => {
    const total = WAIT_VIDEOS.length;
    if (total === 0) return {};

    // Normalize offset to [-1, 0, 1] for a 3-card carousel.
    const raw = (index - activeVideoIndex + total) % total;
    const offset = raw === 0 ? 0 : raw === 1 ? 1 : -1;

    const base: CSSProperties = {
      transformStyle: "preserve-3d",
      transition: "transform 450ms ease, opacity 450ms ease",
    };

    if (isSmallScreen) {
      if (offset === 0) {
        return {
          ...base,
          zIndex: 3,
          opacity: 1,
          transform: "translate(-50%, -50%) scale(1)",
          pointerEvents: "auto",
        };
      }

      return {
        ...base,
        zIndex: 1,
        opacity: 0,
        transform: "translate(-50%, -50%) scale(0.96)",
        pointerEvents: "none",
      };
    }

    if (offset === 0) {
      return {
        ...base,
        zIndex: 3,
        opacity: 1,
        transform:
          "translate(-50%, -50%) translateZ(140px) rotateY(0deg) scale(1)",
      };
    }

    if (offset === -1) {
      return {
        ...base,
        zIndex: 2,
        opacity: 0.85,
        transform:
          "translate(-50%, -50%) translateX(-280px) translateZ(30px) rotateY(34deg) scale(0.88)",
      };
    }

    return {
      ...base,
      zIndex: 2,
      opacity: 0.85,
      transform:
        "translate(-50%, -50%) translateX(280px) translateZ(30px) rotateY(-34deg) scale(0.88)",
    };
  };

  const toggleMute = () => {
    const active = videoRefs.current[activeVideoIndex];
    if (!active) return;
    const nextMuted = !active.muted;
    active.muted = nextMuted;
    setIsActiveMuted(nextMuted);
  };

  const togglePlayPause = async () => {
    const active = videoRefs.current[activeVideoIndex];
    if (!active) return;

    try {
      if (active.paused) {
        await active.play();
        setIsActivePlaying(true);
      } else {
        active.pause();
        setIsActivePlaying(false);
      }
    } catch {
      // ignore autoplay/gesture errors
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidLink = isValidProductURL(searchPrompt);

    if (!isValidLink) return alert("Please provide a valid product URL");

    try {
      setIsLoading(true);

      // Scrape the product page
      const result = await scrapeAndStoreProduct(searchPrompt);

      if (result?.status === "complete" && result?.productId) {
        toast({
          variant: "success",
          title: "Scrape complete",
          description: "Opening the product page…",
        });

        router.push(`/products/${result.productId}`);
        return;
      }

      if (result?.status === "queued") {
        toast({
          variant: "success",
          title: "Scrape started",
          description:
            result.message ||
            "The workflow ran successfully. The product may appear in a moment.",
        });
        return;
      }

      const message =
        (result as any)?.message ||
        "Couldn’t reach the workflow. Please try again.";
      throw new Error(message);
    } catch (error) {
      console.log(error);

      const description =
        error instanceof Error && error.message
          ? error.message
          : "Couldn’t reach the workflow. Please try again.";

      toast({
        variant: "error",
        title: "Scrape failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-10 sm:mt-150">
      <form
        className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 sm:gap-4"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={searchPrompt}
          onChange={(e) => setSearchPrompt(e.target.value)}
          placeholder="Enter product link"
          className="searchbar-input"
          disabled={isLoading}
        />

        <Button type="submit" className="searchbar-btn" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </form>

      {isLoading && (
        <div
          className="mt-6 w-full max-w-[1100px] rounded-xl border border-white-100/15 bg-neutral-black/50 backdrop-blur-md px-7 py-7 shadow-xs"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded-full border-2 border-white-100/25 border-t-primary-orange animate-spin"
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <p className="text-white-100 text-sm font-semibold">
                  Running workflow…
                </p>
                <p className="text-white-200 text-sm">
                  Scraping the page and calculating price history.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 pt-1" aria-hidden="true">
              <span
                className="h-2 w-2 rounded-full bg-primary-orange animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-primary-orange animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-primary-orange animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>

          <div className={`mt-4 rounded-lg px-4 py-3 ${quoteStyle.chip}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-white-100 text-xs font-semibold tracking-wide">
                {quoteStyle.label}
              </p>
            </div>
            <p className="mt-1 text-white-100 text-sm">{loadingQuote.text}</p>
          </div>

          <div className="mt-5 rounded-xl border border-white-100/15 bg-gradient-to-r from-primary-orange/10 via-chart-1/10 to-primary-green/10 px-6 py-6 shadow-xs">
            <p className="text-white-100 text-base font-bold tracking-tight">
              While You Wait, Watch Our Original Shoto Cloud Videos Created By
              Aayush Singh
            </p>

            <div className="mt-3">
              <div
                className="relative w-full h-[320px] sm:h-[460px] overflow-hidden sm:overflow-visible rounded-lg"
                style={{ perspective: "1400px" }}
              >
                {WAIT_VIDEOS.map((video, idx) => {
                  const isActive = idx === activeVideoIndex;
                  return (
                    <div
                      key={video.src}
                      onClick={() => setActiveVideoIndex(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveVideoIndex(idx);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="absolute left-1/2 top-1/2 w-[94%] sm:w-[86%] max-w-[760px] cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      style={getCardStyle(idx)}
                      aria-label={`Show video: ${video.title}`}
                    >
                      <div className="transform-gpu rounded-xl border border-white-100/15 bg-neutral-black/40 backdrop-blur-md px-5 py-4 shadow-xs">
                        <p className="text-white-100 text-base font-semibold tracking-tight">
                          {video.title}
                        </p>
                        <video
                          ref={(el) => {
                            videoRefs.current[idx] = el;
                          }}
                          className="mt-2 w-full rounded-lg"
                          controls
                          preload="metadata"
                          src={video.src}
                          playsInline
                          onPlay={() => {
                            if (idx === activeVideoIndex)
                              setIsActivePlaying(true);
                          }}
                          onPause={() => {
                            if (idx === activeVideoIndex)
                              setIsActivePlaying(false);
                          }}
                          onVolumeChange={() => {
                            if (idx === activeVideoIndex) {
                              setIsActiveMuted(
                                Boolean(videoRefs.current[idx]?.muted)
                              );
                            }
                          }}
                        />
                        {!isActive && (
                          <p className="mt-2 text-xs text-white-200">
                            Click to focus
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={goPrevVideo}
                >
                  Prev
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={togglePlayPause}
                  >
                    {isActivePlaying ? "Pause" : "Play"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={toggleMute}
                  >
                    {isActiveMuted ? "Unmute" : "Mute"}
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs text-white-200">
                    {activeVideoIndex + 1} / {WAIT_VIDEOS.length}
                  </p>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={goNextVideo}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Searchbar;
