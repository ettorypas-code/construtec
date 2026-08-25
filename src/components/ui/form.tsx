import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";
import type { Option } from "@/domain/labels";

const controlBase =
  "w-full rounded-control border border-ink-200 bg-surface px-3 text-ink-900 " +
  "placeholder:text-ink-400 transition-colors " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 " +
  "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20";

const controlHeight = "h-11 sm:h-10";

/* -------------------------------------------------------------------------- */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
          {label}
          {required ? <span className="ml-0.5 text-danger">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, controlHeight, className)}
    />
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({ className, invalid, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "resize-y py-2.5 leading-relaxed", className)}
    />
  );
}

export type SelectProps<T extends string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  options: readonly Option<T>[];
  placeholder?: string;
  invalid?: boolean;
};

export function Select<T extends string>({
  options,
  placeholder,
  className,
  invalid,
  ...props
}: SelectProps<T>) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, controlHeight, "appearance-none pr-9", selectArrow, className)}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Seta desenhada em CSS para não depender de um ícone dentro do <select>. */
const selectArrow =
  "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 " +
  "viewBox=%220 0 20 20%22 fill=%22none%22 stroke=%22%236b6b67%22 stroke-width=%221.5%22>" +
  "<path d=%22M6 8l4 4 4-4%22/></svg>')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat";

/* -------------------------------------------------------------------------- */

export function Checkbox({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5", className)}>
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 size-4 shrink-0 rounded border-ink-300 text-brand-600 accent-brand-600"
      />
      <span className="text-sm text-ink-700">
        {label}
        {description ? <span className="mt-0.5 block text-xs text-ink-500">{description}</span> : null}
      </span>
    </label>
  );
}

/** Campo monetário: digita-se em reais, o form envia string e a action converte. */
export function MoneyInput({ className, ...props }: InputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-400">
        R$
      </span>
      <Input
        inputMode="decimal"
        placeholder="0,00"
        {...props}
        className={cn("pl-9 tabular", className)}
      />
    </div>
  );
}

/** Fieldset com título, para agrupar campos relacionados em formulários longos. */
export function FieldGroup({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("space-y-4", className)}>
      <legend className="text-sm font-semibold text-ink-900">
        {title}
        {description ? (
          <span className="mt-0.5 block text-xs font-normal text-ink-500">{description}</span>
        ) : null}
      </legend>
      {children}
    </fieldset>
  );
}
