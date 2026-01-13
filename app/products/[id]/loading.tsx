export default function LoadingProductDetails() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#151422]/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-[92%] max-w-md rounded-2xl border border-white-100/15 bg-neutral-black/60 px-6 py-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-orange/30 via-chart-1/25 to-primary-green/30"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white-100 text-sm font-semibold">
              Loading product…
            </p>
            <p className="text-white-200 text-xs">
              Fetching details and price history
            </p>
          </div>

          <div className="flex items-center gap-1" aria-hidden="true">
            <span
              className="h-2 w-2 rounded-full bg-primary-orange animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-primary-orange animate-bounce"
              style={{ animationDelay: "140ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-primary-orange animate-bounce"
              style={{ animationDelay: "280ms" }}
            />
          </div>
        </div>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white-100/10">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary-orange via-chart-1 to-primary-green animate-[shimmer_1.1s_ease-in-out_infinite]" />
        </div>

        <div className="mt-6 space-y-3" aria-hidden="true">
          <div className="h-4 w-3/4 rounded bg-white-100/10" />
          <div className="h-4 w-5/6 rounded bg-white-100/10" />
          <div className="h-4 w-2/3 rounded bg-white-100/10" />
          <div className="pt-2 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-xl bg-white-100/10" />
            <div className="h-12 rounded-xl bg-white-100/10" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-20%); opacity: 0.75; }
          50% { transform: translateX(120%); opacity: 1; }
          100% { transform: translateX(-20%); opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
