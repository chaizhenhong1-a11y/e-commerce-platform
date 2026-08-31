type IconName = "wishlist" | "account" | "orders" | "cart";

export function HeaderActionIcon({
  name,
}: {
  name: IconName;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };

  if (name === "wishlist") {
    return (
      <svg {...common}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
    );
  }

  if (name === "account") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.5 19.2c.7-3.3 3.1-5.2 6.5-5.2s5.8 1.9 6.5 5.2" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...common}>
        <path d="M7 3.75h10A2.25 2.25 0 0 1 19.25 6v14.25l-2.5-1.5-2.25 1.5-2.5-1.5-2.5 1.5-2.25-1.5-2.5 1.5V6A2.25 2.25 0 0 1 7 3.75Z" />
        <path d="M8.25 8h7.5M8.25 11.5h7.5M8.25 15h4.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M3.75 5.5h2l1.45 9.1a2 2 0 0 0 1.98 1.68h7.9a2 2 0 0 0 1.96-1.62L20.2 8H6.15" />
      <circle cx="9.5" cy="19" r="1.15" />
      <circle cx="17.25" cy="19" r="1.15" />
    </svg>
  );
}
