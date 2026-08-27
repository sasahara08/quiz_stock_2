import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  /** 入力条件などの補足。ラベルの下に小さく表示する */
  hint?: string;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  children,
  hint,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
