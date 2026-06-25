import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Grid,
  TextField,
  Typography,
  FormControlLabel,
  Button,
  Tabs,
  Tab,
  Radio,
  RadioGroup,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Select,
  FormControl,
  Stack,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import i18next from "i18next";
import { useNavigate } from "react-router-dom";
import { langData } from "../../data";
import {
  saveBusinessRegistration,
  getBusinessRegistration,
} from "../../api/businessTrip";

import "./Form.scss";

const EMPTY_FORM = {
  affiliDiv: "CDC",
  visitorDept: "",
  visitorNameEn: "",
  visitorNameKr: "",
  visitorPosition: "",
  email: "",
  purpose: "",
  relateDept: "",
  eVisa: "",
  businessTripFlightTicket: "",
  description: "",
  entryDateTime: "",
  exitDateTime: "",
  hotelReserveDate: "",
  hotelReserveDateTo: "",
  airportPickupYn: "Y",
  airportDropoffTime: "",
};

const formatDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultTrackingFilters = () => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 1);

  return {
    affiliDiv: "ALL",
    visitorName: "",
    visitorDept: "",
    fromDate: formatDateInputValue(fromDate),
    toDate: formatDateInputValue(toDate),
    status: "ALL",
  };
};

const POSITION_OPTIONS = [
  { value: "STAFF", label: "STAFF / 직원" },
  { value: "SUPERVISOR", label: "SUPERVISOR / 감독자" },
  { value: "MANAGER", label: "MANAGER / 매니저" },
  { value: "SENIOR MANAGER", label: "SENIOR MANAGER / 선임 매니저" },
  { value: "ASSISTANT DIRECTOR", label: "ASSISTANT DIRECTOR / 부이사" },
  { value: "DEPUTY DIRECTOR", label: "DEPUTY DIRECTOR / 부서장" },
  { value: "DIRECTOR", label: "DIRECTOR / 이사" },
  { value: "MANAGING DIRECTOR", label: "MANAGING DIRECTOR / 상무이사" },
  { value: "VICE GENERAL MANAGER", label: "VICE GENERAL MANAGER / 부총경리" },
  { value: "GENERAL MANAGER", label: "GENERAL MANAGER / 총경리" },
  { value: "CEO", label: "CEO / 대표이사" },
  { value: "OTHERS", label: "OTHERS / 기타" },
];


const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "ALL" },
  { value: "PENDING", label: "PENDING" },
  { value: "CONFIRMED", label: "CONFIRMED" },
  { value: "DENIED", label: "DENIED" },
];


const LANGUAGE_OPTIONS = [
  { value: "en", label: "US English", flag: "🇺🇸" },
  { value: "kr", label: "한국어", flag: "🇰🇷" },
  { value: "vn", label: "Tiếng Việt", flag: "🇻🇳" },
];

const normalizeLanguage = (language) => {
  const baseLanguage = String(language || "en").split("-")[0].toLowerCase();

  if (baseLanguage === "ko") return "kr";
  if (baseLanguage === "vi") return "vn";

  return LANGUAGE_OPTIONS.some((option) => option.value === baseLanguage)
    ? baseLanguage
    : "en";
};

const POCKETBASE_BASE_URL = "http://vjweb.dskorea.com:8090";
const POCKETBASE_COLLECTION = "GA_BUSINESS_TRIP_FILES";
const DOCUMENT_FILE_FIELD = "IMAGE_FILE";

const SEND_EMAIL_URL = "http://vjweb.dskorea.com/send-email";
const BUSINESS_TRIP_EMAIL_TO = "LENL.IT@changshininc.com";
const BUSINESS_TRIP_EMAIL_CC = "LENL.IT@changshininc.com; DO.IT@changshininc.com; PHUOC.IT@changshininc.com";

const EMPTY_FILE_DATA = {
  eVisaFiles: [],
  flightTicketFiles: [],
};

const getRowValue = (row, keys, defaultValue = "") => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) {
      return row[key];
    }
  }

  return defaultValue;
};

const formatDateDisplay = (value) => {
  if (!value) return "";

  const rawValue = String(value).trim();

  if (/^\d{12}$/.test(rawValue)) {
    const year = rawValue.substring(0, 4);
    const month = rawValue.substring(4, 6);
    const day = rawValue.substring(6, 8);
    const hour = rawValue.substring(8, 10);
    const minute = rawValue.substring(10, 12);
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  if (/^\d{8}$/.test(rawValue)) {
    const year = rawValue.substring(0, 4);
    const month = rawValue.substring(4, 6);
    const day = rawValue.substring(6, 8);
    return `${day}/${month}/${year}`;
  }

  return rawValue.replace("T", " ");
};

const getStatusCellSx = (statusValue) => {
  const status = String(statusValue || "").trim().toUpperCase();

  if (status === "PENDING") {
    return {
      bgcolor: "#FFEB3B",
      color: "#000",
      fontWeight: 700,
      textAlign: "center",
    };
  }

  if (status === "CONFIRMED" || status === "CONFIRM") {
    return {
      bgcolor: "#32CD32",
      color: "#000",
      fontWeight: 700,
      textAlign: "center",
    };
  }

  if (status === "DENIED") {
    return {
      bgcolor: "#F44336",
      color: "#fff",
      fontWeight: 700,
      textAlign: "center",
    };
  }

  return {
    bgcolor: "#fff",
    color: "#000",
    textAlign: "center",
  };
};


const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderEmailFileLinks = (value, linkText) => {
  if (!value) return "-";

  const parts = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) return "-";

  const safeLinkText = escapeHtml(linkText || "OPEN FILE");

  return parts
    .map((item, index) => {
      const safeItem = escapeHtml(item);
      const displayText = parts.length > 1
        ? `${safeLinkText} ${index + 1}`
        : safeLinkText;

      if (/^https?:\/\//i.test(item)) {
        return `- <a href="${safeItem}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: underline;">${displayText}</a>`;
      }

      return `- ${displayText}: ${safeItem}`;
    })
    .join("<br>");
};

