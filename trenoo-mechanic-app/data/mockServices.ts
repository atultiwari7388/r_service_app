export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: "engine" | "trailer" | "brake" | "tire" | "roadside" | "maintenance";
  imageSrc: string;
  badge: string;
  highlights: string[];
}

export const MOCK_SERVICES: ServiceItem[] = [
  {
    id: "engine-diagnostics",
    title: "Truck Engine Diagnostics",
    subtitle: "Class 8 Heavy Diesel Specialists",
    description:
      "OEM-level electronic diagnostics, ECM parameter tuning, turbocharger analysis, and aftertreatment (DPF/DEF/SCR) troubleshooting for Cummins, Detroit Diesel, and PACCAR platforms.",
    iconName: "engine",
    imageSrc: "/assets/engine.png",
    badge: "Computer Diagnostics",
    highlights: ["Forced manual regens", "Fuel injector calibration", "Turbo boost pressure testing"],
  },
  {
    id: "trailer-repair",
    title: "Trailer Repair",
    subtitle: "Dry Van, Flatbed & Reefer Services",
    description:
      "Comprehensive structural, mechanical, and electrical solutions for 53ft semi-trailers, including air-ride tandem sliders, kingpins, landing gear, and rear roll-up doors.",
    iconName: "trailer",
    imageSrc: "/assets/truck_repair.png",
    badge: "Structural & Mechanical",
    highlights: ["Tandem axle alignment", "Landing gear crank rebuilds", "Swing & roll door seals"],
  },
  {
    id: "brake-suspension",
    title: "Brake and Suspension Repair",
    subtitle: "FMCSA Air Brake Certified",
    description:
      "Complete overhaul for dual-circuit air brake systems, spring brake chambers, S-cam shafts, automatic slack adjusters, and air suspension leveling valves.",
    iconName: "brake",
    imageSrc: "/assets/brake.png",
    badge: "DOT Compliance",
    highlights: ["Brake stroke measurement", "Air line leak tracing", "Heavy-duty shock & airbag replacement"],
  },
  {
    id: "tire-replacement",
    title: "Tire Replacement",
    subtitle: "Commercial Steer, Drive & Trailer Tires",
    description:
      "Rapid commercial tire mounting, electronic wheel balancing, blowout replacements, and mobile roadside wheel hub servicing for all standard 22.5” and 24.5” fleet sizes.",
    iconName: "tire",
    imageSrc: "/assets/tire.png",
    badge: "Roadside & In-Shop",
    highlights: ["24/7 highway blowout dispatch", "Tire pressure monitoring (TPMS)", "Retread & casing audits"],
  },
  {
    id: "roadside-assistance",
    title: "Emergency Roadside Assistance",
    subtitle: "24/7 Mobile Heavy-Duty Units",
    description:
      "Immediate on-location mobile repair trucks equipped with high-CFM air compressors, hydraulic jacks, crane units, jumpstart packs, and emergency diagnostics.",
    iconName: "roadside",
    imageSrc: "/assets/towing_truck.png",
    badge: "24/7 Rapid Response",
    highlights: ["Avg 22-minute highway dispatch", "Air leak bypass & splicing", "Heavy battery jumpstarts"],
  },
  {
    id: "preventive-maintenance",
    title: "Preventive Maintenance",
    subtitle: "PM-A, PM-B, PM-C Service Programs",
    description:
      "Rigorous maintenance schedules tailored to commercial carriers to reduce highway downtime, optimize fuel economy, and guarantee spotless DOT safety audits.",
    iconName: "maintenance",
    imageSrc: "/assets/battery_truck.png",
    badge: "Fleet Care Programs",
    highlights: ["Synthetic 15W-40 CK-4 oil drain", "Multi-point safety inspection", "Complete chassis lubrication"],
  },
];

export interface DemoLocation {
  id: string;
  name: string;
  fullAddress: string;
  coordinates: string;
  depotZone: string;
  coverageRadius: string;
  isDemo: true;
}

export const DEMO_LOCATIONS: DemoLocation[] = [
  {
    id: "loc-1",
    name: "Gurugram Freight Terminal (Primary Demo)",
    fullAddress: "Industrial Area, Sector 37, Gurugram, Haryana, India",
    coordinates: "28.4350° N, 76.9920° E",
    depotZone: "NCR Heavy Logistics Hub 01",
    coverageRadius: "45 km Commercial Radius",
    isDemo: true,
  },
  {
    id: "loc-2",
    name: "California Central Valley Yard (Alternate Demo)",
    fullAddress: "California, 93711, USA",
    coordinates: "36.8450° N, 119.8240° W",
    depotZone: "Bay District 4 (I-5 / CA-99)",
    coverageRadius: "50-Mile Highway Corridor",
    isDemo: true,
  },
];

export const MOCK_DASHBOARD_STATS = {
  upcomingJobs: 3,
  upcomingJobsLabel: "Upcoming Jobs",
  upcomingJobsSub: "Ready for bay & mobile dispatch",
  completedJobs: 1482,
  completedJobsLabel: "Completed Jobs",
  completedJobsSub: "Class 8 trucks & 53' trailers",
  jobsThisMonth: 184,
  jobsThisMonthLabel: "Jobs This Month",
  jobsThisMonthSub: "+16.8% vs last month",
  averageRating: 4.96,
  averageRatingLabel: "Average Rating",
  averageRatingSub: "Based on 520+ verified fleet reviews",
  isMockData: true,
};
