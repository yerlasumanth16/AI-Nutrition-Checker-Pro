import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50", className)} {...props} />;
}
