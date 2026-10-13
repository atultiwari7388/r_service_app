import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { APP_CONFIG, SIDEBAR_MENU_ITEMS } from "@/lib/constants";

export default function Footer() {
  const { contact, social, copyright } = APP_CONFIG;

  return (
    <footer className="bg-[#0B132B] text-gray-300 pt-14 pb-8 border-t border-gray-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          {/* Brand & Fleet Mission */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#1C2541] flex items-center justify-center p-1.5 shadow-md">
                <Image
                  src="/logo-new.png"
                  alt="Trenoo Fleet Mechanic"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">
                  TRENO<span className="text-[#F96176]">OPS</span>
                </span>
                <p className="text-[10px] text-[#58BB87] font-bold tracking-wider uppercase">
                  Commercial Fleet & Trailer Hub
                </p>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Specialized heavy-duty truck, semi-trailer, and commercial fleet
              maintenance platform. Providing DOT annual inspections, brake &
              suspension overhaul, reefer diagnostics, and complete bay work orders.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C2541] text-[#58BB87] text-xs font-semibold">
                <ShieldCheck size={14} /> DOT & ASE Verified Bays
              </span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-[#1C2541] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#F96176] transition-all"
                title="Facebook"
              >
                <FaFacebook size={14} />
              </a>
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-[#1C2541] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#F96176] transition-all"
                title="Twitter"
              >
                <FaTwitter size={14} />
              </a>
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-[#1C2541] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#F96176] transition-all"
                title="Instagram"
              >
                <FaInstagram size={14} />
              </a>
            </div>
          </div>

          {/* Core Modules (Sidebar Menus) */}
          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4 border-l-2 border-[#F96176] pl-2.5">
              Fleet Operations
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {SIDEBAR_MENU_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="hover:text-[#F96176] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Heavy Duty Services */}
          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4 border-l-2 border-[#58BB87] pl-2.5">
              Truck & Trailer Specialties
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li>Class 8 Diesel Engine Overhaul</li>
              <li>Semi-Trailer Air Brake & Chamber Replacement</li>
              <li>DOT Annual & 90-Day BIT Inspections</li>
              <li>Dry Van, Flatbed & Chassis Repair</li>
              <li>Reefer Unit Mechanical Diagnostics</li>
              <li>Transmission, Clutch & Differential Service</li>
            </ul>
          </div>

          {/* Exact Address, Phone, Email as Requested */}
          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4 border-l-2 border-yellow-400 pl-2.5">
              Direct Contact & Support
            </h4>
            <div className="space-y-3.5 text-xs sm:text-sm">
              {/* Address */}
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#F96176] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[11px] text-gray-500 font-bold uppercase">
                    Address
                  </span>
                  <span className="text-gray-200">{contact.address}</span>
                </div>
              </div>

              {/* Phone / WhatsApp */}
              <div className="flex items-start gap-2.5">
                <Phone size={16} className="text-[#58BB87] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[11px] text-gray-500 font-bold uppercase">
                    Direct / WhatsApp
                  </span>
                  <a
                    href={contact.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#58BB87] font-bold hover:underline flex items-center gap-1.5"
                  >
                    <FaWhatsapp size={14} />
                    <span>{contact.phone}</span>
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-2.5">
                <Mail size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[11px] text-gray-500 font-bold uppercase">
                    Email
                  </span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-gray-200 hover:text-[#F96176] transition-colors font-medium"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Exact Copyright as requested */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p className="font-semibold text-gray-300">
            {copyright}
          </p>
          <div className="flex items-center gap-4 text-gray-500">
            <span>Address: {contact.address}</span>
            <span>•</span>
            <a
              href={contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#58BB87] hover:underline font-bold"
            >
              {contact.phone}
            </a>
            <span>•</span>
            <a href={`mailto:${contact.email}`} className="hover:text-white">
              {contact.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
