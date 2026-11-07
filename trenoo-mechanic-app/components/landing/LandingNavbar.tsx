"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  PhoneCall,
  LogIn,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  Smartphone,
  Info,
  Layers,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { APP_CONFIG } from "@/lib/constants";

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "About", href: "#about", icon: Info },
    { label: "App Features", href: "#features", icon: Layers },
    { label: "Download App", href: "#download", icon: Smartphone },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* TopBar with Contact, Address & Socials */}
      <TopBar />

      {/* Main Navigation Bar */}
      <nav
        className={`w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200/80 py-2.5"
            : "bg-white border-b border-gray-200 py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#0B132B] flex items-center justify-center p-2 shadow-md group-hover:scale-105 transition-transform duration-300 border border-gray-800">
              <Image
                src="/logo-new.png"
                alt="Treno Mechanic Logo"
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black text-[#0B132B] tracking-tight">
                  TRENO
                </span>
                <span className="text-lg sm:text-xl font-black text-[#F96176] tracking-tight">
                  MECHANIC
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#58BB87] uppercase tracking-wider -mt-1 hidden sm:block">
                Heavy-Duty Fleet & Trailer Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-bold text-gray-700 hover:text-[#F96176] transition-colors relative py-1"
              >
                {link.label}
              </a>
            ))}

            {/* Hotline Link */}
            <a
              href={APP_CONFIG.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#58BB87] hover:text-[#48a674] bg-[#EAF8F1] px-3 py-1.5 rounded-full border border-[#58BB87]/30 transition-colors"
            >
              <PhoneCall size={13} className="animate-pulse" />
              <span>24/7 Dispatch Hotline</span>
            </a>
          </div>

          {/* Desktop Login & Register CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:text-[#0B132B] hover:bg-gray-100 transition-all border border-gray-200 shadow-2xs"
            >
              <LogIn size={15} className="text-[#F96176]" />
              <span>Login</span>
            </Link>

            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#F96176] hover:bg-[#e0485d] shadow-md shadow-[#F96176]/25 transition-all transform hover:-translate-y-0.5"
            >
              <UserPlus size={15} />
              <span>Register</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F96176] text-white"
            >
              Login
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-800 hover:bg-rose-50 hover:text-[#F96176] transition"
                  >
                    <IconComponent size={18} className="text-gray-400" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
              <a
                href={APP_CONFIG.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#58BB87] bg-[#EAF8F1] transition"
              >
                <PhoneCall size={18} />
                <span>24/7 Dispatch: {APP_CONFIG.contact.phoneDisplay}</span>
              </a>
            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 hover:bg-gray-50 transition"
              >
                <LogIn size={16} className="text-[#F96176]" />
                <span>Mechanic Login</span>
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F96176] text-white text-sm font-black shadow-md shadow-[#F96176]/25 hover:bg-[#e0485d] transition"
              >
                <UserPlus size={16} />
                <span>Register as Mechanic</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