const renderFileLinks = (value) => {
  if (!value) return "-";

  const parts = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) return "-";

  const hasUrl = parts.some((item) => /^https?:\/\//i.test(item));

  if (!hasUrl) {
    return parts.join(", ");
  }

  return parts.map((item, index) => {
    if (!/^https?:\/\//i.test(item)) {
      return (
        <Box component="span" key={`${item}-${index}`} sx={{ display: "block" }}>
          {item}
        </Box>
      );
    }

    return (
      <Box
        component="a"
        key={`${item}-${index}`}
        href={item}
        target="_blank"
        rel="noreferrer"
        sx={{ display: "block", color: "primary.main", textDecoration: "none" }}
      >
        File {index + 1}
      </Box>
    );
  });
};

export default function BusinessTripFormNewLayout() {
  const [tab, setTab] = useState(0);

  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(() => normalizeLanguage(i18n.language));

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [fileData, setFileData] = useState({ ...EMPTY_FILE_DATA });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [trackingFilters, setTrackingFilters] = useState(() => getDefaultTrackingFilters());
  const [trackingRows, setTrackingRows] = useState([]);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [hasLoadedTracking, setHasLoadedTracking] = useState(false);

  useEffect(() => {
    setLanguage(normalizeLanguage(i18n.language));
  }, [i18n.language]);

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;

    setLanguage(nextLanguage);
    i18n.changeLanguage(nextLanguage);
    localStorage.setItem("i18nextLng", nextLanguage);
  };

  const renderSelectedLanguage = (selectedLanguage) => {
    const option = LANGUAGE_OPTIONS.find((item) => item.value === selectedLanguage) || LANGUAGE_OPTIONS[0];

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box component="span" sx={{ fontSize: 28, lineHeight: 1 }}>
          {option.flag}
        </Box>
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
          {option.label}
        </Typography>
      </Box>
    );
  };

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleTrackingInputChange = (field) => (event) => {
    setTrackingFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const getDateFromDateTime = (dateTimeValue) => {
    if (!dateTimeValue) return "";

    const dateValue = dateTimeValue.split("T")[0];
    return dateValue || "";
  };

  const handleEntryDateTimeChange = (event) => {
    const entryDateTime = event.target.value;

    setFormData((prev) => ({
      ...prev,
      entryDateTime,
      hotelReserveDate: getDateFromDateTime(entryDateTime),
    }));
  };

  const getDefaultAirportDropoffTime = (exitDateTime) => {
    if (!exitDateTime) return "";

    const exitDate = exitDateTime.split("T")[0];
    if (!exitDate) return "";

    return `${exitDate}T08:30`;
  };

  const handleExitDateTimeChange = (event) => {
    const exitDateTime = event.target.value;

    setFormData((prev) => ({
      ...prev,
      exitDateTime,
      hotelReserveDateTo: getDateFromDateTime(exitDateTime),
      airportDropoffTime: getDefaultAirportDropoffTime(exitDateTime),
    }));
  };

  const formatDateTimeForSave = (dateTimeValue) => {
    if (!dateTimeValue) return "";

    const normalizedValue = dateTimeValue.replace("T", " ");
    const [datePart, timePart = ""] = normalizedValue.split(" ");
    const [year = "", month = "", day = ""] = datePart.split("-");
    const [hour = "00", minute = "00"] = timePart.split(":");

    if (!year || !month || !day) return "";

    return `${year}${month}${day}${hour}${minute}`;
  };

  const formatDateForSave = (dateValue) => {
    if (!dateValue) return "";

    const [year = "", month = "", day = ""] = dateValue.split("-");

    if (!year || !month || !day) return "";

    return `${year}${month}${day}`;
  };

  const handleFileChange = (field, fileField) => (event) => {
    const files = Array.from(event.target.files || []);
    const fileNameText = files.map((file) => file.name).join(", ");

    setFileData((prev) => ({
      ...prev,
      [fileField]: files,
    }));

    setFormData((prev) => ({
      ...prev,
      [field]: fileNameText,
    }));
  };

  const uploadBusinessTripFiles = async ({
    empNo,
    docId,
    docName,
    files,
    note,
    addPersonId,
  }) => {
    if (!files || files.length === 0) {
      return {
        recordId: "",
        fileNames: "",
        fileUrls: "",
      };
    }

    const uploadFormData = new FormData();

    uploadFormData.append("SERVICE_ID", "VJ");
    uploadFormData.append("COMPANY", "VJ");
    uploadFormData.append("DOC_ID", docId);
    uploadFormData.append("EMP_NO", empNo);
    uploadFormData.append("FILE_NAME", files.map((file) => file.name).join(", "));
    uploadFormData.append("NOTE", note || "");
    uploadFormData.append("ADD_PERSON_ID", addPersonId);
    uploadFormData.append("ADD_DTTM", new Date().toISOString());
    uploadFormData.append("DOC_NAME", docName);

    files.forEach((file) => {
      uploadFormData.append(DOCUMENT_FILE_FIELD, file);
    });

    const response = await fetch(
      `${POCKETBASE_BASE_URL}/api/collections/${POCKETBASE_COLLECTION}/records`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Upload failed: ${docName}`);
    }

    const record = await response.json();
    const documentFiles = Array.isArray(record[DOCUMENT_FILE_FIELD])
      ? record[DOCUMENT_FILE_FIELD]
      : record[DOCUMENT_FILE_FIELD]
        ? [record[DOCUMENT_FILE_FIELD]]
        : [];

    const fileUrls = documentFiles.map((documentFile) => (
      `${POCKETBASE_BASE_URL}/api/files/` +
      `${record.collectionId}/` +
      `${record.id}/` +
      `${encodeURIComponent(documentFile)}`
    ));

    return {
      recordId: record.id || "",
      fileNames: files.map((file) => file.name).join(", "),
      fileUrls: fileUrls.join(", "),
    };
  };

  const validateForm = () => {
    if (!formData.affiliDiv) return t("business_trip_factory") + " is required";
    if (!formData.visitorDept?.trim()) return t("business_trip_dept_from") + " is required";
    if (!formData.visitorNameEn?.trim()) return t("business_trip_name_en") + " is required";
    if (!formData.email?.trim()) return "Email is required";
    if (!formData.purpose?.trim()) return t("business_trip_purpose") + " is required";
    if (!formData.entryDateTime) return t("business_trip_entry_time") + " is required";
    if (!formData.exitDateTime) return t("business_trip_exit_time") + " is required";
    return "";
  };

  const fetchTrackingData = useCallback(async () => {
    setIsLoadingTracking(true);
    setTrackingError("");

    try {
      const result = await getBusinessRegistration({
        argFromDate: formatDateForSave(trackingFilters.fromDate) || null,
        argToDate: formatDateForSave(trackingFilters.toDate) || null,
        argVisitorDept: trackingFilters.visitorDept?.trim() || null,
        argVisitorName: trackingFilters.visitorName?.trim() || null,
        argStatus: trackingFilters.status && trackingFilters.status !== "ALL"
          ? trackingFilters.status
          : null,
      });

      if (result.success) {
        setTrackingRows(Array.isArray(result.data) ? result.data : []);
        setHasLoadedTracking(true);
      } else {
        setTrackingRows([]);
        setTrackingError(result.error?.message || "Cannot load business trip data.");
      }
    } catch (error) {
      console.error("Error loading business trip tracking:", error);
      setTrackingRows([]);
      setTrackingError(error.message || "Cannot load business trip data.");
    } finally {
      setIsLoadingTracking(false);
    }
  }, [
    trackingFilters.fromDate,
    trackingFilters.toDate,
    trackingFilters.visitorDept,
    trackingFilters.visitorName,
    trackingFilters.status,
  ]);

  useEffect(() => {
    if (tab === 1 && !hasLoadedTracking) {
      fetchTrackingData();
    }
  }, [tab, hasLoadedTracking, fetchTrackingData]);

  const handleSearchTracking = () => {
    fetchTrackingData();
  };

  const handleResetTracking = () => {
    setTrackingFilters(getDefaultTrackingFilters());
    setHasLoadedTracking(false);
  };

  const filteredTrackingRows = trackingRows.filter((row) => {
    const rowFactory = getRowValue(row, ["AFFILI_DIV", "affiliDiv"]);
    const rowEnglishName = String(
      getRowValue(row, ["VISITOR_NAME_EN", "visitorNameEn"])
    ).toLowerCase();
    const rowVisitorDept = String(
      getRowValue(row, ["VISITOR_DEPT", "visitorDept"])
    ).toLowerCase();
    const rowStatus = String(
      getRowValue(row, ["STATUS", "status"])
    ).trim().toUpperCase();

    const filterFactory = trackingFilters.affiliDiv;
    const filterEnglishName = trackingFilters.visitorName.trim().toLowerCase();
    const filterVisitorDept = trackingFilters.visitorDept.trim().toLowerCase();
    const filterStatus = String(trackingFilters.status || "ALL").trim().toUpperCase();

    const isMatchedFactory = filterFactory === "ALL" || rowFactory === filterFactory;
    const isMatchedEnglishName =
      !filterEnglishName || rowEnglishName.includes(filterEnglishName);
    const isMatchedVisitorDept =
      !filterVisitorDept || rowVisitorDept.includes(filterVisitorDept);
    const isMatchedStatus = filterStatus === "ALL" || rowStatus === filterStatus;

    return (
      isMatchedFactory &&
      isMatchedEnglishName &&
      isMatchedVisitorDept &&
      isMatchedStatus
    );
  });

  const formatEmailDateOnly = (value) => {
    if (!value) return "-";

    const rawValue = String(value).trim();

    if (/^\d{12}$/.test(rawValue)) {
      return `${rawValue.substring(0, 4)}-${rawValue.substring(4, 6)}-${rawValue.substring(6, 8)}`;
    }

    if (/^\d{8}$/.test(rawValue)) {
      return `${rawValue.substring(0, 4)}-${rawValue.substring(4, 6)}-${rawValue.substring(6, 8)}`;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(rawValue)) {
      return rawValue.substring(0, 10);
    }

    return escapeHtml(rawValue);
  };

  const formatEmailDateTime = (value) => {
    if (!value) return "-";

    const rawValue = String(value).trim();

    if (/^\d{12}$/.test(rawValue)) {
      return (
        `${rawValue.substring(0, 4)}-${rawValue.substring(4, 6)}-${rawValue.substring(6, 8)} ` +
        `${rawValue.substring(8, 10)}:${rawValue.substring(10, 12)}`
      );
    }

    if (/^\d{8}$/.test(rawValue)) {
      return `${rawValue.substring(0, 4)}-${rawValue.substring(4, 6)}-${rawValue.substring(6, 8)}`;
    }

    return escapeHtml(rawValue.replace("T", " "));
  };

  const renderEmailTableFileLink = (value, linkText) => {
    if (!value) return "-";

    const parts = String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!parts.length) return "-";

    const safeLinkText = escapeHtml(linkText);

    return parts
      .map((item, index) => {
        const safeItem = escapeHtml(item);
        const displayText = parts.length > 1
          ? `${safeLinkText} ${index + 1}`
          : safeLinkText;

        if (/^https?:\/\//i.test(item)) {
          return `<a href="${safeItem}" target="_blank" rel="noopener noreferrer" style="color:#0000ee;text-decoration:underline;">${displayText}</a>`;
        }

        return `${displayText}: ${safeItem}`;
      })
      .join("<br>");
  };

  const buildEmailTableRow = (label, value) => {
    return (
      `<tr>` +
        `<th style="border:1px solid #d9d9d9;background:#f7f7f7;padding:7px 8px;text-align:left;width:190px;font-weight:700;vertical-align:top;">${escapeHtml(label)}</th>` +
        `<td style="border:1px solid #d9d9d9;padding:7px 8px;vertical-align:top;">${value || "-"}</td>` +
      `</tr>`
    );
  };

  const buildBusinessTripEmailHtml = ({
    eVisaForSave,
    flightTicketForSave,
    entryDateTimeForSave,
    exitDateTimeForSave,
    hotelReserveDateForSave,
    hotelReserveDateToForSave,
    airportDropoffTimeForSave,
  }) => {
    const businessTripPeriod =
      `${formatEmailDateOnly(entryDateTimeForSave)} ~ ${formatEmailDateOnly(exitDateTimeForSave)}`;

    const arrivalDepartureInVietnam =
      `${formatEmailDateTime(entryDateTimeForSave)} ~ ${formatEmailDateTime(exitDateTimeForSave)}`;

    const hotelBookingPeriod = hotelReserveDateToForSave
      ? `${formatEmailDateOnly(hotelReserveDateForSave)} ~ ${formatEmailDateOnly(hotelReserveDateToForSave)}`
      : formatEmailDateOnly(hotelReserveDateForSave);

    const airportDropoffText = formData.airportPickupYn === "Y"
      ? formatEmailDateTime(airportDropoffTimeForSave)
      : "Not Needed";

    const rows = [
      buildEmailTableRow("Visitor Name (English)", escapeHtml(formData.visitorNameEn)),
      buildEmailTableRow("Visitor Name (Korean)", escapeHtml(formData.visitorNameKr)),
      buildEmailTableRow("Position", escapeHtml(formData.visitorPosition)),
      buildEmailTableRow("Purpose", escapeHtml(formData.purpose)),
      buildEmailTableRow("Business trip period", escapeHtml(businessTripPeriod)),
      buildEmailTableRow("Arrival / Departure in Vietnam", escapeHtml(arrivalDepartureInVietnam)),
      buildEmailTableRow("Airline tickets", renderEmailTableFileLink(flightTicketForSave, "Click to view flight tickets")),
      buildEmailTableRow("E-Visa / APEC Card", renderEmailTableFileLink(eVisaForSave, "Click to view E-VISA / APEC CARD")),
      buildEmailTableRow("Hotel booking date", escapeHtml(hotelBookingPeriod)),
      buildEmailTableRow("Relevant departments", escapeHtml(formData.relateDept)),
      buildEmailTableRow("Airport Pick-up", formData.airportPickupYn === "Y" ? "Required" : "Not Needed"),
      buildEmailTableRow("Airport Drop-off Time", escapeHtml(airportDropoffText)),
      
    ].join("");

    return (
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;line-height:1.35;">` +
        `<p style="margin:0 0 12px 0;"><b>Dear GA Team, <br> Please check the business trip information below: </b></p>` +
        `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:620px;max-width:100%;border:1px solid #d9d9d9;">` +
          `<tbody>${rows}</tbody>` +
        `</table> <br>` +
        `<p style="margin:0 0 12px 0;"><b>Best regards, </b></p>` +
      `</div>`
    );
  };

  const sendBusinessTripEmail = async ({
    regId,
    empNo,
    eVisaForSave,
    flightTicketForSave,
    entryDateTimeForSave,
    exitDateTimeForSave,
    hotelReserveDateForSave,
    hotelReserveDateToForSave,
    airportDropoffTimeForSave,
  }) => {
    const payload = {
      to: BUSINESS_TRIP_EMAIL_TO,
      carbon_copy: BUSINESS_TRIP_EMAIL_CC,
      blind_carbon_copy: "",
      subject: `[Business Trip] ${formData.visitorNameEn || "New Registration"} - ${formData.affiliDiv}`,
      html: buildBusinessTripEmailHtml({
        regId,
        empNo,
        eVisaForSave,
        flightTicketForSave,
        entryDateTimeForSave,
        exitDateTimeForSave,
        hotelReserveDateForSave,
        hotelReserveDateToForSave,
        airportDropoffTimeForSave,
      }),
    };

    const response = await fetch(SEND_EMAIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Send email failed");
    }

    const responseText = await response.text();

    try {
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch (error) {
      return { success: true, data: responseText };
    }
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    

    const validationMessage = validateForm();
    if (validationMessage) {
      alert(validationMessage);
      return;
    }
    

    setIsSubmitting(true);

    try {
      const rawUserData = localStorage.getItem("userData") || sessionStorage.getItem("userData");
      const parsedUserData = JSON.parse(rawUserData || "{}");
      const empNo = parsedUserData?.EMPID || parsedUserData?.EMP_NO || "";
      const userId = parsedUserData?.EMPID || parsedUserData?.USER_ID || parsedUserData?.USERID || "SYSTEM";

      if (!formData.affiliDiv) {
        alert("Please select factory.");
        setIsSubmitting(false);
        return;
      }

      const uploadDocId = `BUSINESS_TRIP_${empNo || userId}_${Date.now()}`;
      const uploadNote = formData.description || "";

      const eVisaUpload = await uploadBusinessTripFiles({
        empNo,
        docId: uploadDocId,
        docName: "BUSINESS_TRIP_E_VISA_APEC_CARD",
        files: fileData.eVisaFiles,
        note: uploadNote,
        addPersonId: userId,
      });

      const flightTicketUpload = await uploadBusinessTripFiles({
        empNo,
        docId: uploadDocId,
        docName: "BUSINESS_TRIP_FLIGHT_TICKET",
        files: fileData.flightTicketFiles,
        note: uploadNote,
        addPersonId: userId,
      });

      const eVisaForSave = eVisaUpload.fileUrls || formData.eVisa;
      const flightTicketForSave = flightTicketUpload.fileUrls || formData.businessTripFlightTicket;

      const entryDateTimeForSave = formatDateTimeForSave(formData.entryDateTime);
      const exitDateTimeForSave = formatDateTimeForSave(formData.exitDateTime);
      const hotelReserveDateForSave = formatDateForSave(formData.hotelReserveDate);
      const hotelReserveDateToForSave = formatDateForSave(formData.hotelReserveDateTo);
      const airportDropoffTimeForSave = formatDateTimeForSave(formData.airportDropoffTime);

      const detailJson = [
        {
          AFFILI_DIV: formData.affiliDiv,
          affiliDiv: formData.affiliDiv,

          VISITOR_DEPT: formData.visitorDept,
          visitorDept: formData.visitorDept,

          VISITOR_NAME_EN: formData.visitorNameEn,
          visitorNameEn: formData.visitorNameEn,

          VISITOR_NAME_KR: formData.visitorNameKr,
          visitorNameKr: formData.visitorNameKr,

          VISITOR_POSITION: formData.visitorPosition,
          visitorPosition: formData.visitorPosition,

          EMAIL: formData.email,
          email: formData.email,

          PURPOSE: formData.purpose,
          purpose: formData.purpose,

          RELATE_DEPT: formData.relateDept,
          relateDept: formData.relateDept,

          E_VISA: eVisaForSave,
          eVisa: eVisaForSave,

          BUSINESS_TRIP_FLIGHT_TICKET: flightTicketForSave,
          businessTripFlightTicket: flightTicketForSave,

          DESCRIPTION: formData.description,
          description: formData.description,

          ENTRY_DATE_TIME: entryDateTimeForSave,
          entryDateTime: entryDateTimeForSave,

          EXIT_DATE_TIME: exitDateTimeForSave,
          exitDateTime: exitDateTimeForSave,

          HOTEL_RESERVE_DATE: hotelReserveDateForSave,
          hotelReserveDate: hotelReserveDateForSave,

          HOTEL_RESERVE_DATE_TO: hotelReserveDateToForSave,
          hotelReserveDateTo: hotelReserveDateToForSave,

          AIRPORT_PICKUP_YN: formData.airportPickupYn,
          airportPickupYn: formData.airportPickupYn,

          AIRPORT_DROPOFF_TIME: airportDropoffTimeForSave,
          airportDropoffTime: airportDropoffTimeForSave,
        },
      ];

      const registrationData = {
        argEmpNo: empNo,
        argRegType: "BUSINESS_TRIP",
        argVisitorDept: formData.visitorDept,
        argRemarks: formData.description,
        argCreatedBy: userId,
        argDetailJson: detailJson,
      };
      
      const result = await saveBusinessRegistration(registrationData);   

      if (result.success) {
        let emailSent = false;
        
        try {
          await sendBusinessTripEmail({
            regId: result.data?.regId,
            empNo,
            eVisaForSave,
            flightTicketForSave,
            entryDateTimeForSave,
            exitDateTimeForSave,
            hotelReserveDateForSave,
            hotelReserveDateToForSave,
            airportDropoffTimeForSave,
          });
          emailSent = true;
        } catch (emailError) {
          console.error("Business trip saved but email sending failed:", emailError);
        }

        alert(
          emailSent
            ? `Save successful and email sent. Reg ID: ${result.data?.regId || ""}`
            : `Save successful but email sending failed. Reg ID: ${result.data?.regId || ""}`
        );

        setFormData({ ...EMPTY_FORM });
        setFileData({ ...EMPTY_FILE_DATA });
        setHasLoadedTracking(false);
      } else {
        alert(`Save failed: ${result.error?.message || result.data?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving business trip registration:", error);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box className="business-trip-form" sx={{ bgcolor: "#fff" }}>
      <Box
        className="business-trip-header"
        sx={{
          minHeight: 64,
          px: 3,
          py: 1,
          bgcolor: "#1b0065",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
        }}
      >
        <Box
          className="business-trip-header-title"
          sx={{
            color: "#fff",
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: 0.2,
          }}
        >
          <Typography
            component="div"
            sx={{
              color: "#fff",
              fontSize: 24,
              fontWeight: 800,
              fontStyle: "italic",
              lineHeight: 1,
            }}
          >
            General Affairs
          </Typography>
          <Typography
            component="div"
            sx={{
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
              mt: 0.25,
            }}
          >
            System
          </Typography>
        </Box>

        <Box
          className="business-trip-language-bar"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <TextField
            select
            variant="standard"
            value={language}
            onChange={handleLanguageChange}
            SelectProps={{
              renderValue: renderSelectedLanguage,
              disableUnderline: true,
            }}
            InputProps={{
              disableUnderline: true,
            }}
            sx={{
              minWidth: 150,
              bgcolor: "#1b0065 !important",
              border: "1px solid rgba(255,255,255,0.45)",
              borderRadius: 1,
              px: 1,
              py: 0.25,
              "& .MuiInputBase-root": {
                bgcolor: "#1b0065 !important",
                color: "#fff !important",
              },
              "& .MuiInputBase-root:before": {
                borderBottom: "0 !important",
              },
              "& .MuiInputBase-root:after": {
                borderBottom: "0 !important",
              },
              "& .MuiInputBase-root:hover:not(.Mui-disabled):before": {
                borderBottom: "0 !important",
              },
              "& .MuiSelect-select": {
                bgcolor: "#1b0065 !important",
                color: "#fff !important",
                display: "flex",
                alignItems: "center",
                py: "6px !important",
              },
              "& .MuiTypography-root": {
                color: "#fff !important",
              },
              "& .MuiSelect-icon": {
                color: "#fff !important",
              },
              "& .MuiInputBase-input": {
                color: "#fff !important",
                py: 0.5,
              },
            }}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box component="span" sx={{ fontSize: 24, lineHeight: 1 }}>
                    {option.flag}
                  </Box>
                  <Typography>{option.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Tabs
        className="business-trip-tabs"
        value={tab}
        onChange={(e, value) => setTab(value)}
      >
        <Tab label={t("business_trip_register")} />
        <Tab label={t("business_trip_tracking")} />
      </Tabs>

      {tab === 0 && (
        <Box className="business-trip-card business-trip-register-card" sx={{ border: "1px solid #ccc", p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            {t("business_trip_title")}
          </Typography>

          <Grid container spacing={2} className="business-trip-grid">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t("business_trip_name_en")}
                value={formData.visitorNameEn}
                onChange={handleInputChange("visitorNameEn")}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t("business_trip_name_kr")}
                value={formData.visitorNameKr}
                onChange={handleInputChange("visitorNameKr")}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={handleInputChange("email")}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography sx={{ mb: 1 }}>
                {t("business_trip_factory")}
              </Typography>

              <RadioGroup
                row
                value={formData.affiliDiv}
                onChange={handleInputChange("affiliDiv")}
                sx={{ minHeight: 56, alignItems: "center" }}
              >
                <FormControlLabel value="CDC" control={<Radio />} label="CDC" />
                <FormControlLabel value="JJ" control={<Radio />} label="JJ" />
                <FormControlLabel value="QD" control={<Radio />} label="QD" />
              </RadioGroup>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t("business_trip_dept_from")}
                value={formData.visitorDept}
                onChange={handleInputChange("visitorDept")}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label={t("business_trip_position")}
                value={formData.visitorPosition}
                onChange={handleInputChange("visitorPosition")}
              >
                {POSITION_OPTIONS.map((position) => (
                  <MenuItem key={position.value} value={position.value}>
                    {position.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t("business_trip_info")}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t("business_trip_purpose")}
                value={formData.purpose}
                onChange={handleInputChange("purpose")}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t("business_trip_dept_related")}
                value={formData.relateDept}
                onChange={handleInputChange("relateDept")}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t("business_trip_note")}
                value={formData.description}
                onChange={handleInputChange("description")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Button variant="outlined" component="label">
                {t("business_trip_upload_e_visa")}
                <input
                  hidden
                  multiple
                  type="file"
                  onChange={handleFileChange("eVisa", "eVisaFiles")}
                />
              </Button>
              {formData.eVisa && (
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  {formData.eVisa}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Button variant="outlined" component="label">
                {t("business_trip_upload_flight_ticket")}
                <input
                  hidden
                  multiple
                  type="file"
                  onChange={handleFileChange("businessTripFlightTicket", "flightTicketFiles")}
                />
              </Button>
              {formData.businessTripFlightTicket && (
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  {formData.businessTripFlightTicket}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="datetime-local"
                label={t("business_trip_entry_time")}
                value={formData.entryDateTime}
                onChange={handleEntryDateTimeChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="datetime-local"
                label={t("business_trip_exit_time")}
                value={formData.exitDateTime}
                onChange={handleExitDateTimeChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label={t("business_trip_hotel_reservation_date_from", "Hotel Reservation Date From")}
                value={formData.hotelReserveDate}
                onChange={handleInputChange("hotelReserveDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label={t("business_trip_hotel_reservation_date_to", "Hotel Reservation Date To")}
                value={formData.hotelReserveDateTo}
                onChange={handleInputChange("hotelReserveDateTo")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <RadioGroup
                row
                value={formData.airportPickupYn}
                onChange={handleInputChange("airportPickupYn")}
                sx={{ height: "100%", alignItems: "center" }}
              >
                <FormControlLabel
                  value="Y"
                  control={<Radio />}
                  label={t("business_trip_airport_pickup_required")}
                />
                <FormControlLabel
                  value="N"
                  control={<Radio />}
                  label={t("business_trip_not_need_airport_pickup")}
                />
              </RadioGroup>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                type="datetime-local"
                label={t("business_trip_airport_dropoff_required")}
                value={formData.airportDropoffTime}
                onChange={handleInputChange("airportDropoffTime")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sx={{ textAlign: "right" }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("saving") || "Saving..." : t("save")}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {tab === 1 && (
        <Box
          className="business-trip-card business-trip-tracking-card"
          sx={{
            border: "1px solid #ccc",
            minHeight: 600,
            p: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            {t("business_trip_tracking") || "Business Trip Tracking"}
          </Typography>

          <Grid container spacing={2} className="business-trip-filter-grid" sx={{ mb: 2 }}>
                        <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label={t("fromDate") || "From Date"}
                value={trackingFilters.fromDate}
                onChange={handleTrackingInputChange("fromDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label={t("toDate") || "To Date"}
                value={trackingFilters.toDate}
                onChange={handleTrackingInputChange("toDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label={t("business_trip_factory") || "Factory"}
                value={trackingFilters.affiliDiv}
                onChange={handleTrackingInputChange("affiliDiv")}
              >
                <MenuItem value="ALL">ALL</MenuItem>
                <MenuItem value="CDC">CDC</MenuItem>
                <MenuItem value="JJ">JJ</MenuItem>
                <MenuItem value="QD">QD</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label={t("status") || "Status"}
                value={trackingFilters.status}
                onChange={handleTrackingInputChange("status")}
              >
                {STATUS_FILTER_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label={t("business_trip_name_en") || "English Name"}
                value={trackingFilters.visitorName}
                onChange={handleTrackingInputChange("visitorName")}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label={t("business_trip_dept_from") || "From Department"}
                value={trackingFilters.visitorDept}
                onChange={handleTrackingInputChange("visitorDept")}
              />
            </Grid>

            <Grid item xs={12} sx={{ textAlign: "right" }}>
              <Button
                variant="outlined"
                onClick={handleResetTracking}
                disabled={isLoadingTracking}
                sx={{ mr: 1 }}
              >
                {t("reset") || "Reset"}
              </Button>
              <Button
                variant="contained"
                onClick={handleSearchTracking}
                disabled={isLoadingTracking}
              >
                {isLoadingTracking ? "Loading..." : t("search") || "Search"}
              </Button>
            </Grid>
          </Grid>

          {trackingError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {trackingError}
            </Typography>
          )}

          {isLoadingTracking ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              className="business-trip-tracking-table"
              component={Paper}
              sx={{
                maxHeight: 520,
                overflow: "auto",
                "& .MuiTableCell-root": {
                  verticalAlign: "middle",
                  px: 1.25,
                  py: 1,
                  fontSize: "0.875rem",
                },
                "& .MuiTableCell-head": {
                  fontWeight: 700,
                  whiteSpace: "normal",
                  lineHeight: 1.25,
                  minWidth: 110,
                  maxWidth: 150,
                  wordBreak: "normal",
                  overflowWrap: "break-word",
                },
                "& .MuiTableCell-body": {
                  whiteSpace: "normal",
                  lineHeight: 1.35,
                  minWidth: 110,
                  maxWidth: 180,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                },
                "& .tracking-col-xs": {
                  width: 75,
                  minWidth: 75,
                  maxWidth: 75,
                },
                "& .tracking-col-sm": {
                  width: 105,
                  minWidth: 105,
                  maxWidth: 105,
                },
                "& .tracking-col-md": {
                  width: 135,
                  minWidth: 135,
                  maxWidth: 135,
                },
                "& .tracking-col-lg": {
                  width: 170,
                  minWidth: 170,
                  maxWidth: 170,
                },
                "& .tracking-col-xl": {
                  width: 210,
                  minWidth: 210,
                  maxWidth: 210,
                },
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  width: "100%",
                  minWidth: 2450,
                  tableLayout: "fixed",
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell className="tracking-col-sm">{t("requestDate") || "Request Date"}</TableCell>
                    <TableCell className="tracking-col-xs">{t("from") || "From"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_name_en") || "English Name"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_name_kr") || "Korean Name"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_dept_from") || "From Department"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_position") || "Position"}</TableCell>
                    <TableCell className="tracking-col-xl">{t("email") || "Email"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_dept_related") || "Related Dept"}</TableCell>
                    <TableCell className="tracking-col-lg">{t("business_trip_purpose") || "Purpose"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_entry_time") || "Entry"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_exit_time") || "Exit"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_hotel_reservation_date_from", "Hotel Date From")}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_hotel_reservation_date_to", "Hotel Date To")}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_airport_pickup_required") || "Airport"}</TableCell>
                    <TableCell className="tracking-col-sm">{t("e_visa_apec_card") || "E-Visa / APEC"}</TableCell>
                    <TableCell className="tracking-col-sm">{t("flight_ticket") || "Flight Ticket"}</TableCell>
                    <TableCell className="tracking-col-sm">{t("status") || "Status"}</TableCell>
                    <TableCell className="tracking-col-sm">{t("hotel") || "Hotel"}</TableCell>
                    <TableCell className="tracking-col-sm">{t("google_maps") || "Google Maps"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrackingRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={19} align="center">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrackingRows.map((row, index) => (
                      <TableRow key={getRowValue(row, ["REG_ID", "regId"], index)} hover>                        
                        <TableCell>{getRowValue(row, ["REQ_DATE", "reqDate"])}</TableCell>
                        <TableCell>{getRowValue(row, ["AFFILI_DIV", "affiliDiv"])}</TableCell>
                        <TableCell>{getRowValue(row, ["VISITOR_NAME_EN", "visitorNameEn"])}</TableCell>
                        <TableCell>{getRowValue(row, ["VISITOR_NAME_KR", "visitorNameKr"])}</TableCell>
                        <TableCell>{getRowValue(row, ["VISITOR_DEPT", "visitorDept"])}</TableCell>
                        <TableCell>{getRowValue(row, ["VISITOR_POSITION", "visitorPosition"])}</TableCell>
                        <TableCell>{getRowValue(row, ["EMAIL", "email"])}</TableCell>
                        <TableCell>{getRowValue(row, ["RELATE_DEPT", "relateDept"])}</TableCell>
                        <TableCell>{getRowValue(row, ["PURPOSE", "purpose"])}</TableCell>
                        <TableCell>{formatDateDisplay(getRowValue(row, ["ENTRY_DATE_TIME", "entryDateTime"]))}</TableCell>
                        <TableCell>{formatDateDisplay(getRowValue(row, ["EXIT_DATE_TIME", "exitDateTime"]))}</TableCell>
                        <TableCell>{formatDateDisplay(getRowValue(row, ["HOTEL_RESERVE_DATE", "hotelReserveDate"]))}</TableCell>
                        <TableCell>{formatDateDisplay(getRowValue(row, ["HOTEL_RESERVE_DATE_TO", "hotelReserveDateTo"]))}</TableCell>
                        <TableCell>
                          {getRowValue(row, ["AIRPORT_PICKUP_YN", "airportPickupYn"]) === "Y" ? "Required" : "Not Needed"}
                          <br />
                          {formatDateDisplay(getRowValue(row, ["AIRPORT_DROPOFF_TIME", "airportDropoffTime"]))}
                        </TableCell>
                        <TableCell>{renderFileLinks(getRowValue(row, ["E_VISA", "eVisa"]))}</TableCell>
                        <TableCell>{renderFileLinks(getRowValue(row, ["BUSINESS_TRIP_FLIGHT_TICKET", "businessTripFlightTicket"]))}</TableCell>
                        {(() => {
                          const statusValue = getRowValue(row, ["STATUS", "status"]);

                          return (
                            <TableCell sx={getStatusCellSx(statusValue)}>
                              {statusValue}
                            </TableCell>
                          );
                        })()
                        }
                        <TableCell>{getRowValue(row, ["HOTEL_NAME", "hotel"])}</TableCell>
                        <TableCell>
                          {(() => {
                            const googleMapsUrl = getRowValue(row, ["GOOGLE_MAP_LINK", "googleMaps"]);
                            if (googleMapsUrl) {
                              return (
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#0000ee", textDecoration: "underline" }}
                                >
                                  {t("view") || "View"}
                                </a>
                              );
                            }
                            return "-";
                          })()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
   
  );
}
