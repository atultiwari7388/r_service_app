import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { APP_CONFIG, SIDEBAR_MENU_ITEMS } from "@/lib/constants";

export default function Footer() {
  const { contact, social, copyright } = APP_CONFIG;

  return (
    <footer className="bg-white text-gray-600 pt-12 pb-8 border-t border-gray-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-gray-200">
          {/* Brand & Fleet Mission */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center group">
              <Image
                src="/assets/treno_mechanic_logo.png"
                alt="Treno Mechanic Logo"
                width={170}
                height={42}
                className="h-9 w-auto object-contain drop-shadow-2xs group-hover:opacity-90 transition-opacity"
              />
            </Link>

            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Specialized heavy-duty truck, semi-trailer, and commercial fleet
              maintenance platform. Providing DOT annual inspections, brake &
              suspension overhaul, reefer diagnostics, and complete bay work orders.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#58BB87] text-xs font-semibold border border-emerald-100">
                <ShieldCheck size={14} /> DOT & ASE Verified Bays
              </span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#F96176] transition-all"
                title="Facebook"
              >
                <FaFacebook size={14} />
              </a>
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#F96176] transition-all"
                title="Twitter"
              >
                <FaTwitter size={14} />
              </a>
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#F96176] transition-all"
                title="Instagram"
              >
                <FaInstagram size={14} />
              </a>
            </div>
          </div>

          {/* Core Modules (Sidebar Menus) */}
          <div>
            <h4 className="text-gray-900 text-xs font-extrabold uppercase tracking-wider mb-4 border-l-2 border-[#F96176] pl-2.5">
              Fleet Operations
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {SIDEBAR_MENU_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-[#F96176] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Heavy Duty Services */}
          <div>
            <h4 className="text-gray-900 text-xs font-extrabold uppercase tracking-wider mb-4 border-l-2 border-[#58BB87] pl-2.5">
              Truck & Trailer Specialties
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
              <li>Class 8 Diesel Engine Overhaul</li>
              <li>Semi-Trailer Air Brake & Chamber Replacement</li>
              <li>DOT Annual & 90-Day BIT Inspections</li>
              <li>Dry Van, Flatbed & Chassis Repair</li>
              <li>Reefer Unit Mechanical Diagnostics</li>
              <li>Transmission, Clutch & Differential Service</li>
            </ul>
          </div>

          {/* Exact Address, Phone, Email */}
          <div>
            <h4 className="text-gray-900 text-xs font-extrabold uppercase tracking-wider mb-4 border-l-2 border-amber-500 pl-2.5">
              Direct Contact & Support
            </h4>
            <div className="space-y-3 text-xs sm:text-sm">
              {/* Address */}
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#F96176] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Address
                  </span>
                  <span className="text-gray-700">{contact.address}</span>
                </div>
              </div>

              {/* Phone / WhatsApp */}
              <div className="flex items-start gap-2.5">
                <Phone size={16} className="text-[#58BB87] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
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
                <Mail size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Email
                  </span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-gray-700 hover:text-[#F96176] transition-colors font-medium"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p className="font-medium text-gray-600">
            {copyright}
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <span>{contact.address}</span>
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
            <a href={`mailto:${contact.email}`} className="hover:text-gray-700">
              {contact.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
