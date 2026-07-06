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
  Avatar,
  Menu,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
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
  const today = new Date();

  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 14);

  const toDate = new Date(today);
  toDate.setDate(today.getDate() + 14);

  return {
    affiliDiv: "ALL",
    visitorName: "",
    visitorDept: "",
    fromDate: formatDateInputValue(fromDate),
    toDate: formatDateInputValue(toDate),
    status: "ALL",
  };
};
/*
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
];*/

const POSITION_OPTIONS = [
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
  { value: "P4", label: "P4" }, 
  { value: "DEPUTY DIRECTOR", label: "DEPUTY DIRECTOR / 팀장 / TRƯỞNG NHÓM - BỘ PHẬN" },
  { value: "DIRECTOR", label: "DIRECTOR / 이사 / GIÁM ĐỐC" },
  { value: "MANAGING DIRECTOR", label: "MANAGING DIRECTOR / 상무 / GIÁM ĐỐC ĐIỀU HÀNH" },
  { value: "EXECUTIVE DIRECTOR", label: "EXECUTIVE DIRECTOR / 전무 / GIÁM ĐỐC ĐIỀU HÀNH CẤP CAO" },
  { value: "VICE GENERAL MANAGER", label: "VICE GENERAL MANAGER / 부사장 / PHÓ TỔNG GIÁM ĐỐC" },
  { value: "GENERAL MANAGER", label: "GENERAL MANAGER / 사장 / TỔNG GIÁM ĐỐC" },
  { value: "OTHERS", label: "OTHERS / 기타 / CHỨC VỤ KHÁC" },
];


const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "ALL" },
  { value: "PENDING", label: "PENDING" },
  { value: "CONFIRMED", label: "CONFIRMED" },
  { value: "DENIED", label: "DENIED" },
];

const TRACKING_PAGE_SIZE = 15;

const svgToDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const LANGUAGE_OPTIONS = [
  {
    value: "en",
    label: "English",
    flagSrc: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
        <rect width="60" height="40" fill="#fff"/>
        <g fill="#b22234">
          <rect y="0" width="60" height="3.08"/>
          <rect y="6.16" width="60" height="3.08"/>
          <rect y="12.32" width="60" height="3.08"/>
          <rect y="18.48" width="60" height="3.08"/>
          <rect y="24.64" width="60" height="3.08"/>
          <rect y="30.8" width="60" height="3.08"/>
          <rect y="36.96" width="60" height="3.08"/>
        </g>
        <rect width="24" height="21.56" fill="#3c3b6e"/>
        <g fill="#fff">
          <circle cx="4" cy="4" r="1"/><circle cx="8" cy="4" r="1"/><circle cx="12" cy="4" r="1"/><circle cx="16" cy="4" r="1"/><circle cx="20" cy="4" r="1"/>
          <circle cx="6" cy="8" r="1"/><circle cx="10" cy="8" r="1"/><circle cx="14" cy="8" r="1"/><circle cx="18" cy="8" r="1"/><circle cx="22" cy="8" r="1"/>
          <circle cx="4" cy="12" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>
          <circle cx="6" cy="16" r="1"/><circle cx="10" cy="16" r="1"/><circle cx="14" cy="16" r="1"/><circle cx="18" cy="16" r="1"/><circle cx="22" cy="16" r="1"/>
          <circle cx="4" cy="20" r="1"/><circle cx="8" cy="20" r="1"/><circle cx="12" cy="20" r="1"/><circle cx="16" cy="20" r="1"/><circle cx="20" cy="20" r="1"/>
        </g>
      </svg>
    `),
  },
  {
    value: "kr",
    label: "한국어",
    flagSrc: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
        <rect width="60" height="40" fill="#fff"/>

        <!-- Taegeuk -->
        <g transform="translate(30 20) rotate(-33.69)">
          <circle r="8" fill="#cd2e3a"/>
          <path d="M0 -8a8 8 0 0 1 0 16a4 4 0 0 1 0 -8a4 4 0 0 0 0 -8" fill="#0047a0"/>
          <path d="M0 8a8 8 0 0 1 0 -16a4 4 0 0 1 0 8a4 4 0 0 0 0 8" fill="#cd2e3a"/>
        </g>

        <!-- Trigrams -->
        <g fill="#111">
          <!-- Geon: three solid bars -->
          <g transform="translate(14.3 9.4) rotate(-33.69)">
            <rect x="-5.2" y="-4.2" width="10.4" height="1.35"/>
            <rect x="-5.2" y="-0.68" width="10.4" height="1.35"/>
            <rect x="-5.2" y="2.85" width="10.4" height="1.35"/>
          </g>

          <!-- Gam: broken, solid, broken -->
          <g transform="translate(45.7 9.4) rotate(33.69)">
            <rect x="-5.2" y="-4.2" width="4.25" height="1.35"/>
            <rect x="0.95" y="-4.2" width="4.25" height="1.35"/>
            <rect x="-5.2" y="-0.68" width="10.4" height="1.35"/>
            <rect x="-5.2" y="2.85" width="4.25" height="1.35"/>
            <rect x="0.95" y="2.85" width="4.25" height="1.35"/>
          </g>

          <!-- Ri: solid, broken, solid -->
          <g transform="translate(14.3 30.6) rotate(33.69)">
            <rect x="-5.2" y="-4.2" width="10.4" height="1.35"/>
            <rect x="-5.2" y="-0.68" width="4.25" height="1.35"/>
            <rect x="0.95" y="-0.68" width="4.25" height="1.35"/>
            <rect x="-5.2" y="2.85" width="10.4" height="1.35"/>
          </g>

          <!-- Gon: three broken bars -->
          <g transform="translate(45.7 30.6) rotate(-33.69)">
            <rect x="-5.2" y="-4.2" width="4.25" height="1.35"/>
            <rect x="0.95" y="-4.2" width="4.25" height="1.35"/>
            <rect x="-5.2" y="-0.68" width="4.25" height="1.35"/>
            <rect x="0.95" y="-0.68" width="4.25" height="1.35"/>
            <rect x="-5.2" y="2.85" width="4.25" height="1.35"/>
            <rect x="0.95" y="2.85" width="4.25" height="1.35"/>
          </g>
        </g>
      </svg>
    `),
  },
  {
    value: "vn",
    label: "Tiếng Việt",
    flagSrc: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
        <rect width="60" height="40" fill="#da251d"/>
        <polygon fill="#ff0" points="30,7 33.5,16.5 43.6,16.5 35.4,22.3 38.7,32 30,26 21.3,32 24.6,22.3 16.4,16.5 26.5,16.5"/>
      </svg>
    `),
  },
];

const normalizeLanguage = (language) => {
  const baseLanguage = String(language || "en").split("-")[0].toLowerCase();

  if (baseLanguage === "ko") return "kr";
  if (baseLanguage === "vi") return "vn";

  return LANGUAGE_OPTIONS.some((option) => option.value === baseLanguage)
    ? baseLanguage
    : "en";
};

const renderRequiredLabel = (label) => (
  <>
    {label} <Box component="span" sx={{ color: "#d32f2f", fontWeight: 600 }}>(*)</Box>
  </>
);

const POCKETBASE_BASE_URL = "http://vjweb.dskorea.com:8090";
const POCKETBASE_COLLECTION = "GA_BUSINESS_TRIP_FILES";
const DOCUMENT_FILE_FIELD = "IMAGE_FILE";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpeg", ".jpg", ".png", ".bmp"];
const FILE_INPUT_ACCEPT = ALLOWED_FILE_EXTENSIONS.join(",");


const safeJsonParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

const getLoggedInUserDisplayName = () => {
  const userData =
    safeJsonParse(sessionStorage.getItem("userData")) ||
    safeJsonParse(localStorage.getItem("userData"));

  const userName =
    userData?.DISPLAY_NAME ||
    userData?.displayName ||
    userData?.EMP_NAME ||
    userData?.empName ||
    userData?.EMP_NAME_ENG ||
    userData?.empNameEng ||
    userData?.NAME ||
    userData?.name ||
    userData?.USER_NAME ||
    userData?.userName ||
    userData?.USERNAME ||
    userData?.username ||
    userData?.EMPID ||
    userData?.EMP_NO ||
    userData?.USER_ID ||
    userData?.USERID ||
    "";

  if (userName) return String(userName).trim();

  const lastLogin = safeJsonParse(localStorage.getItem("lastLogin"));
  return String(lastLogin?.data || "").trim();
};

const normalizeUserImageSrc = (value) => {
  const imageValue = String(value || "").trim();

  if (!imageValue) return "";

  if (/^(https?:|data:image\/|blob:|\/)/i.test(imageValue)) {
    return imageValue;
  }

  if (/^[A-Za-z0-9+/=\r\n]+$/.test(imageValue) && imageValue.length > 80) {
    return `data:image/png;base64,${imageValue.replace(/\s/g, "")}`;
  }

  return imageValue;
};

const getLoggedInUserImageSrc = () => {
  const rawUserImg =
    sessionStorage.getItem("userImg") || localStorage.getItem("userImg") || "";

  const parsedUserImg = safeJsonParse(rawUserImg);
  const userImg =
    parsedUserImg?.url ||
    parsedUserImg?.URL ||
    parsedUserImg?.src ||
    parsedUserImg?.SRC ||
    parsedUserImg?.image ||
    parsedUserImg?.IMAGE ||
    parsedUserImg?.photo ||
    parsedUserImg?.PHOTO ||
    (typeof parsedUserImg === "string" ? parsedUserImg : rawUserImg);

  if (userImg) return normalizeUserImageSrc(userImg);

  const userData =
    safeJsonParse(sessionStorage.getItem("userData")) ||
    safeJsonParse(localStorage.getItem("userData"));

  return normalizeUserImageSrc(
    userData?.PHOTO ||
      userData?.photo ||
      userData?.PHOTO_URL ||
      userData?.photoUrl ||
      userData?.IMAGE_URL ||
      userData?.imageUrl ||
      userData?.AVATAR ||
      userData?.avatar ||
      ""
  );
};

const getLogoutButtonLabel = (selectedLanguage) => {
  const labels = {
    en: "Logout",
    kr: "로그아웃",
    vn: "Đăng xuất",
  };

  return labels[selectedLanguage] || labels.en;
};


const getFileSizeLimitMessage = (selectedLanguage, fileNames) => {
  const messages = {
    en: `Files must not exceed 5 MB. Please select again: ${fileNames}`,
    kr: `파일 크기는 5MB를 초과할 수 없습니다. 다시 선택해 주세요: ${fileNames}`,
    vn: `File không được lớn hơn 5 MB. Vui lòng chọn lại: ${fileNames}`,
  };

  return messages[selectedLanguage] || messages.en;
};

const getInvalidFileTypeMessage = (selectedLanguage, fileNames) => {
  const messages = {
    en: `Only PDF, JPEG, JPG, PNG, and BMP files are allowed. Please select again: ${fileNames}`,
    kr: `PDF, JPEG, JPG, PNG, BMP 형식의 파일만 업로드할 수 있습니다. 다시 선택해 주세요: ${fileNames}`,
    vn: `Chỉ được upload file định dạng PDF, JPEG, JPG, PNG và BMP. Vui lòng chọn lại: ${fileNames}`,
  };

  return messages[selectedLanguage] || messages.en;
};

const getDateValidationMessage = (selectedLanguage, type) => {
  const messages = {
    exitAfterEntry: {
      en: "Exit date and time must be after entry date and time. Please select again.",
      kr: "출국 일시는 입국 일시보다 이후여야 합니다. 다시 선택해 주세요.",
      vn: "Ngày xuất cảnh phải sau ngày nhập cảnh. Vui lòng chọn lại.",
    },
    hotelToAfterFrom: {
      en: "Hotel reservation date to must be after hotel reservation date from. Please select again.",
      kr: "호텔 예약 종료일은 호텔 예약 시작일보다 이후여야 합니다. 다시 선택해 주세요.",
      vn: "Ngày trả phòng khách sạn phải sau ngày đặt phòng. Vui lòng chọn lại.",
    },
  };

  return messages[type]?.[selectedLanguage] || messages[type]?.en || "";
};

const getSaveAlertMessage = (selectedLanguage, type, detail = "") => {
  const messages = {
    factoryRequired: {
      en: "Please select Affiliated Division.",
      kr: "소속 구분을 선택해 주세요.",
      vn: "Vui lòng chọn Đơn trực thuộc.",
    },
    visitorDeptRequired: {
      en: "From Department is required.",
      kr: "소속 부서를 입력해 주세요.",
      vn: "Vui lòng nhập bộ phận.",
    },
    visitorNameEnRequired: {
      en: "English Name is required.",
      kr: "영문 성명을 입력해 주세요.",
      vn: "Vui lòng nhập tên tiếng Anh.",
    },
    visitorNameKrRequired: {
      en: "Korean Name is required.",
      kr: "한글 성명을 입력해 주세요.",
      vn: "Vui lòng nhập tên tiếng Hàn.",
    },
    visitorPositionRequired: {
      en: "Position is required.",
      kr: "직급을 선택해 주세요.",
      vn: "Vui lòng chọn chức vụ.",
    },
    emailRequired: {
      en: "Email is required.",
      kr: "이메일을 입력해 주세요.",
      vn: "Vui lòng nhập email.",
    },
    emailInvalid: {
      en: "Email address is invalid.",
      kr: "이메일 형식이 올바르지 않습니다.",
      vn: "Địa chỉ email không đúng định dạng.",
    },
    purposeRequired: {
      en: "Business Trip Purpose is required.",
      kr: "출장 목적을 입력해 주세요.",
      vn: "Vui lòng nhập mục đích chuyến công tác.",
    },
    relateDeptRequired: {
      en: "Related Department is required.",
      kr: "관련 부서를 입력해 주세요.",
      vn: "Vui lòng nhập bộ phận liên quan.",
    },
    eVisaRequired: {
      en: "Please upload E-Visa / APEC Card before saving.",
      kr: "저장하기 전에 E-Visa / APEC 카드를 업로드해 주세요.",
      vn: "Vui lòng upload E-Visa / APEC Card trước khi lưu.",
    },
    flightTicketRequired: {
      en: "Please upload flight ticket before saving.",
      kr: "저장하기 전에 항공권을 업로드해 주세요.",
      vn: "Vui lòng upload vé máy bay trước khi lưu.",
    },
    entryDateTimeRequired: {
      en: "Entry date and time is required.",
      kr: "입국 일시를 선택해 주세요.",
      vn: "Vui lòng chọn ngày giờ nhập cảnh.",
    },
    exitDateTimeRequired: {
      en: "Exit date and time is required.",
      kr: "출국 일시를 선택해 주세요.",
      vn: "Vui lòng chọn ngày giờ xuất cảnh.",
    },
    saveSuccessEmailSent: {
      en: "Save successful and email sent.",
      kr: "저장되었으며 이메일이 발송되었습니다.",
      vn: "Lưu thành công và đã gửi email.",
    },
    saveSuccessEmailFailed: {
      en: "Save successful but email sending failed. Please check the email server or send the email manually.",
      kr: "저장은 성공했지만 이메일 발송에 실패했습니다. 이메일 서버를 확인하거나 수동으로 발송해 주세요.",
      vn: "Lưu thành công nhưng gửi email thất bại. Vui lòng kiểm tra email server hoặc gửi email thủ công.",
    },
    saveFailed: {
      en: `Save failed${detail ? `: ${detail}` : "."}`,
      kr: `저장에 실패했습니다${detail ? `: ${detail}` : "."}`,
      vn: `Lưu thất bại${detail ? `: ${detail}` : "."}`,
    },
    saveUnexpectedError: {
      en: "An error occurred while saving. Please try again.",
      kr: "저장 중 오류가 발생했습니다. 다시 시도해 주세요.",
      vn: "Đã xảy ra lỗi khi lưu. Vui lòng thử lại.",
    },
  };

  return messages[type]?.[selectedLanguage] || messages[type]?.en || "";
};

const SEND_EMAIL_URL = "http://vjweb.dskorea.com/send-email";
const BUSINESS_TRIP_EMAIL_TO = "THACH.GENERAL@changshininc.com; PHUONG.GENERAL@changshininc.com; LOAN.GENERAL@changshininc.com; NHI.GENERAL@changshininc.com";
const BUSINESS_TRIP_EMAIL_CC = "jinwook.kim@changshininc.com";
const BUSINESS_TRIP_EMAIL_BCC = "LENL.IT@changshininc.com; DO.IT@changshininc.com"; 

/*const BUSINESS_TRIP_EMAIL_TO = "LENL.IT@changshininc.com; DO.IT@changshininc.com";
const BUSINESS_TRIP_EMAIL_CC = "LENL.IT@changshininc.com; DO.IT@changshininc.com";
const BUSINESS_TRIP_EMAIL_BCC = "LENL.IT@changshininc.com; DO.IT@changshininc.com";*/


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

const formatFileSize = (bytes) => {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) return "";
  if (size === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1
  );
  const value = size / 1024 ** unitIndex;
  const decimals = unitIndex === 0 || value >= 100 ? 0 : value >= 10 ? 1 : 2;

  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
};

const getFileExtension = (fileName) => {
  const normalizedFileName = String(fileName || "").trim().toLowerCase();
  const dotIndex = normalizedFileName.lastIndexOf(".");

  return dotIndex >= 0 ? normalizedFileName.slice(dotIndex) : "";
};

const isAllowedFileType = (file) =>
  ALLOWED_FILE_EXTENSIONS.includes(getFileExtension(file?.name));

const getSelectedFilesDisplay = (files, fallbackValue = "") => {
  if (!Array.isArray(files) || files.length === 0) return fallbackValue;

  return files.map((file, index) => {
    const isPdf = getFileExtension(file.name) === ".pdf";
    const FileIcon = isPdf ? PictureAsPdfOutlinedIcon : ImageOutlinedIcon;

    return (
      <Box
        component="span"
        key={`${file.name}-${file.size}-${index}`}
        sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}
      >
        <FileIcon
          sx={{
            fontSize: 18,
            color: isPdf ? "#D32F2F" : "#1976D2",
            flexShrink: 0,
          }}
        />
        <Box component="span">
          {file.name} ({formatFileSize(file.size)})
        </Box>
      </Box>
    );
  });
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
      fontWeight: 400,
      textAlign: "center",
    };
  }

  if (status === "CONFIRMED" || status === "CONFIRM") {
    return {
      bgcolor: "#32CD32",
      color: "#000",
      fontWeight: 400,
      textAlign: "center",
    };
  }

  if (status === "DENIED") {
    return {
      bgcolor: "#F44336",
      color: "#fff",
      fontWeight: 400,
      textAlign: "center",
    };
  }

  return {
    bgcolor: "#fff",
    color: "#000",
    textAlign: "center",
  };
};


const formatStatusDisplay = (statusValue) => {
  const status = String(statusValue || "").trim().toLowerCase();

  if (!status) return "";

  return status.charAt(0).toUpperCase() + status.slice(1);
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

const getFileExtensionFromValue = (value) => {
  const cleanValue = String(value || "")
    .trim()
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();
  const dotIndex = cleanValue.lastIndexOf(".");

  return dotIndex >= 0 ? cleanValue.slice(dotIndex) : "";
};

const isOpenableFileUrl = (value) => /^(https?:\/\/|data:|blob:|\/)/i.test(String(value || "").trim());

const renderHotelFileUpload = (value) => {
  if (!value) return "-";

  const parts = String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) return "-";

  const hotelFiles = parts
    .map((item, index) => {
      const extension = getFileExtensionFromValue(item);
      const isPdf = extension === ".pdf";
      const isImage = [".jpg", ".jpeg", ".png", ".bmp"].includes(extension);

      return {
        item,
        originalIndex: index,
        extension,
        isPdf,
        isImage,
        canOpen: isOpenableFileUrl(item),
      };
    })
    .sort((a, b) => {
      const getRank = (file) => {
        if (file.isPdf) return 0;
        if (file.isImage) return 1;
        return 2;
      };

      const rankDiff = getRank(a) - getRank(b);
      return rankDiff !== 0 ? rankDiff : a.originalIndex - b.originalIndex;
    });

  return (
    <Stack
      direction="column"
      spacing={0.45}
      alignItems="center"
      justifyContent="center"
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "visible",
        whiteSpace: "nowrap",
      }}
    >
      {hotelFiles.map((file, index) => {
        const { item, isPdf, isImage, canOpen } = file;
        const fileLabel = hotelFiles.length > 1 ? `File ${index + 1}` : "File";

        if (isPdf && canOpen) {
          return (
            <Box
              component="a"
              key={`${item}-${file.originalIndex}`}
              href={item}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${fileLabel}`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                gap: 0.2,
                color: "#D32F2F",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              <PictureAsPdfOutlinedIcon sx={{ fontSize: 24 }} />
              PDF{hotelFiles.length > 1 ? ` ${index + 1}` : ""}
            </Box>
          );
        }

        if (isImage && canOpen) {
          return (
            <Box
              component="a"
              key={`${item}-${file.originalIndex}`}
              href={item}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${fileLabel}`}
              sx={{
                display: "inline-flex",
                justifyContent: "center",
                flexShrink: 0,
                textDecoration: "none",
              }}
            >
              <Box
                component="img"
                src={item}
                alt={`Hotel upload ${index + 1}`}
                sx={{
                  width: 64,
                  height: 46,
                  objectFit: "cover",
                  borderRadius: 1,
                  border: "1px solid #C8D1DA",
                  bgcolor: "#fff",
                }}
              />
            </Box>
          );
        }

        if (canOpen) {
          return (
            <Box
              component="a"
              key={`${item}-${file.originalIndex}`}
              href={item}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${fileLabel}`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
                gap: 0.5,
                color: "primary.main",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <ImageOutlinedIcon sx={{ fontSize: 20 }} />
              {fileLabel}
            </Box>
          );
        }

        return (
          <Box
            component="span"
            key={`${item}-${file.originalIndex}`}
            sx={{ display: "inline-block", flexShrink: 0 }}
          >
            {item}
          </Box>
        );
      })}
    </Stack>
  );
};

