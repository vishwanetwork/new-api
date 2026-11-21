import "../public/brand.css";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={"vg-brand-lockup " + className} aria-label="Vishwa Gateway">
      <img
        className="vg-brand-wordmark"
        src="./vishwa-wordmark.svg"
        alt="Vishwa"
        width="121"
        height="34"
      />
      <span className="vg-brand-product">Gateway</span>
    </span>
  );
}
