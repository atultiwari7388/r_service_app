"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Autocomplete,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from "@mui/material";
import {
  FaTimes,
  FaFileExcel,
  FaFilePdf,
  FaTruck,
  FaWrench,
  FaCalendarAlt,
  FaFilter,
  FaCheckCircle,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { VehicleTypes } from "@/types/types";

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  vehicleDetails: {
    vehicleNumber: string;
    vehicleType: string;
    companyName: string;
    engineNumber?: string;
    currentMiles?: string;
  };
  services: Array<{
    serviceId: string;
    serviceName: string;
    defaultNotificationValue?: number;
    nextNotificationValue?: number;
    subServices?: Array<{ name: string; id: string }>;
  }>;
  date: string;
  hours?: number;
  miles?: number;
  totalMiles?: number;
  createdAt?: string;
  workshopName?: string;
  invoice?: string;
  description?: string;
  invoiceAmount?: string;
  paidAmount?: number;
  balanceAmount?: number;
  paymentStatus?: "Unpaid" | "Partially Paid" | "Paid";
  imageUrl?: string;
}

export interface ServiceData {
  sId: string;
  sName: string;
  vType: string;
}

interface ExportDataDialogProps {
  open: boolean;
  onClose: () => void;
  records: ServiceRecord[];
  vehicles: VehicleTypes[];
  services: ServiceData[];
}

const formatDateSafe = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  try {
    const trimmed = String(dateStr).trim();
    if (!trimmed) return "";
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
      return trimmed.replace(/\//g, "-");
    }
    const isoParsed = parseISO(trimmed);
    if (!isNaN(isoParsed.getTime())) {
      return format(isoParsed, "MM-dd-yyyy");
    }
    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) {
      return format(fallback, "MM-dd-yyyy");
    }
    return trimmed;
  } catch {
    return dateStr ? String(dateStr) : "";
  }
};

const formatServiceItem = (service: any): string => {
  if (!service) return "";
  const name = (service.serviceName || service.sName || "").trim();
  if (!name) return "";
  const rawSubs = service.subServices;
  if (!rawSubs || !Array.isArray(rawSubs) || rawSubs.length === 0) return name;
  const subs: string[] = [];
  rawSubs.forEach((item: any) => {
    if (typeof item === "string" && item.trim()) {
      subs.push(item.trim());
    } else if (item && typeof item === "object") {
      if (item.name && typeof item.name === "string" && item.name.trim()) {
        subs.push(item.name.trim());
      } else if (item.sName && typeof item.sName === "string" && item.sName.trim()) {
        subs.push(item.sName.trim());
      }
    }
  });
  return subs.length > 0 ? `${name} (${subs.join(", ")})` : name;
};

