"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { value: string; label: string };

/** A filter dropdown that keeps its value in the URL search params. */
export function UrlSelect({
  param,
  value,
  options,
  label,
}: {
  param: string;
  value: string;
  options: Option[];
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string | null) {
    if (next === null) return;
    const params = new URLSearchParams(searchParams);
    params.set(param, next);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <Select value={value} onValueChange={onChange} items={options}>
      <SelectTrigger aria-label={label} className="min-w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
