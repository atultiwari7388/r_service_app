"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MoreVertical,
  Trash2,
  Mail,
  FolderUp,
  X,
  Edit as EditIcon,
  Download as DownloadIcon,
  Eye as EyeIcon,
} from "lucide-react";

type LoadDocument = {
  id: string;
  name: string;
  type: string;
  invoiceRequirement: boolean;
  expiryDate: string;
  daysRemaining: number | null;
};

export const DocumentActionsDropdown = ({
  loadDocument,
}: {
  loadDocument: LoadDocument;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const btnRef = useRef<HTMLButtonElement>(null);

  const menuItems = [
    { label: "Edit", icon: EditIcon, color: "text-blue-600" },
    { label: "Delete", icon: Trash2, color: "text-red-600" },
    { label: "Download", icon: DownloadIcon, color: "text-gray-600" },
    { label: "View", icon: EyeIcon, color: "text-gray-600" },
    { label: "Email", icon: Mail, color: "text-gray-600" },
    { label: "Send via FTP", icon: FolderUp, color: "text-gray-600" },
  ];

  const openMenu = () => {
    const DROPDOWN_WIDTH = 192;
    const PADDING = 8;

    if (!btnRef.current) return;

    const rect = btnRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let left = rect.right - DROPDOWN_WIDTH;

    // 🔁 If dropdown would go off-screen left → open to the right
    if (left < PADDING) {
      left = rect.left;
    }

    // 🛑 Clamp inside viewport
    left = Math.min(
      Math.max(left, PADDING),
      viewportWidth - DROPDOWN_WIDTH - PADDING
    );

    setCoords({
      top: rect.bottom + window.scrollY + 6,
      left: left + window.scrollX,
    });

    setIsOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div
              className="absolute z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">
                  Actions
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>

              <div className="py-1">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 ${item.color}`}
                    onClick={() => {
                      console.log(
                        `${item.label} clicked for ${loadDocument.name}`
                      );
                      setIsOpen(false);
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded border border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>,
          window.document.body
        )}
    </>
  );
};