export default function ExportDataDialog({
  open,
  onClose,
  records,
  vehicles,
  services,
}: ExportDataDialogProps) {
  const [exportMode, setExportMode] = useState<"vehicle" | "service">("vehicle");

  // Mode A: Vehicle-wise state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedServiceOption, setSelectedServiceOption] = useState<string>("all");

  // Mode B: Service-wise state
  const [selectedServiceName, setSelectedServiceName] = useState<string>("");
  const [selectedVehicleOption, setSelectedVehicleOption] = useState<string>("all");

  // Date Range filter (Applies to both)
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const previewTableRef = useRef<HTMLDivElement>(null);

  // Get list of unique service names from services prop + records
  const uniqueServiceNames = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.sName && s.sName.trim()) set.add(s.sName.trim());
    });
    records.forEach((r) => {
      (r.services || []).forEach((s) => {
        if (s.serviceName && s.serviceName.trim()) set.add(s.serviceName.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [services, records]);

  // Selected vehicle object (for Mode A)
  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  // Set default vehicle / service when opened
  React.useEffect(() => {
    if (open) {
      if (!selectedVehicleId && vehicles.length > 0) {
        setSelectedVehicleId(vehicles[0].id || "");
      }
      if (!selectedServiceName && uniqueServiceNames.length > 0) {
        setSelectedServiceName(uniqueServiceNames[0]);
      }
    }
  }, [open, vehicles, uniqueServiceNames, selectedVehicleId, selectedServiceName]);

  // Filtered records for preview & export
  const filteredData = useMemo(() => {
    return records.filter((record) => {
      if (!record) return false;

      // Date Range Filter
      if (startDate || endDate) {
        if (!record.date) return false;
        const rDate = new Date(record.date);
        if (isNaN(rDate.getTime())) return false;
        if (startDate && rDate < startDate) return false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (rDate > endOfDay) return false;
        }
      }

      if (exportMode === "vehicle") {
        // Vehicle Match
        if (selectedVehicleId) {
          const matchId = record.vehicleId === selectedVehicleId;
          const matchNumber =
            activeVehicle?.vehicleNumber &&
            record.vehicleDetails?.vehicleNumber?.toLowerCase() ===
              activeVehicle.vehicleNumber.toLowerCase();
          if (!matchId && !matchNumber) return false;
        }

        // Service Option Match
        if (selectedServiceOption !== "all") {
          const hasService = (record.services || []).some((s) => {
            const sName = (s.serviceName || "").toLowerCase();
            return sName.includes(selectedServiceOption.toLowerCase());
          });
          if (!hasService) return false;
        }
      } else {
        // Service-Wise mode
        if (selectedServiceName) {
          const hasService = (record.services || []).some((s) => {
            const sName = (s.serviceName || "").toLowerCase();
            return sName.includes(selectedServiceName.toLowerCase());
          });
          if (!hasService) return false;
        }

        // Vehicle Option Match
        if (selectedVehicleOption !== "all") {
          const matchId = record.vehicleId === selectedVehicleOption;
          const targetVeh = vehicles.find((v) => v.id === selectedVehicleOption);
          const matchNumber =
            targetVeh?.vehicleNumber &&
            record.vehicleDetails?.vehicleNumber?.toLowerCase() ===
              targetVeh.vehicleNumber.toLowerCase();
          if (!matchId && !matchNumber) return false;
        }
      }

      return true;
    });
  }, [
    records,
    exportMode,
    selectedVehicleId,
    activeVehicle,
    selectedServiceOption,
    selectedServiceName,
    selectedVehicleOption,
    vehicles,
    startDate,
    endDate,
  ]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalCost = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;

    filteredData.forEach((r) => {
      const amt = parseFloat(r.invoiceAmount || "0") || 0;
      totalCost += amt;
      if (r.paymentStatus === "Paid") paidCount++;
      else if (r.paymentStatus === "Partially Paid") partialCount++;
      else unpaidCount++;
    });

    return {
      totalRecords: filteredData.length,
      totalCost,
      paidCount,
      unpaidCount,
      partialCount,
    };
  }, [filteredData]);

  // Export to Excel handler
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error("No records found to export.");
      return;
    }

    try {
      const rows = filteredData.map((record, index) => {
        const isTrailer = record.vehicleDetails?.vehicleType === "Trailer";
        const serviceString = (record.services || [])
          .map((s) => formatServiceItem(s))
          .join(", ");

        return {
          "S.No": index + 1,
          "Date": formatDateSafe(record.date),
          "Vehicle #": record.vehicleDetails?.vehicleNumber || "-",
          "Company": record.vehicleDetails?.companyName || "-",
          "Type": record.vehicleDetails?.vehicleType || (isTrailer ? "Trailer" : "Truck"),
          "Miles": isTrailer ? "-" : record.miles || 0,
          "Hours": isTrailer ? record.hours || 0 : "-",
          "Services & Subservices": serviceString || "-",
          "Workshop Name": record.workshopName || "-",
          "Invoice #": record.invoice || "-",
          "Invoice Amount ($)": record.invoiceAmount || "0.00",
          "Payment Status": record.paymentStatus || "Unpaid",
          "Description / Remarks": record.description || "-",
        };
      });

      const wb = utils.book_new();
      const ws = utils.json_to_sheet(rows);

      // Auto column widths
      ws["!cols"] = [
        { wch: 6 },  // S.No
        { wch: 14 }, // Date
        { wch: 14 }, // Vehicle #
        { wch: 18 }, // Company
        { wch: 10 }, // Type
        { wch: 10 }, // Miles
        { wch: 10 }, // Hours
        { wch: 36 }, // Services
        { wch: 22 }, // Workshop
        { wch: 14 }, // Invoice
        { wch: 18 }, // Amount
        { wch: 16 }, // Payment
        { wch: 30 }, // Description
      ];

      const sheetTitle = exportMode === "vehicle" ? "Vehicle Report" : "Service Report";
      utils.book_append_sheet(wb, ws, sheetTitle);

      const dateStr = format(new Date(), "yyyy-MM-dd");
      let fileName = "";
      if (exportMode === "vehicle") {
        const vNum = activeVehicle?.vehicleNumber || "Vehicle";
        const servSuffix = selectedServiceOption === "all" ? "AllServices" : selectedServiceOption.replace(/[^a-zA-Z0-9]/g, "_");
        fileName = `Vehicle_${vNum}_${servSuffix}_${dateStr}.xlsx`;
      } else {
        const sName = (selectedServiceName || "Service").replace(/[^a-zA-Z0-9]/g, "_");
        const vSuffix = selectedVehicleOption === "all" ? "AllVehicles" : "SelectedVeh";
        fileName = `Service_${sName}_${vSuffix}_${dateStr}.xlsx`;
      }

      writeFile(wb, fileName);
      toast.success(`Exported ${filteredData.length} record(s) to Excel!`);
    } catch (err) {
      console.error("Error exporting excel:", err);
      toast.error("Failed to export Excel file.");
    }
  };

  // Export to PDF handler
  const handleExportPdf = async () => {
    if (filteredData.length === 0) {
      toast.error("No records found to export.");
      return;
    }

    setIsExportingPdf(true);
    const toastId = toast.loading("Generating PDF Report...");

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;

      // Header Banner (Brand Red #F96176)
      pdf.setFillColor(249, 97, 118);
      pdf.rect(0, 0, pageWidth, 28, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      const title =
        exportMode === "vehicle"
          ? `VEHICLE SERVICE REPORT: ${activeVehicle?.vehicleNumber || "VEHICLE"}`
          : `SERVICE REPORT: ${selectedServiceName || "SERVICE"}`;
      pdf.text(title, margin, 12);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated on: ${format(new Date(), "PPP p")}`, margin, 20);

      // Meta Info Card
      pdf.setTextColor(30, 41, 59);
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, 34, pageWidth - margin * 2, 22, 2, 2, "FD");

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Report Criteria:", margin + 4, 40);

      pdf.setFont("helvetica", "normal");
      if (exportMode === "vehicle") {
        pdf.text(
          `Vehicle: ${activeVehicle?.vehicleNumber || "All"} (${activeVehicle?.companyName || "N/A"})  |  Service: ${
            selectedServiceOption === "all" ? "All Services" : selectedServiceOption
          }`,
          margin + 4,
          46
        );
      } else {
        const vObj = vehicles.find((v) => v.id === selectedVehicleOption);
        pdf.text(
          `Service: ${selectedServiceName || "All"}  |  Vehicle: ${
            selectedVehicleOption === "all" ? "All Vehicles" : vObj?.vehicleNumber || "Selected"
          }`,
          margin + 4,
          46
        );
      }

      const dateRangeText =
        startDate || endDate
          ? `Date Filter: ${startDate ? format(startDate, "MM/dd/yyyy") : "Start"} - ${
              endDate ? format(endDate, "MM/dd/yyyy") : "Present"
            }`
          : "Date Filter: All Time";
      pdf.text(
        `${dateRangeText}  |  Total Matched: ${summaryMetrics.totalRecords} record(s)  |  Total: $${summaryMetrics.totalCost.toFixed(
          2
        )}`,
        margin + 4,
        51
      );

      // Table Header
      let yPos = 62;
      const headers = [
        { label: "Date", width: 22 },
        { label: "Vehicle", width: 22 },
        { label: "Miles/Hours", width: 20 },
        { label: "Services & Subservices", width: 66 },
        { label: "Workshop", width: 26 },
        { label: "Inv #", width: 17 },
        { label: "Amount", width: 17 },
      ];

      const drawTableHeader = (y: number) => {
        pdf.setFillColor(241, 245, 249);
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(margin, y, pageWidth - margin * 2, 8, "FD");
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(51, 65, 85);

        let curX = margin + 2;
        headers.forEach((h) => {
          pdf.text(h.label, curX, y + 5.5);
          curX += h.width;
        });
      };

      drawTableHeader(yPos);
      yPos += 10;

      // Rows
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");

      filteredData.forEach((rec, idx) => {
        const isTrailer = rec.vehicleDetails?.vehicleType === "Trailer";
        const unitVal = isTrailer
          ? `${rec.hours || 0} hrs`
          : rec.miles && Number(rec.miles) !== 0
          ? `${rec.miles} mi`
          : rec.hours && Number(rec.hours) !== 0
          ? `${rec.hours} hrs`
          : "-";

        const sString = (rec.services || []).map((s) => formatServiceItem(s)).join(", ") || "-";
        const sLines = pdf.splitTextToSize(sString, headers[3].width - 3);

        const wString = rec.workshopName || "-";
        const wLines = pdf.splitTextToSize(wString, headers[4].width - 3);

        const maxLines = Math.max(sLines.length, wLines.length, 1);
        const lineHeight = 3.8;
        const rowHeight = maxLines * lineHeight + 4;

        if (yPos + rowHeight > pageHeight - 18) {
          pdf.addPage();
          yPos = 15;
          drawTableHeader(yPos);
          yPos += 10;
        }

        // Alternating row background
        if (idx % 2 === 1) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos - 2, pageWidth - margin * 2, rowHeight, "F");
        }

        pdf.setTextColor(30, 41, 59);
        let curX = margin + 2;

        // Date
        pdf.text(formatDateSafe(rec.date), curX, yPos + 2.5);
        curX += headers[0].width;

        // Vehicle
        pdf.text(rec.vehicleDetails?.vehicleNumber || "-", curX, yPos + 2.5);
        curX += headers[1].width;

        // Miles/Hours
        pdf.text(unitVal, curX, yPos + 2.5);
        curX += headers[2].width;

        // Services & Subservices (FULL MULTI-LINE, NEVER TRUNCATED)
        pdf.text(sLines, curX, yPos + 2.5);
        curX += headers[3].width;

        // Workshop
        pdf.text(wLines, curX, yPos + 2.5);
        curX += headers[4].width;

        // Inv #
        pdf.text(rec.invoice || "-", curX, yPos + 2.5);
        curX += headers[5].width;

        // Amount
        const amt = parseFloat(rec.invoiceAmount || "0") || 0;
        pdf.text(`$${amt.toFixed(2)}`, curX, yPos + 2.5);

        yPos += rowHeight;
      });

      // Total summary at bottom of table
      if (yPos > pageHeight - 25) {
        pdf.addPage();
        yPos = 15;
      }
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.text(`Total Records: ${summaryMetrics.totalRecords}`, margin + 2, yPos + 5);
      pdf.text(
        `Total Invoiced: $${summaryMetrics.totalCost.toFixed(2)}`,
        pageWidth - margin - 45,
        yPos + 5
      );

      const dateStr = format(new Date(), "yyyy-MM-dd");
      const pdfFileName =
        exportMode === "vehicle"
          ? `Vehicle_${activeVehicle?.vehicleNumber || "Report"}_${dateStr}.pdf`
          : `Service_${(selectedServiceName || "Report").replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}.pdf`;

      pdf.save(pdfFileName);
      toast.dismiss(toastId);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.dismiss(toastId);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header */}
      <DialogTitle className="bg-gradient-to-r from-[#F96176] to-[#e14a60] text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-lg">
            <FaFilter />
          </div>
          <div>
            <Typography variant="h6" className="font-bold text-white leading-tight">
              Export Service Data & Reports
            </Typography>
            <Typography variant="caption" className="text-pink-100 block">
              Filter by vehicle, service type, and date range to export Excel & PDF
            </Typography>
          </div>
        </div>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <FaTimes />
        </IconButton>
      </DialogTitle>

      <DialogContent className="p-6 bg-gray-50 flex flex-col gap-6">
        {/* Mode Switcher Tabs */}
        <div className="flex bg-gray-200/80 p-1.5 rounded-xl self-start gap-1">
          <button
            onClick={() => setExportMode("vehicle")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition ${
              exportMode === "vehicle"
                ? "bg-white text-[#F96176] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaTruck className="text-base" /> Export Data Vehicle-Wise
          </button>
          <button
            onClick={() => setExportMode("service")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition ${
              exportMode === "service"
                ? "bg-white text-[#10B981] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaWrench className="text-base" /> Export Data Service-Wise
          </button>
        </div>

        {/* Filter Configuration Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <FaFilter className="text-[#F96176]" /> Filter Criteria
            </h3>
            {(startDate || endDate) && (
              <button
                onClick={clearDateFilter}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear Date Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mode A: Vehicle-Wise Controls */}
            {exportMode === "vehicle" && (
              <>
                {/* Vehicle Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    1. Select Vehicle <span className="text-red-500">*</span>
                  </label>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedVehicleId}
                      onChange={(e: any) => setSelectedVehicleId(e.target.value)}
                      displayEmpty
                      sx={{ borderRadius: "8px", backgroundColor: "#F9FAFB" }}
                    >
                      {vehicles.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          <span className="font-semibold text-gray-900">{v.vehicleNumber}</span>
                          <span className="text-gray-400 text-xs ml-2">
                            ({v.companyName || "No Company"} • {v.vehicleType})
                          </span>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                {/* Service Selector (All or Specific) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    2. Select Service
                  </label>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedServiceOption}
                      onChange={(e: any) => setSelectedServiceOption(e.target.value)}
                      sx={{ borderRadius: "8px", backgroundColor: "#F9FAFB" }}
                    >
                      <MenuItem value="all">
                        <span className="font-semibold text-[#10B981]">All Services (Complete History)</span>
                      </MenuItem>
                      {uniqueServiceNames.map((sName) => (
                        <MenuItem key={sName} value={sName}>
                          {sName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </>
            )}

            {/* Mode B: Service-Wise Controls */}
            {exportMode === "service" && (
              <>
                {/* Service Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    1. Select Service <span className="text-red-500">*</span>
                  </label>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedServiceName}
                      onChange={(e: any) => setSelectedServiceName(e.target.value)}
                      sx={{ borderRadius: "8px", backgroundColor: "#F9FAFB" }}
                    >
                      {uniqueServiceNames.map((sName) => (
                        <MenuItem key={sName} value={sName}>
                          <span className="font-semibold text-gray-900">{sName}</span>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                {/* Vehicle Selector (All or Specific) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    2. Select Vehicle
                  </label>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedVehicleOption}
                      onChange={(e: any) => setSelectedVehicleOption(e.target.value)}
                      sx={{ borderRadius: "8px", backgroundColor: "#F9FAFB" }}
                    >
                      <MenuItem value="all">
                        <span className="font-semibold text-[#10B981]">All Vehicles</span>
                      </MenuItem>
                      {vehicles.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.vehicleNumber} ({v.companyName || "No Company"})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </>
            )}

            {/* Date Range Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                3. Date Range (Optional)
              </label>
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Start Date"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-[#F9FAFB] focus:outline-hidden focus:ring-2 focus:ring-[#F96176]"
                  dateFormat="MM/dd/yyyy"
                />
                <span className="text-gray-400 text-xs">-</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  placeholderText="End Date"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-[#F9FAFB] focus:outline-hidden focus:ring-2 focus:ring-[#F96176]"
                  dateFormat="MM/dd/yyyy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 block">Matched Records</span>
            <span className="text-xl font-bold text-[#F96176]">{summaryMetrics.totalRecords}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 block">Total Invoiced Amount</span>
            <span className="text-xl font-bold text-[#10B981]">
              ${summaryMetrics.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 block">Paid Invoices</span>
            <span className="text-xl font-bold text-[#10B981]">{summaryMetrics.paidCount}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 block">Unpaid / Pending</span>
            <span className="text-xl font-bold text-[#F96176]">
              {summaryMetrics.unpaidCount + summaryMetrics.partialCount}
            </span>
          </div>
        </div>

        {/* Preview Table Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Records Preview ({filteredData.length} records)
            </span>
            <span className="text-xs text-gray-400">
              Showing filtered data ready for export
            </span>
          </div>

          <div ref={previewTableRef} className="max-h-64 overflow-y-auto">
            {filteredData.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="font-semibold text-gray-600 mb-1">No matching records found</p>
                <p className="text-xs">Adjust the vehicle, service or date range filters above.</p>
              </div>
            ) : (
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", backgroundColor: "#F8FAFC" }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", backgroundColor: "#F8FAFC" }}>Vehicle #</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", backgroundColor: "#F8FAFC" }}>Miles/Hours</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", backgroundColor: "#F8FAFC" }}>Services & Subservices</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", backgroundColor: "#F8FAFC" }}>Workshop</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", backgroundColor: "#F8FAFC" }}>Inv #</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", backgroundColor: "#F8FAFC" }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", backgroundColor: "#F8FAFC" }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.slice(0, 50).map((record) => {
                      const isTrailer = record.vehicleDetails?.vehicleType === "Trailer";
                      const unitVal = isTrailer
                        ? `${record.hours || 0} hrs`
                        : record.miles && Number(record.miles) !== 0
                        ? `${record.miles} mi`
                        : record.hours && Number(record.hours) !== 0
                        ? `${record.hours} hrs`
                        : "-";

                      return (
                        <TableRow key={record.id} hover>
                          <TableCell sx={{ fontSize: "0.75rem" }} className="whitespace-nowrap font-medium">
                            {formatDateSafe(record.date)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }} className="font-semibold text-gray-900">
                            {record.vehicleDetails?.vehicleNumber || "-"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }} className="whitespace-nowrap">
                            {unitVal}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>
                            {(record.services || []).map((s) => formatServiceItem(s)).join(", ") || "-"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>
                            {record.workshopName || "-"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>
                            {record.invoice || "-"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }} align="right" className="font-semibold">
                            ${parseFloat(record.invoiceAmount || "0").toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                record.paymentStatus === "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : record.paymentStatus === "Partially Paid"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {record.paymentStatus || "Unpaid"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
          {filteredData.length > 50 && (
            <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
              Showing first 50 rows in preview. All {filteredData.length} rows will be included in the exported file.
            </div>
          )}
        </div>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: "8px", textTransform: "none" }}>
          Close
        </Button>

        <div className="flex items-center gap-3">
          {/* Download PDF */}
          <Button
            onClick={handleExportPdf}
            disabled={filteredData.length === 0 || isExportingPdf}
            variant="contained"
            sx={{
              backgroundColor: "#DC2626",
              "&:hover": { backgroundColor: "#B91C1C" },
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              gap: "8px",
            }}
          >
            <FaFilePdf /> Export to PDF
          </Button>

          {/* Download Excel */}
          <Button
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            variant="contained"
            sx={{
              backgroundColor: "#10B981",
              "&:hover": { backgroundColor: "#059669" },
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              gap: "8px",
            }}
          >
            <FaFileExcel /> Export to Excel (.xlsx)
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
