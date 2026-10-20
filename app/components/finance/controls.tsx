"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { vi, enGB } from "date-fns/locale";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
} from "@/components/ui/combobox";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useFinanceLocale } from "./locale";
import { FinanceHeading } from "./heading";

export function SearchChoice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const { text } = useFinanceLocale();
  const items = options.map((o) => ({ ...o, label: text(o.label) }));
  return (
    <Combobox
      items={items}
      value={items.find((o) => o.value === value) ?? null}
      onValueChange={(v) => {
        if (v) onChange(v.value);
      }}
    >
      <ComboboxInput
        aria-label={text(label)}
        placeholder={text(label)}
        className="w-full sm:w-48"
      />
      <ComboboxContent data-readable-feature data-finance-typography>
        <ComboboxEmpty>{text("Chưa có dữ liệu phù hợp")}</ComboboxEmpty>
        <ComboboxList>
          {(item: { value: string; label: string }) => (
            <ComboboxGroup key={item.value}>
              <ComboboxItem value={item}>{item.label}</ComboboxItem>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function DateField({
  id,
  label,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  const { text, date, language } = useFinanceLocale();
  const selected = new Date(`${value}T12:00:00`);
  return (
    <Field>
      <FieldLabel htmlFor={id}>{text(label)}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              aria-label={`${text(label)}: ${date(value)}`}
              className="w-full justify-between"
            />
          }
        >
          <span>{date(value)}</span>
          <CalendarDays data-icon="inline-end" />
        </PopoverTrigger>
        <PopoverContent className="w-auto" align="start" data-readable-feature data-finance-typography>
          <Calendar
            mode="single"
            required
            selected={selected}
            defaultMonth={selected}
            locale={language === "vi" ? vi : enGB}
            captionLayout="dropdown"
            startMonth={new Date(`${min ?? "2020-01-01"}T12:00:00`)}
            endMonth={new Date(`${max ?? "2040-12-31"}T12:00:00`)}
            disabled={(d) => {
              const day = format(d, "yyyy-MM-dd");
              return !!((min && day < min) || (max && day > max));
            }}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export function RangeField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const { text, number } = useFinanceLocale();
  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>{text(label)}</FieldLabel>
        <span className="shrink-0 text-sm tabular-nums">
          {number(value)} {unit && text(unit)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={text(label)}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
      <Input
        id={id}
        aria-label={text(label)}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          onChange(
            Math.min(
              max,
              Math.max(min, Math.round(Number(e.target.value) || min)),
            ),
          )
        }
      />
    </Field>
  );
}

export function FinanceNotes({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  const { text } = useFinanceLocale();
  return (
    <Accordion className="finance-notes" multiple>
      {items.map((item, i) => (
        <AccordionItem key={item.title} value={String(i)}>
          <AccordionTrigger><FinanceHeading as="span">{text(item.title)}</FinanceHeading></AccordionTrigger>
          <AccordionContent>
            <FieldDescription>{text(item.body)}</FieldDescription>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
