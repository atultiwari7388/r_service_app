"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Cpu,
  Layers,
  Flame,
  Truck,
} from "lucide-react";
import { MOCK_SERVICES, ServiceItem } from "@/data/mockServices";

export default function ServiceCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Estimate active index based on card width (~340px)
      const index = Math.round(scrollLeft / 340);
      setActiveIndex(Math.min(Math.max(index, 0), MOCK_SERVICES.length - 1));
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      checkScroll();
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 360;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleDotClick = (index: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: index * 340,
        behavior: "smooth",
      });
      setActiveIndex(index);
    }
  };

  const getServiceIcon = (name: ServiceItem["iconName"]) => {
    switch (name) {
      case "engine":
        return <Cpu size={20} className="text-[#F96176]" />;
      case "trailer":
        return <Layers size={20} className="text-[#0078A6]" />;
      case "brake":
        return <ShieldCheck size={20} className="text-[#58BB87]" />;
      case "tire":
        return <Truck size={20} className="text-amber-600" />;
      case "roadside":
        return <Flame size={20} className="text-[#F96176]" />;
      case "maintenance":
        return <Wrench size={20} className="text-[#0B132B]" />;
      default:
        return <Wrench size={20} className="text-[#F96176]" />;
    }
  };

  return (
    <section className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#58BB87]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#58BB87]">
              Specialized Capabilities
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] mt-1 tracking-tight">
            Built for Every Mile.
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Professional services for trucks, trailers, and heavy-duty vehicles.
          </p>
        </div>

        {/* Desktop Prev / Next Navigation Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
              canScrollLeft
                ? "bg-white hover:bg-gray-100 text-[#0B132B] border-gray-200 shadow-sm"
                : "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
            }`}
            aria-label="Previous services"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
              canScrollRight
                ? "bg-[#F96176] hover:bg-[#e0485d] text-white border-transparent shadow-md shadow-[#F96176]/30"
                : "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
            }`}
            aria-label="Next services"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {MOCK_SERVICES.map((service, idx) => (
          <div
            key={service.id}
            className="w-[280px] sm:w-[320px] lg:w-[350px] shrink-0 snap-start bg-white rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden card-3d group"
          >
            {/* Card Visual Header with Image */}
            <div className="relative h-44 w-full bg-gradient-to-tr from-gray-50 via-gray-100 to-white flex items-center justify-center p-4 border-b border-gray-100 overflow-hidden">
              {/* Category Badge */}
              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-black uppercase text-[#0B132B] border border-gray-200 shadow-xs">
                {service.badge}
              </span>

              {/* Service Visual */}
              <div className="relative z-10 w-28 h-28 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Image
                  src={service.imageSrc}
                  alt={service.title}
                  width={112}
                  height={112}
                  className="object-contain drop-shadow-md"
                />
              </div>

              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-radial from-transparent to-black/[0.02]" />
            </div>

            {/* Card Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    {getServiceIcon(service.iconName)}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase text-[#F96176] tracking-wider">
                    {service.subtitle}
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#0B132B] group-hover:text-[#F96176] transition-colors">
                  {service.title}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed font-normal line-clamp-3">
                  {service.description}
                </p>

                {/* Highlights List */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  {service.highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium"
                    >
                      <CheckCircle2 size={13} className="text-[#58BB87] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explore Service CTA Button */}
              <div className="pt-2">
                <Link
                  href="/find-jobs"
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-[#F96176] text-gray-800 hover:text-white font-bold text-xs border border-gray-200 hover:border-[#F96176] transition-all flex items-center justify-center gap-1.5 shadow-2xs group/btn"
                >
                  <span>Explore Service</span>
                  <ArrowRight
                    size={13}
                    className="group-hover/btn:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dot Indicators */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {MOCK_SERVICES.map((_, dotIdx) => (
          <button
            key={dotIdx}
            type="button"
            onClick={() => handleDotClick(dotIdx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              activeIndex === dotIdx
                ? "w-6 bg-[#F96176]"
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${dotIdx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
