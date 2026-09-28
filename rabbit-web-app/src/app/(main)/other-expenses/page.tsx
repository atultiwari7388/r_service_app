"use client";

import React from "react";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function OtherExpensesPage() {
  return (
    <div className="min-h-[80vh] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/records"
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Other Expense</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-sm">
            Manage your other expenses and additional service costs here.
          </p>
        </div>
      </div>
    </div>
  );
}
