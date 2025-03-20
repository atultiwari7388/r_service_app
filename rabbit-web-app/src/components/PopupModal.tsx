import React from "react";

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: Array<{
    label: string;
    onClick: () => void;
    bgColor?: string;
  }>;
}

const PopupModal = ({ isOpen, onClose, title, options }: PopupModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-80 shadow-lg relative">
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>

        {/* Options */}
        {options.map((option, index) => (
          <button
            key={index}
            className="w-full py-2 mb-2 rounded-md transition"
            style={{
              backgroundColor: option.bgColor || "#F96176",
              color: "#fff",
            }}
            onClick={() => option.onClick()}
          >
            {option.label}
          </button>
        ))}

        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PopupModal;
