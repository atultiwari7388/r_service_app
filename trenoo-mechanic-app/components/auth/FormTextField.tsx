"use client";

import React from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Store,
  Phone,
  PhoneCall,
  Home,
  Building2,
  MapPin,
  Globe,
  Archive,
  Cake,
  Briefcase,
  FileText,
} from "lucide-react";

export type IconType =
  | "account"
  | "store"
  | "phone"
  | "phone_classic"
  | "email"
  | "home"
  | "city"
  | "map_marker"
  | "earth"
  | "zip_box"
  | "cake"
  | "briefcase"
  | "text"
  | "security";

export interface FormTextFieldProps {
  id: string;
  type?: "email" | "password" | "text" | "tel" | "number";
  value: string;
  onChange: (value: string) => void;
  hintText: string;
  icon: IconType;
  isPass?: boolean;
  obscureText?: boolean;
  onToggleObscureText?: () => void;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  isMultiline?: boolean;
  rows?: number;
}

export function FormTextField({
  id,
  type = "text",
  value,
  onChange,
  hintText,
  icon,
  isPass = false,
  obscureText = false,
  onToggleObscureText,
  disabled = false,
  autoComplete,
  required = false,
  isMultiline = false,
  rows = 3,
}: FormTextFieldProps) {
  const renderIcon = () => {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case "account":
        return <User className={iconClass} />;
      case "store":
        return <Store className={iconClass} />;
      case "phone":
        return <Phone className={iconClass} />;
      case "phone_classic":
        return <PhoneCall className={iconClass} />;
      case "email":
        return <Mail className={iconClass} />;
      case "home":
        return <Home className={iconClass} />;
      case "city":
        return <Building2 className={iconClass} />;
      case "map_marker":
        return <MapPin className={iconClass} />;
      case "earth":
        return <Globe className={iconClass} />;
      case "zip_box":
        return <Archive className={iconClass} />;
      case "cake":
        return <Cake className={iconClass} />;
      case "briefcase":
        return <Briefcase className={iconClass} />;
      case "text":
        return <FileText className={iconClass} />;
      case "security":
      default:
        return <Lock className={iconClass} />;
    }
  };

  return (
    <div className="my-1.5 w-full">
      <div className={`relative flex ${isMultiline ? "items-start" : "items-center"} bg-white rounded-xl border border-gray-300 focus-within:border-[#F96176] focus-within:ring-1 focus-within:ring-[#F96176] transition shadow-xs`}>
        {/* Prefix Icon */}
        <div className={`pl-3.5 pr-2 flex items-center justify-center text-[#F96176] shrink-0 ${isMultiline ? "pt-3.5" : ""}`}>
          {renderIcon()}
        </div>

        {/* Input or Textarea */}
        {isMultiline ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={hintText}
            disabled={disabled}
            required={required}
            rows={rows}
            className="w-full py-3 pr-3 text-sm text-gray-800 placeholder:text-[#C1C0C8] bg-transparent outline-none resize-none disabled:opacity-50"
          />
        ) : (
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
        )}

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

export default FormTextField;
