import {
  FaBell,
  FaCheckCircle,
  FaMapMarkedAlt,
  FaShieldAlt,
  FaToolbox,
  FaTruck,
} from "react-icons/fa";

const reasons = [
  "All-in-one platform for Dispatch, Maintenance, and Fleet Tracking",
  "Built for Semi-Trucks and Trailers only",
  "Designed for trucking companies in USA and Canada",
  "Find nearby mechanics and roadside service anytime",
  "Service alerts help prevent breakdowns",
  "Works for owner-operators and fleet companies",
  "Easy to use, reliable, and affordable",
];

const overviewCards = [
  {
    title: "Dispatch & Load Management",
    description:
      "Assign loads, drivers, and trucks from a centralized dispatch board.",
    icon: FaTruck,
    accent: "from-[#58BB87] to-[#3F9F70]",
    ring: "ring-[#58BB87]/20",
  },
  {
    title: "Fleet Maintenance Tracking",
    description:
      "Track service intervals, maintenance records, and repair history.",
    icon: FaToolbox,
    accent: "from-[#F96176] to-[#E44C63]",
    ring: "ring-[#F96176]/20",
  },
  {
    title: "Compliance Monitoring",
    description:
      "Stay ahead of inspections and required maintenance with automated alerts.",
    icon: FaShieldAlt,
    accent: "from-[#F59E0B] to-[#D97706]",
    ring: "ring-[#F59E0B]/20",
  },
  {
    title: "Roadside Mechanic Network",
    description:
      "Find nearby truck and trailer mechanics when drivers need help.",
    icon: FaMapMarkedAlt,
    accent: "from-[#4F7CFF] to-[#315FE8]",
    ring: "ring-[#4F7CFF]/20",
  },
];

export default function WhyTrenoops() {
  return (
    <section className="bg-gradient-to-b from-white to-white py-20">
      <div className="container mx-auto px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#58BB87]">
                Why TrenoOps
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                Built specifically for trucking operations that need one clear
                system.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                TrenoOps is focused on the daily needs of semi-truck and trailer
                fleets, helping teams manage dispatch, maintenance, compliance,
                and roadside support without juggling disconnected tools.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {reasons.map((reason) => (
                  <div
                    key={reason}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <FaCheckCircle className="mt-1 shrink-0 text-lg text-[#58BB87]" />
                    <p className="text-sm leading-6 text-slate-700">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F96176]/10 px-4 py-2 text-sm font-semibold text-[#D9475E]">
              <FaBell className="text-sm" />
              Platform Overview
            </div>
            <h3 className="mt-5 text-3xl font-bold leading-tight text-slate-900">
              One Platform for Fleet Operations
            </h3>
            <p className="mt-4 text-base leading-7 text-slate-600">
              TrenoOps brings dispatch, fleet maintenance, compliance tracking,
              and roadside service into one unified platform designed for modern
              trucking companies.
            </p>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Instead of managing multiple tools, fleets can run their entire
              operation from a single system.
            </p>

            <div className="mt-8 grid gap-4">
              {overviewCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className={`rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm ring-1 ${card.ring}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.accent} text-white shadow-md`}
                      >
                        <Icon className="text-lg" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">
                          {card.title}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
