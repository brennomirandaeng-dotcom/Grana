"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

function centsToDisplay(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Input monetário estilo "calculadora": os dígitos digitados sempre entram pela
 * direita (como um caixa eletrônico), independente da posição do cursor. Evita
 * o bug clássico de inputs de moeda em React onde editar no meio do texto
 * desalinha o valor.
 */
export function CurrencyInput({ value, onChange, className, id, placeholder = "0,00", autoFocus }: CurrencyInputProps) {
  const cents = Math.round(value * 100);
  const display = centsToDisplay(cents);

  function setCents(next: number) {
    const clamped = Math.max(0, Math.min(next, 999_999_999_999));
    onChange(clamped / 100);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setCents(cents * 10 + Number(e.key));
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      setCents(Math.floor(cents / 10));
      return;
    }
    if (["Tab", "Enter", "ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(e.key)) return;
    e.preventDefault();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (digits) setCents(parseInt(digits, 10));
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
      <Input
        id={id}
        inputMode="numeric"
        value={display}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn("pl-9 text-right font-medium", className)}
      />
    </div>
  );
}
