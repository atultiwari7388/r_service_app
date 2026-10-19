"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AlertTriangle, Phone, Mail, ArrowLeft } from "lucide-react";

interface HelpCenterData {
  mail?: string;
  phone?: string;
}

export default function AdminContactPage() {
  const [helpData, setHelpData] = useState<HelpCenterData>({
    mail: "team@trenoops.com",
    phone: "+15593886914",
  });

  useEffect(() => {
    const fetchHelpData = async () => {
      try {
        const snap = await getDoc(doc(db, "metadata", "helpCenter"));
        if (snap.exists()) {
          const data = snap.data() as HelpCenterData;
          setHelpData(data);
        }
      } catch (err) {
        console.error("Error fetching help center data:", err);
      }
    };
    fetchHelpData();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-rose-50 text-[#F96176] flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-12 h-12" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F96176]">
            Account Deactivated
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
            Your account has been deactivated. Please contact the admin for assistance.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-lg text-gray-900 font-normal">We are happy to help you</p>
          <p className="text-base text-gray-800 font-medium">24*7</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {helpData.phone && (
            <a
              href={`tel:${helpData.phone}`}
              className="inline-flex items-center justify-center gap-2 w-32 h-11 bg-[#58BB87] hover:bg-[#48a674] text-white font-medium text-sm rounded-xl shadow-xs transition"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </a>
          )}

          {helpData.mail && (
            <a
              href={`mailto:${helpData.mail}?subject=Account%20Deactivated%20Inquiry`}
              className="inline-flex items-center justify-center gap-2 w-32 h-11 bg-[#F96176] hover:bg-[#e0485d] text-white font-medium text-sm rounded-xl shadow-xs transition"
            >
              <Mail className="w-4 h-4" />
              <span>Mail</span>
            </a>
          )}
        </div>

        <div className="pt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
