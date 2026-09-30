import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "text";
  className?: string;
};

// 三种按钮共用相同触感、焦点态和圆角规则。
export function Button({ children, href, variant = "primary", className = "" }: ButtonProps) {
  const variants = {
    primary: "border-gold bg-gold text-ink hover:border-accentHover hover:bg-accentHover",
    secondary: "border-line/30 bg-ink/45 text-bone hover:border-gold hover:text-gold",
    text: "border-transparent p-0 text-bone hover:text-gold",
  };

  return (
    <Link
      href={href}
      className={`group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control border px-5 text-sm font-medium transition duration-300 ease-expo active:scale-[0.98] ${variants[variant]} ${className}`}
    >
      {children}
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        strokeWidth={1.5}
      />
    </Link>
  );
}
