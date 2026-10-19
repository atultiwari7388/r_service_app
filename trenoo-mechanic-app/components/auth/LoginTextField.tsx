"use client";

import React from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export interface LoginTextFieldProps {
  id: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  hintText: string;
  icon: "email" | "security";
  isPass?: boolean;
  obscureText?: boolean;
  onToggleObscureText?: () => void;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
}

export function LoginTextField({
  id,
  type,
  value,
  onChange,
  hintText,
  icon,
  isPass = false,
  obscureText = false,
  onToggleObscureText,
  disabled = false,
  autoComplete,
  required = true,
}: LoginTextFieldProps) {
  return (
    <div className="my-1.5 w-full">
      <div className="relative flex items-center bg-white rounded-xl border border-gray-300 focus-within:border-[#F96176] focus-within:ring-1 focus-within:ring-[#F96176] transition shadow-xs">
        {/* Prefix Icon */}
        <div className="pl-3.5 pr-2 flex items-center justify-center text-[#F96176] shrink-0">
          {icon === "email" ? (
            <Mail className="w-5 h-5" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
        </div>

        {/* Input */}
        <input
          id={id}
          type={isPass ? (obscureText ? "password" : "text") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hintText}
          disabled={disabled}
          autoComplete={autoComplete}
          required={required}
          className="w-full py-3.5 pr-3 text-sm text-gray-800 placeholder:text-[#C1C0C8] bg-transparent outline-none disabled:opacity-50"
        />

        {/* Suffix Icon for Password Toggle */}
        {isPass && onToggleObscureText && (
          <button
            type="button"
            onClick={onToggleObscureText}
            tabIndex={-1}
            className="pr-3.5 pl-2 text-[#F96176] hover:text-[#d94258] transition focus:outline-none"
            aria-label={obscureText ? "Show password" : "Hide password"}
          >
            {obscureText ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default LoginTextField;
