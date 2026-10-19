"use client";

import React from "react";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import { APP_CONFIG } from "@/lib/constants";

export default function TopBar() {
  const { contact, social } = APP_CONFIG;

  return (
    <div className="bg-[#F96176] text-white py-1.5 px-3 sm:px-6 text-[11px] sm:text-xs font-medium tracking-wide transition-all shadow-xs border-b border-white/10 select-none overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left Section: Email, Address, WhatsApp Phone */}
        <div className="flex flex-wrap items-center justify-start gap-3 sm:gap-6">
          {/* Email */}
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-1.5 hover:text-white/80 transition-colors group"
          >
            <span className="p-1 rounded-full bg-white/15 group-hover:bg-white/25 transition">
              <FaEnvelope className="text-xs" />
            </span>
            <span className="truncate max-w-[130px] sm:max-w-none">{contact.email}</span>
          </a>

          {/* Address (Hidden on very small screens, visible on sm+) */}
          <div className="hidden sm:flex items-center gap-1.5 text-white/95">
            <span className="p-1 rounded-full bg-white/15">
              <FaMapMarkerAlt className="text-xs" />
            </span>
            <span className="truncate max-w-[200px] sm:max-w-none">{contact.address}</span>
          </div>

          {/* WhatsApp / Phone Direct Link */}
          <a
            href={contact.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white/80 transition-colors group font-bold"
          >
            <span className="p-1 rounded-full bg-white/15 group-hover:bg-white/25 transition">
              <FaWhatsapp className="text-xs text-white" />
            </span>
            <span>{contact.phoneDisplay}</span>
          </a>
        </div>

        {/* Right Section: Fleet Dispatch Badge & Social Media Icons */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Commercial Fleet Dispatch Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs">
            <span className="h-2 w-2 rounded-full bg-[#58BB87] animate-ping" />
            <span className="h-2 w-2 rounded-full bg-[#58BB87] -ml-3.5" />
            <span>Heavy Truck & Trailer Dispatch</span>
          </div>

          <div className="h-3 w-px bg-white/30 hidden sm:block" />

          {/* Social Links (Facebook, Twitter, Instagram) */}
          <div className="flex items-center gap-3">
            <a
              href={social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white/70 transition-transform hover:scale-110"
              title="Facebook"
            >
              <FaFacebook className="text-sm" />
            </a>
            <a
              href={social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white/70 transition-transform hover:scale-110"
              title="Twitter"
            >
              <FaTwitter className="text-sm" />
            </a>
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white/70 transition-transform hover:scale-110"
              title="Instagram"
            >
              <FaInstagram className="text-sm" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