export default function BusinessTripFormNewLayout() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(() => normalizeLanguage(i18n.language));
  const [loggedInUserName, setLoggedInUserName] = useState(() =>
    getLoggedInUserDisplayName()
  );
  const [loggedInUserImageSrc, setLoggedInUserImageSrc] = useState(() =>
    getLoggedInUserImageSrc()
  );
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [fileData, setFileData] = useState({ ...EMPTY_FILE_DATA });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [trackingFilters, setTrackingFilters] = useState(() => getDefaultTrackingFilters());
  const [trackingRows, setTrackingRows] = useState([]);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [hasLoadedTracking, setHasLoadedTracking] = useState(false);
  const [trackingPage, setTrackingPage] = useState(1);
  const trackingTableRef = React.useRef(null);
  const [trackingScrollState, setTrackingScrollState] = useState({
    left: 0,
    top: 0,
    maxLeft: 0,
    maxTop: 0,
  });

  useEffect(() => {
    setLanguage(normalizeLanguage(i18n.language));
  }, [i18n.language]);

  useEffect(() => {
    const refreshLoggedInUserName = () => {
      setLoggedInUserName(getLoggedInUserDisplayName());
      setLoggedInUserImageSrc(getLoggedInUserImageSrc());
    };

    refreshLoggedInUserName();
    window.addEventListener("storage", refreshLoggedInUserName);
    window.addEventListener("focus", refreshLoggedInUserName);

    return () => {
      window.removeEventListener("storage", refreshLoggedInUserName);
      window.removeEventListener("focus", refreshLoggedInUserName);
    };
  }, []);

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;

    setLanguage(nextLanguage);
    i18n.changeLanguage(nextLanguage);
    localStorage.setItem("i18nextLng", nextLanguage);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("userImg");
    sessionStorage.removeItem("lastLogin");

    localStorage.removeItem("userData");
    localStorage.removeItem("userImg");
    localStorage.removeItem("lastLogin");

    setLoggedInUserName("");
    setLoggedInUserImageSrc("");
    setUserMenuAnchorEl(null);
    navigate("/signin");
  };

  const handleUserAvatarClick = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const renderSelectedLanguage = (selectedLanguage) => {
    const option = LANGUAGE_OPTIONS.find((item) => item.value === selectedLanguage) || LANGUAGE_OPTIONS[0];

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "#fff",
          lineHeight: 1,
        }}
      >
        <Box
          component="img"
          src={option.flagSrc}
          alt={option.label}
          sx={{
            width: 50,
            height: 32,
            objectFit: "cover",
            borderRadius: "2px",
            display: "inline-flex",
            flexShrink: 0,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
          }}
        />
        <Typography
          component="span"
          sx={{
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1,
          }}
        >
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
    setTrackingPage(1);
  };

  const getDateFromDateTime = (dateTimeValue) => {
    if (!dateTimeValue) return "";

    const dateValue = dateTimeValue.split("T")[0];
    return dateValue || "";
  };

  const handleEntryDateTimeChange = (event) => {
    const entryDateTime = event.target.value;
    const hotelReserveDate = getDateFromDateTime(entryDateTime);

    setFormData((prev) => {
      const shouldClearExitDateTime =
        prev.exitDateTime &&
        !isExitDateTimeAfterEntryDateTime(entryDateTime, prev.exitDateTime);

      const shouldClearHotelReserveDateTo =
        prev.hotelReserveDateTo &&
        !isDateAfter(hotelReserveDate, prev.hotelReserveDateTo);

      if (shouldClearExitDateTime) {
        alert(getDateValidationMessage(language, "exitAfterEntry"));
      } else if (shouldClearHotelReserveDateTo) {
        alert(getDateValidationMessage(language, "hotelToAfterFrom"));
      }

      return {
        ...prev,
        entryDateTime,
        hotelReserveDate,
        ...(shouldClearExitDateTime
          ? {
              exitDateTime: "",
              hotelReserveDateTo: "",
              airportDropoffTime: "",
            }
          : {}),
        ...(shouldClearHotelReserveDateTo && !shouldClearExitDateTime
          ? {
              hotelReserveDateTo: "",
            }
          : {}),
      };
    });
  };

  const getDefaultAirportDropoffTime = (exitDateTime) => {
    if (!exitDateTime) return "";

    const exitDate = exitDateTime.split("T")[0];
    if (!exitDate) return "";

    return `${exitDate}T08:30`;
  };

  const handleExitDateTimeChange = (event) => {
    const exitDateTime = event.target.value;

    setFormData((prev) => {
      if (
        prev.entryDateTime &&
        !isExitDateTimeAfterEntryDateTime(prev.entryDateTime, exitDateTime)
      ) {
        alert(getDateValidationMessage(language, "exitAfterEntry"));

        return {
          ...prev,
          exitDateTime: "",
          hotelReserveDateTo: "",
          airportDropoffTime: "",
        };
      }

      const hotelReserveDateTo = getDateFromDateTime(exitDateTime);

      if (
        prev.hotelReserveDate &&
        hotelReserveDateTo &&
        !isDateAfter(prev.hotelReserveDate, hotelReserveDateTo)
      ) {
        alert(getDateValidationMessage(language, "hotelToAfterFrom"));

        return {
          ...prev,
          exitDateTime,
          hotelReserveDateTo: "",
          airportDropoffTime: getDefaultAirportDropoffTime(exitDateTime),
        };
      }

      return {
        ...prev,
        exitDateTime,
        hotelReserveDateTo,
        airportDropoffTime: getDefaultAirportDropoffTime(exitDateTime),
      };
    });
  };

  const handleHotelReserveDateFromChange = (event) => {
    const hotelReserveDate = event.target.value;

    setFormData((prev) => {
      if (
        hotelReserveDate &&
        prev.hotelReserveDateTo &&
        !isDateAfter(hotelReserveDate, prev.hotelReserveDateTo)
      ) {
        alert(getDateValidationMessage(language, "hotelToAfterFrom"));

        return {
          ...prev,
          hotelReserveDate,
          hotelReserveDateTo: "",
        };
      }

      return {
        ...prev,
        hotelReserveDate,
      };
    });
  };

  const handleHotelReserveDateToChange = (event) => {
    const hotelReserveDateTo = event.target.value;

    setFormData((prev) => {
      if (
        prev.hotelReserveDate &&
        hotelReserveDateTo &&
        !isDateAfter(prev.hotelReserveDate, hotelReserveDateTo)
      ) {
        alert(getDateValidationMessage(language, "hotelToAfterFrom"));

        return {
          ...prev,
          hotelReserveDateTo: "",
        };
      }

      return {
        ...prev,
        hotelReserveDateTo,
      };
    });
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

  const isExitDateTimeAfterEntryDateTime = (entryDateTime, exitDateTime) => {
    if (!entryDateTime || !exitDateTime) return true;

    const entryTime = new Date(entryDateTime).getTime();
    const exitTime = new Date(exitDateTime).getTime();

    if (Number.isNaN(entryTime) || Number.isNaN(exitTime)) return true;

    return exitTime > entryTime;
  };

  const isDateAfter = (fromDate, toDate) => {
    if (!fromDate || !toDate) return true;

    return String(toDate) > String(fromDate);
  };

  const isValidEmail = (email) => {
    const emailValue = String(email || "").trim();

    if (!emailValue) return false;

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue);
  };

  const handleFileChange = (field, fileField) => (event) => {
    const files = Array.from(event.target.files || []);
    const invalidFiles = files.filter((file) => !isAllowedFileType(file));

    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((file) => file.name).join(", ");

      alert(getInvalidFileTypeMessage(language, invalidFileNames));

      event.target.value = "";
      return;
    }

    const oversizedFiles = files.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES
    );

    if (oversizedFiles.length > 0) {
      const oversizedFileNames = oversizedFiles
        .map((file) => `${file.name} (${formatFileSize(file.size)})`)
        .join(", ");

      alert(getFileSizeLimitMessage(language, oversizedFileNames));

      event.target.value = "";
      return;
    }

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

    const invalidFile = files.find((file) => !isAllowedFileType(file));

    if (invalidFile) {
      throw new Error(getInvalidFileTypeMessage(language, invalidFile.name));
    }

    const oversizedFile = files.find(
      (file) => file.size > MAX_FILE_SIZE_BYTES
    );

    if (oversizedFile) {
      throw new Error(
        getFileSizeLimitMessage(
          language,
          `${oversizedFile.name} (${formatFileSize(oversizedFile.size)})`
        )
      );
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
    if (!formData.affiliDiv) return getSaveAlertMessage(language, "factoryRequired");
    if (!formData.visitorDept?.trim()) return getSaveAlertMessage(language, "visitorDeptRequired");
    if (!formData.visitorNameEn?.trim()) return getSaveAlertMessage(language, "visitorNameEnRequired");
    if (!formData.visitorNameKr?.trim()) return getSaveAlertMessage(language, "visitorNameKrRequired");
    if (!formData.email?.trim()) return getSaveAlertMessage(language, "emailRequired");
    if (!isValidEmail(formData.email)) return getSaveAlertMessage(language, "emailInvalid");
    if (!formData.visitorPosition?.trim()) return getSaveAlertMessage(language, "visitorPositionRequired");
    if (!formData.purpose?.trim()) return getSaveAlertMessage(language, "purposeRequired");
    if (!formData.relateDept?.trim()) return getSaveAlertMessage(language, "relateDeptRequired");
    if (!fileData.eVisaFiles || fileData.eVisaFiles.length === 0) {
      return getSaveAlertMessage(language, "eVisaRequired");
    }
    if (!fileData.flightTicketFiles || fileData.flightTicketFiles.length === 0) {
      return getSaveAlertMessage(language, "flightTicketRequired");
    }
    if (!formData.entryDateTime) return getSaveAlertMessage(language, "entryDateTimeRequired");
    if (!formData.exitDateTime) return getSaveAlertMessage(language, "exitDateTimeRequired");
    if (!isExitDateTimeAfterEntryDateTime(formData.entryDateTime, formData.exitDateTime)) {
      return getDateValidationMessage(language, "exitAfterEntry");
    }
    if (!isDateAfter(formData.hotelReserveDate, formData.hotelReserveDateTo)) {
      return getDateValidationMessage(language, "hotelToAfterFrom");
    }
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
        setTrackingPage(1);
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
    setTrackingPage(1);
    fetchTrackingData();
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

  const totalTrackingPages = Math.max(
    1,
    Math.ceil(filteredTrackingRows.length / TRACKING_PAGE_SIZE)
  );
  const currentTrackingPage = Math.min(trackingPage, totalTrackingPages);
  const paginatedTrackingRows = filteredTrackingRows.slice(
    (currentTrackingPage - 1) * TRACKING_PAGE_SIZE,
    currentTrackingPage * TRACKING_PAGE_SIZE
  );

  useEffect(() => {
    if (trackingPage > totalTrackingPages) {
      setTrackingPage(totalTrackingPages);
    }
  }, [trackingPage, totalTrackingPages]);

  const handleTrackingPreviousPage = () => {
    setTrackingPage((prev) => Math.max(1, prev - 1));
  };

  const handleTrackingNextPage = () => {
    setTrackingPage((prev) => Math.min(totalTrackingPages, prev + 1));
  };

  const updateTrackingScrollState = useCallback(() => {
    const scrollElement = trackingTableRef.current;

    if (!scrollElement) return;

    const nextState = {
      left: Math.round(scrollElement.scrollLeft || 0),
      top: Math.round(scrollElement.scrollTop || 0),
      maxLeft: Math.max(
        0,
        Math.round(scrollElement.scrollWidth - scrollElement.clientWidth)
      ),
      maxTop: Math.max(
        0,
        Math.round(scrollElement.scrollHeight - scrollElement.clientHeight)
      ),
    };

    setTrackingScrollState((prev) =>
      prev.left === nextState.left &&
      prev.top === nextState.top &&
      prev.maxLeft === nextState.maxLeft &&
      prev.maxTop === nextState.maxTop
        ? prev
        : nextState
    );
  }, []);

  useEffect(() => {
    if (tab !== 1) return undefined;

    updateTrackingScrollState();

    const resizeHandler = () => updateTrackingScrollState();
    const timeoutId = window.setTimeout(updateTrackingScrollState, 120);

    window.addEventListener("resize", resizeHandler);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", resizeHandler);
    };
  }, [
    tab,
    isLoadingTracking,
    filteredTrackingRows.length,
    paginatedTrackingRows.length,
    updateTrackingScrollState,
  ]);

  const handleTrackingTableScroll = () => {
    updateTrackingScrollState();
  };

  const handleTrackingHorizontalScrollChange = (event) => {
    const scrollElement = trackingTableRef.current;
    if (!scrollElement) return;

    scrollElement.scrollLeft = Number(event.target.value || 0);
    updateTrackingScrollState();
  };

  const handleTrackingVerticalScrollChange = (event) => {
    const scrollElement = trackingTableRef.current;
    if (!scrollElement) return;

    // input[type=range] in vertical mode puts min value at the bottom.
    // Invert the value so the thumb is at the top when the table is scrolled to top,
    // just like the native Chrome/Windows scrollbar.
    const sliderValue = Number(event.target.value || 0);
    scrollElement.scrollTop = Math.max(
      0,
      trackingScrollState.maxTop - sliderValue
    );
    updateTrackingScrollState();
  };

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
      buildEmailTableRow(
        "Description",
        formData.description
          ? `<div style="white-space:pre-wrap;">${escapeHtml(formData.description)}</div>`
          : "-"
      ),
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
        `<p style="margin:0 0 12px 0;font-weight:400;">Dear GA Team,<br>Please check the business trip information below:</p>` +
        `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:620px;max-width:100%;border:1px solid #d9d9d9;">` +
          `<tbody>${rows}</tbody>` +
        `</table> <br>` +
        `<p style="margin:0 0 12px 0;font-weight:400;">Best regards,</p>` +
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
      blind_carbon_copy: BUSINESS_TRIP_EMAIL_BCC,
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
        alert(getSaveAlertMessage(language, "factoryRequired"));
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
            ? getSaveAlertMessage(language, "saveSuccessEmailSent")
            : getSaveAlertMessage(language, "saveSuccessEmailFailed")
        );

        setFormData({ ...EMPTY_FORM });
        setFileData({ ...EMPTY_FILE_DATA });
        setHasLoadedTracking(false);
      } else {
        alert(getSaveAlertMessage(language, "saveFailed", result.error?.message || result.data?.message || ""));
      }
    } catch (error) {
      console.error("Error saving business trip registration:", error);
      alert(getSaveAlertMessage(language, "saveUnexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      className="business-trip-form"
      sx={{
        bgcolor: "#fff",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        "& .business-trip-card": {
          p: "14px !important",
        },
        "& .business-trip-card .MuiTextField-root": {
          margin: 0,
        },
        "& .business-trip-card .MuiInputBase-root": {
          minHeight: 38,
          fontSize: "0.84rem",
          display: "flex",
          alignItems: "center",
        },
        "& .business-trip-card .MuiInputBase-input": {
          py: "7px",
          fontSize: "0.84rem",
          lineHeight: "22px",
        },
        "& .business-trip-card .MuiInputLabel-root": {
          fontSize: "0.84rem",
          lineHeight: "18px",
        },
        "& .business-trip-card .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
          transform: "translate(14px, 10px) scale(1)",
        },
        "& .business-trip-card .MuiInputLabel-root.MuiInputLabel-shrink": {
          transform: "translate(14px, -7px) scale(0.75)",
        },
        "& .business-trip-card .MuiFormLabel-asterisk": {
          color: "#d32f2f",
          fontWeight: 700,
        },
        "& .business-trip-card .required-upload-asterisk": {
          color: "#d32f2f",
          fontWeight: 700,
          marginLeft: "4px",
        },
        "& .business-trip-card .MuiSelect-select": {
          display: "flex",
          alignItems: "center",
          minHeight: "22px !important",
        },
        "& .business-trip-card .MuiFormControlLabel-root": {
          mr: 1,
          my: 0,
        },
        "& .business-trip-card .MuiFormControlLabel-label": {
          fontSize: "0.84rem",
        },
        "& .business-trip-card .MuiRadio-root": {
          p: "4px",
        },
        "& .business-trip-card .MuiButton-root": {
          minHeight: 32,
          py: 0.45,
          px: 1.25,
          fontSize: "0.82rem",
          textTransform: "none",
        },
        "& .business-trip-card .MuiTypography-h6": {
          fontSize: "1rem",
        },
        "& .business-trip-card .MuiTypography-subtitle1": {
          fontSize: "0.9rem",
          mt: -0.25,
          mb: -0.25,
        },
      }}
    >
      <style>
        {`
          .business-trip-form .business-trip-tracking-table {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }

          .business-trip-form .business-trip-tracking-table::-webkit-scrollbar {
            width: 0 !important;
            height: 0 !important;
            display: none !important;
          }

          .business-trip-form .business-trip-tracking-table::-webkit-scrollbar-track {
            display: none !important;
            background: transparent !important;
          }

          .business-trip-form .business-trip-tracking-table::-webkit-scrollbar-thumb {
            display: none !important;
            background: transparent !important;
          }

          .business-trip-form .business-trip-tracking-table::-webkit-scrollbar-corner {
            display: none !important;
            background: transparent !important;
          }

          .business-trip-form .tracking-scroll-panel {
            background: #EFEFEF;
            border: 1px solid #C8C8C8;
            border-radius: 10px;
            padding: 3px;
            box-sizing: border-box;
          }

          .business-trip-form .tracking-big-scroll-range {
            width: 100%;
            height: 26px;
            cursor: pointer;
            accent-color: #555;
            appearance: none;
            -webkit-appearance: none;
            background: transparent;
          }

          .business-trip-form .tracking-big-scroll-range::-webkit-slider-runnable-track {
            height: 10px;
            background: #D0D0D0;
            border-radius: 999px;
          }

          .business-trip-form .tracking-big-scroll-range::-webkit-slider-thumb {
            appearance: none;
            -webkit-appearance: none;
            width: 58px;
            height: 18px;
            margin-top: -4px;
            background: #555;
            border: 2px solid #F5F5F5;
            border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.28);
          }

          .business-trip-form .tracking-big-scroll-range::-moz-range-track {
            height: 10px;
            background: #D0D0D0;
            border-radius: 999px;
          }

          .business-trip-form .tracking-big-scroll-range::-moz-range-thumb {
            width: 58px;
            height: 18px;
            background: #555;
            border: 2px solid #F5F5F5;
            border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.28);
          }

          .business-trip-form .tracking-big-scroll-range-vertical {
            width: 28px;
            height: 100%;
            margin: 0 auto;
            display: block;
            min-height: 360px;
            writing-mode: vertical-rl;
            direction: rtl;
            align-self: center;
          }

          .business-trip-form .tracking-big-scroll-range-vertical::-webkit-slider-runnable-track {
            width: 10px;
            height: 100%;
          }

          .business-trip-form .tracking-big-scroll-range-vertical::-webkit-slider-thumb {
            appearance: none;
            -webkit-appearance: none;
            width: 18px;
            height: 58px;
            margin-left: -4px;
            margin-top: 0;
            background: #555;
            border: 2px solid #F5F5F5;
            border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.28);
          }

          .business-trip-form .tracking-big-scroll-range-vertical::-moz-range-thumb {
            width: 18px;
            height: 58px;
            background: #555;
            border: 2px solid #F5F5F5;
            border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.28);
          }
        `}
      </style>
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
          flexShrink: 0,
        }}
      >
        <Box
          component="button"
          type="button"
          className="business-trip-header-title"
          onClick={() => navigate("/signin")}
          title="Back to Sign In"
          sx={{
            color: "#fff",
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: 0.2,
            cursor: "pointer",
            border: 0,
            background: "transparent",
            p: 0,
            m: 0,
            textAlign: "left",
            "&:hover": {
              opacity: 0.85,
            },
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
            gap: 1.5,
          }}
        >
          <FormControl
            variant="standard"
            sx={{
              minWidth: 152,
              bgcolor: "transparent",
            }}
          >
            <Select
              disableUnderline
              value={language}
              onChange={handleLanguageChange}
              renderValue={renderSelectedLanguage}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 1,
                    borderRadius: 1.5,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
                    "& .MuiMenuItem-root": {
                      minHeight: 42,
                      gap: 1,
                    },
                  },
                },
              }}
              sx={{
                height: 44,
                minWidth: 152,
                color: "#fff",
                bgcolor: "transparent",
                border: "0 !important",
                boxShadow: "none !important",
                "&:before": {
                  borderBottom: "0 !important",
                },
                "&:after": {
                  borderBottom: "0 !important",
                },
                "&:hover:not(.Mui-disabled):before": {
                  borderBottom: "0 !important",
                },
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  py: "0 !important",
                  pl: "0 !important",
                  pr: "26px !important",
                  color: "#fff !important",
                  bgcolor: "transparent !important",
                },
                "& .MuiSelect-icon": {
                  color: "#fff !important",
                  right: 0,
                  fontSize: 22,
                },
                "& .MuiTypography-root": {
                  color: "#fff !important",
                },
              }}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      component="img"
                      src={option.flagSrc}
                      alt={option.label}
                      sx={{
                        width: 32,
                        height: 21,
                        objectFit: "cover",
                        borderRadius: "2px",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ fontWeight: 700 }}>{option.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loggedInUserName ? (
            <>
              <IconButton
                size="small"
                onClick={handleUserAvatarClick}
                title={loggedInUserName}
                sx={{
                  p: 0,
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.12)",
                  },
                }}
              >
                <Avatar
                  src={loggedInUserImageSrc || undefined}
                  alt={loggedInUserName}
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: "#1976d2",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    border: "2px solid #fff",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
                  }}
                >
                  {loggedInUserName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={userMenuAnchorEl}
                open={Boolean(userMenuAnchorEl)}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: 1.5,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
                  },
                }}
              >
                <MenuItem disabled sx={{ opacity: "1 !important" }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      maxWidth: 220,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loggedInUserName}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ fontWeight: 700 }}>
                  {getLogoutButtonLabel(language)}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/signin")}
              sx={{
                minWidth: 78,
                height: 34,
                color: "#fff",
                borderColor: "rgba(255,255,255,0.75)",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 1,
                px: 2,
                "&:hover": {
                  borderColor: "#fff",
                  bgcolor: "rgba(255,255,255,0.12)",
                },
              }}
            >
              {t("login") || "Login"}
            </Button>
          )}
        </Box>
      </Box>

      <Tabs
        className="business-trip-tabs"
        value={tab}
        onChange={(e, value) => setTab(value)}
        sx={{
          mt: "4px !important",
          mb: "6px !important",
          flexShrink: 0,
          minHeight: "36px",
          borderBottom: "1px solid #ddd",
          px: 1.5,
          "& .MuiTab-root": {
            minHeight: "36px",
            py: 0.5,
            textTransform: "none",
            fontWeight: 700,
          },
        }}
      >
        <Tab label={t("business_trip_register")} />
        <Tab label={t("business_trip_tracking")} />
      </Tabs>

      {tab === 0 && (
        <Box
          className="business-trip-card business-trip-register-card"
          sx={{
            border: "1px solid #ccc",
            p: 1.5,
            flex: "1 1 auto",
            minHeight: 0,
            overflow: "auto",
          }}
        >
          <Box
            sx={{
              mb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("business_trip_title")}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#d32f2f",
                  fontWeight: 600,
                  fontStyle: "italic",
                }}
              >
                {t("required_note")}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSubmitting}
              sx={{ minWidth: 90 }}
            >
              {isSubmitting ? t("saving") || "Saving..." : t("save")}
            </Button>
          </Box>

          <Grid container spacing={1.1} className="business-trip-grid">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={renderRequiredLabel(t("business_trip_name_en"))}
                value={formData.visitorNameEn}
                onChange={handleInputChange("visitorNameEn")}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={renderRequiredLabel(t("business_trip_name_kr"))}
                value={formData.visitorNameKr}
                onChange={handleInputChange("visitorNameKr")}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="email"
                label={renderRequiredLabel("Email")}
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
                sx={{ minHeight: 38, alignItems: "center" }}
              >
                <FormControlLabel value="CDC" control={<Radio />} label="CDC" />
                <FormControlLabel value="JJ" control={<Radio />} label="JJ" />
                <FormControlLabel value="QD" control={<Radio />} label="QD" />
              </RadioGroup>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={renderRequiredLabel(t("business_trip_dept_from"))}
                value={formData.visitorDept}
                onChange={handleInputChange("visitorDept")}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label={renderRequiredLabel(t("business_trip_position"))}
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
                label={renderRequiredLabel(t("business_trip_purpose"))}
                value={formData.purpose}
                onChange={handleInputChange("purpose")}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={renderRequiredLabel(t("business_trip_dept_related"))}
                value={formData.relateDept}
                onChange={handleInputChange("relateDept")}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t("business_trip_note")}
                value={formData.description}
                onChange={handleInputChange("description")}
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    width: 220,
                    minWidth: 220,
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("business_trip_upload_e_visa")}
                  <Box component="span" className="required-upload-asterisk" sx={{ color: "#d32f2f", fontWeight: 600 }}>&nbsp;(*)</Box>
                  <input
                    hidden
                    multiple
                    type="file"
                    accept={FILE_INPUT_ACCEPT}
                    onChange={handleFileChange("eVisa", "eVisaFiles")}
                  />
                </Button>
                {formData.eVisa && (
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {getSelectedFilesDisplay(fileData.eVisaFiles, formData.eVisa)}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    width: 220,
                    minWidth: 220,
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("business_trip_upload_flight_ticket")}
                  <Box component="span" className="required-upload-asterisk" sx={{ color: "#d32f2f", fontWeight: 600 }}>&nbsp;(*)</Box>
                  <input
                    hidden
                    multiple
                    type="file"
                    accept={FILE_INPUT_ACCEPT}
                    onChange={handleFileChange("businessTripFlightTicket", "flightTicketFiles")}
                  />
                </Button>
                {formData.businessTripFlightTicket && (
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {getSelectedFilesDisplay(
                      fileData.flightTicketFiles,
                      formData.businessTripFlightTicket
                    )}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="datetime-local"
                label={renderRequiredLabel(t("business_trip_entry_time"))}
                value={formData.entryDateTime}
                onChange={handleEntryDateTimeChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: 60,
                  lang: "en-GB",
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="datetime-local"
                label={renderRequiredLabel(t("business_trip_exit_time"))}
                value={formData.exitDateTime}
                onChange={handleExitDateTimeChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: 60,
                  lang: "en-GB",
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label={t("business_trip_hotel_reservation_date_from", "Hotel Reservation Date From")}
                value={formData.hotelReserveDate}
                onChange={handleHotelReserveDateFromChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label={t("business_trip_hotel_reservation_date_to", "Hotel Reservation Date To")}
                value={formData.hotelReserveDateTo}
                onChange={handleHotelReserveDateToChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={12}>
              <RadioGroup
                row
                value={formData.airportPickupYn}
                onChange={handleInputChange("airportPickupYn")}
                sx={{ minHeight: 38, alignItems: "center" }}
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

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="datetime-local"
                label={t("business_trip_airport_dropoff_required")}
                value={formData.airportDropoffTime}
                onChange={handleInputChange("airportDropoffTime")}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: 60,
                  lang: "en-GB",
                }}
              />
            </Grid>

          </Grid>
        </Box>
      )}

      {tab === 1 && (
        <Box
          className="business-trip-card business-trip-tracking-card"
          sx={{
            border: "1px solid #ccc",
            height: "calc(100vh - 132px)",
            minHeight: 0,
            p: 1.5,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              mb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexShrink: 0,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("business_trip_tracking") || "Business Trip Tracking"}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleSearchTracking}
                disabled={isLoadingTracking}
              >
                {isLoadingTracking ? "Loading..." : t("search") || "Search"}
              </Button>
            </Stack>
          </Box>

          <Grid
            container
            spacing={1.1}
            className="business-trip-filter-grid"
            sx={{ mb: 1, flexShrink: 0 }}
          >
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
            <Box
              sx={{
                gridColumn: "1 / 2",
                gridRow: "1 / 2",
                flex: "1 1 auto",
                minHeight: 0,
                display: "grid",
                gridTemplateColumns:
                  trackingScrollState.maxTop > 0 ? "minmax(0, 1fr) 38px" : "minmax(0, 1fr)",
                gridTemplateRows:
                  trackingScrollState.maxLeft > 0 ? "minmax(0, 1fr) 38px" : "minmax(0, 1fr)",
                gap: 0.25,
              }}
            >
              <TableContainer
                ref={trackingTableRef}
                onScroll={handleTrackingTableScroll}
                className="business-trip-tracking-table"
                component={Paper}
                sx={{
                flex: "1 1 auto",
                minHeight: 0,
                maxHeight: "none",
                overflow: "auto",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  width: 0,
                  height: 0,
                  display: "none",
                },
                "&::-webkit-scrollbar-track": {
                  display: "none",
                  bgcolor: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  display: "none",
                  bgcolor: "transparent",
                },
                "&::-webkit-scrollbar-corner": {
                  display: "none",
                  bgcolor: "transparent",
                },
                "& .MuiTableRow-root": {
                  height: 34,
                },
                "& .MuiTableCell-root": {
                  verticalAlign: "middle",
                  px: 0.55,
                  py: 0.45,
                  fontSize: "0.75rem",
                  borderRight: "1px solid #D0D7DE",
                  borderBottom: "1px solid #E0E0E0",
                },
                "& .MuiTableCell-head": {
                  bgcolor: "#E3F2FD",
                  color: "#000",
                  fontWeight: "400 !important",
                  textAlign: "center",
                  textTransform: "capitalize",
                  whiteSpace: "normal",
                  lineHeight: 1.15,
                  minWidth: 110,
                  wordBreak: "normal",
                  overflowWrap: "break-word",
                  borderRight: "1px solid #B8C7D3",
                  borderBottom: "2px solid #90CAF9",
                  verticalAlign: "middle",
                  zIndex: 3,
                },
                "& .MuiTableCell-body": {
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                  minWidth: 110,
                  wordBreak: "normal",
                  overflowWrap: "normal",
                  fontWeight: "400 !important",
                },
                "& .tracking-sticky": {
                  position: "sticky",
                  left: "var(--tracking-sticky-left)",
                  zIndex: 2,
                  boxShadow: "2px 0 0 #B8C7D3",
                },
                "& .tracking-sticky:not(.tracking-sticky-status)": {
                  bgcolor: "#fff",
                },
                "& .MuiTableCell-head.tracking-sticky": {
                  zIndex: 5,
                  bgcolor: "#E3F2FD",
                },
                "& .MuiTableRow-hover:hover .tracking-sticky:not(.tracking-sticky-status)": {
                  bgcolor: "#F5F9FF",
                },
                "& .tracking-sticky-1": { "--tracking-sticky-left": "0px" },
                "& .tracking-sticky-2": { "--tracking-sticky-left": "120px" },
                "& .tracking-sticky-3": { "--tracking-sticky-left": "240px" },
                "& .tracking-sticky-4": { "--tracking-sticky-left": "312px" },
                "& .tracking-sticky-5": { "--tracking-sticky-left": "467px" },
                "& .tracking-sticky-6": { "--tracking-sticky-left": "622px" },
                "& .tracking-col-xs": {
                  width: 72,
                  minWidth: 72,
                },
                "& .tracking-col-sm": {
                  width: 120,
                  minWidth: 120,
                },
                "& .tracking-col-file": {
                  width: 210,
                  minWidth: 210,
                },
                "& .tracking-col-md": {
                  width: 155,
                  minWidth: 155,
                },
                "& .tracking-col-lg": {
                  width: 210,
                  minWidth: 210,
                },
                "& .tracking-col-xl": {
                  width: 260,
                  minWidth: 260,
                },
                "& .tracking-col-email": {
                  width: 290,
                  minWidth: 290,
                },
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  width: "max-content",
                  minWidth: 2810,
                  tableLayout: "auto",
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell className="tracking-col-sm tracking-sticky tracking-sticky-1">{t("status") || "Status"}</TableCell>
                    <TableCell className="tracking-col-sm tracking-sticky tracking-sticky-2">{t("requestDate") || "Request Date"}</TableCell>
                    <TableCell className="tracking-col-xs tracking-sticky tracking-sticky-3">{t("from") || "From"}</TableCell>
                    <TableCell className="tracking-col-md tracking-sticky tracking-sticky-4">{t("business_trip_name_en") || "English Name"}</TableCell>
                    <TableCell className="tracking-col-md tracking-sticky tracking-sticky-5">{t("business_trip_name_kr") || "Korean Name"}</TableCell>
                    <TableCell className="tracking-col-md tracking-sticky tracking-sticky-6">{t("business_trip_dept_from") || "From Department"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_position") || "Position"}</TableCell>
                    <TableCell className="tracking-col-email">{t("email") || "Email"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_dept_related") || "Related Dept"}</TableCell>
                    <TableCell className="tracking-col-lg">{t("business_trip_purpose") || "Purpose"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_entry_time") || "Entry"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_exit_time") || "Exit"}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_hotel_reservation_date_from", "Hotel Date From")}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_hotel_reservation_date_to", "Hotel Date To")}</TableCell>
                    <TableCell className="tracking-col-md">{t("business_trip_airport_pickup_required") || "Airport"}</TableCell>
                    <TableCell className="tracking-col-sm">{t("e_visa_apec_card") || "E-Visa / APEC"}</TableCell>
                    <TableCell className="tracking-col-sm">{t("flight_ticket") || "Flight Ticket"}</TableCell>                    
                    <TableCell className="tracking-col-sm">{t("hotel") || "Hotel"}</TableCell>
                    <TableCell className="tracking-col-sm">{t("google_maps") || "Google Maps"}</TableCell>
                    <TableCell className="tracking-col-file">{t("hotel_file_upload", "Hotel Information")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrackingRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={20} align="center">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTrackingRows.map((row, index) => (
                      <TableRow key={getRowValue(row, ["REG_ID", "regId"], index)} hover>     
                      {(() => {
                          const statusValue = getRowValue(row, ["STATUS", "status"]);

                          return (
                            <TableCell className="tracking-col-sm tracking-sticky tracking-sticky-1 tracking-sticky-status" sx={getStatusCellSx(statusValue)}>
                              {formatStatusDisplay(statusValue)}
                            </TableCell>
                          );
                        })()
                        }                   
                        <TableCell className="tracking-col-sm tracking-sticky tracking-sticky-2">{getRowValue(row, ["REQ_DATE", "reqDate"])}</TableCell>
                        <TableCell className="tracking-col-xs tracking-sticky tracking-sticky-3">{getRowValue(row, ["AFFILI_DIV", "affiliDiv"])}</TableCell>
                        <TableCell className="tracking-col-md tracking-sticky tracking-sticky-4">{getRowValue(row, ["VISITOR_NAME_EN", "visitorNameEn"])}</TableCell>
                        <TableCell className="tracking-col-md tracking-sticky tracking-sticky-5">{getRowValue(row, ["VISITOR_NAME_KR", "visitorNameKr"])}</TableCell>
                        <TableCell className="tracking-col-md tracking-sticky tracking-sticky-6">{getRowValue(row, ["VISITOR_DEPT", "visitorDept"])}</TableCell>
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
                        <TableCell className="tracking-col-file">
                          {renderHotelFileUpload(
                            getRowValue(row, [
                              "HOTEL_FILE_UPLOAD",
                              "hotelFileUpload",
                              "HOTEL_FILE",
                              "hotelFile",
                            ])
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

              {trackingScrollState.maxTop > 0 && (
                <Box
                  className="tracking-scroll-panel"
                  sx={{
                    gridColumn: "2 / 3",
                    gridRow: "1 / 2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    justifyItems: "center",
                    minHeight: 0,
                  }}
                  title="Kéo để cuộn lên / xuống"
                >
                  <input
                    className="tracking-big-scroll-range tracking-big-scroll-range-vertical"
                    type="range"
                    min="0"
                    max={trackingScrollState.maxTop}
                    value={Math.max(
                      0,
                      trackingScrollState.maxTop - Math.min(
                        trackingScrollState.top,
                        trackingScrollState.maxTop
                      )
                    )}
                    onChange={handleTrackingVerticalScrollChange}
                    aria-label="Vertical table scrollbar"
                  />
                </Box>
              )}

              {trackingScrollState.maxLeft > 0 && (
                <Box
                  className="tracking-scroll-panel"
                  sx={{
                    gridColumn: "1 / 2",
                    gridRow: "2 / 3",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    minWidth: 0,
                  }}
                  title="Kéo để cuộn trái / phải"
                >
                  <input
                    className="tracking-big-scroll-range"
                    type="range"
                    min="0"
                    max={trackingScrollState.maxLeft}
                    value={Math.min(trackingScrollState.left, trackingScrollState.maxLeft)}
                    onChange={handleTrackingHorizontalScrollChange}
                    aria-label="Horizontal table scrollbar"
                  />
                </Box>
              )}

              {trackingScrollState.maxTop > 0 && trackingScrollState.maxLeft > 0 && (
                <Box
                  className="tracking-scroll-panel"
                  sx={{
                    gridColumn: "2 / 3",
                    gridRow: "2 / 3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#555",
                  }}
                />
              )}
            </Box>
          )}

          {!isLoadingTracking && filteredTrackingRows.length > TRACKING_PAGE_SIZE && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="flex-end"
              sx={{ pt: 0.75, flexShrink: 0 }}
            >
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                Page {currentTrackingPage} / {totalTrackingPages} · {filteredTrackingRows.length} rows
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleTrackingPreviousPage}
                disabled={currentTrackingPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleTrackingNextPage}
                disabled={currentTrackingPage >= totalTrackingPages}
              >
                Next
              </Button>
            </Stack>
          )}
        </Box>
      )}
    </Box>
   
  );
}
