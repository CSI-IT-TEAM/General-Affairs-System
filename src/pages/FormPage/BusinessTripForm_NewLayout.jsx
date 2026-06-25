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
} from "@mui/material";
import {
  saveBusinessRegistration,
  getBusinessRegistration,
} from "../../api/businessTrip";

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
  { value: "OTHER", label: "OTHER / 기타" },
];


const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "ALL" },
  { value: "PENDING", label: "PENDING" }, 
  { value: "CONFIRMED", label: "CONFIRMED" },
];

const POCKETBASE_BASE_URL = "http://vjweb.dskorea.com:8090";
const POCKETBASE_COLLECTION = "GA_BUSINESS_TRIP_FILES";
const DOCUMENT_FILE_FIELD = "IMAGE_FILE";

const SEND_EMAIL_URL = "http://vjweb.dskorea.com/send-email";
const BUSINESS_TRIP_EMAIL_TO = "LENL.IT@changshininc.com";
const BUSINESS_TRIP_EMAIL_CC = "LENL.IT@changshininc.com";

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
      bgcolor: "#32CD32",
      color: "#000",
      fontWeight: 700,
      textAlign: "center",
    };
  }

  if (status === "CONFIRM" || status === "CONFIRMED") {
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

const renderEmailFileLinks = (value) => {
  if (!value) return "-";

  const parts = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) return "-";

  return parts
    .map((item) => {
      const safeItem = escapeHtml(item);

      if (/^https?:\/\//i.test(item)) {
        return `- <a href="${safeItem}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: underline;">${safeItem}</a>`;
      }

      return `- ${safeItem}`;
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

  const { t } = useTranslation();

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [fileData, setFileData] = useState({ ...EMPTY_FILE_DATA });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [trackingFilters, setTrackingFilters] = useState(() => getDefaultTrackingFilters());
  const [trackingRows, setTrackingRows] = useState([]);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [hasLoadedTracking, setHasLoadedTracking] = useState(false);

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

  const buildBusinessTripEmailHtml = ({
    regId,
    empNo,
    eVisaForSave,
    flightTicketForSave,
    entryDateTimeForSave,
    exitDateTimeForSave,
    hotelReserveDateForSave,
    airportDropoffTimeForSave,
  }) => {
    return [
      `<b>Business Trip Registration Saved</b>`,
      `<br><br>`,
      `1. Registration ID:<br>${escapeHtml(regId || "")}`,
      `<br><br>`,
      `2. Employee No:<br>${escapeHtml(empNo || "")}`,
      `<br><br>`,
      `3. Visitor Information:<br>` +
        `- Factory: ${escapeHtml(formData.affiliDiv)}<br>` +
        `- English Name: ${escapeHtml(formData.visitorNameEn)}<br>` +
        `- Korean Name: ${escapeHtml(formData.visitorNameKr)}<br>` +
        `- Department: ${escapeHtml(formData.visitorDept)}<br>` +
        `- Position: ${escapeHtml(formData.visitorPosition)}<br>` +
        `- Email: ${escapeHtml(formData.email)}`,
      `<br><br>`,
      `4. Business Trip Information:<br>` +
        `- Purpose: ${escapeHtml(formData.purpose)}<br>` +
        `- Related Department: ${escapeHtml(formData.relateDept)}<br>` +
        `- Description: ${escapeHtml(formData.description)}`,
      `<br><br>`,
      `5. Schedule:<br>` +
        `- Entry Date and Time: ${escapeHtml(formatDateDisplay(entryDateTimeForSave))}<br>` +
        `- Exit Date and Time: ${escapeHtml(formatDateDisplay(exitDateTimeForSave))}<br>` +
        `- Hotel Reservation Date: ${escapeHtml(formatDateDisplay(hotelReserveDateForSave))}<br>` +
        `- Airport Pick-up: ${formData.airportPickupYn === "Y" ? "Required" : "Not Needed"}<br>` +
        `- Airport Drop-off Time: ${escapeHtml(formatDateDisplay(airportDropoffTimeForSave))}`,
      `<br><br>`,
      `6. E-Visa / APEC Card:<br>${renderEmailFileLinks(eVisaForSave)}`,
      `<br><br>`,
      `7. Flight Ticket:<br>${renderEmailFileLinks(flightTicketForSave)}`,
    ].join("");
  };

  const sendBusinessTripEmail = async ({
    regId,
    empNo,
    eVisaForSave,
    flightTicketForSave,
    entryDateTimeForSave,
    exitDateTimeForSave,
    hotelReserveDateForSave,
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
    <Box sx={{ p: 3, bgcolor: "#fff" }}>
      <Tabs
        className="business-trip-tabs"
        value={tab}
        onChange={(e, value) => setTab(value)}
      >
        <Tab label={t("business_trip_register")} />
        <Tab label={t("business_trip_tracking")} />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ border: "1px solid #ccc", p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            {t("business_trip_title")}
          </Typography>

          <Grid container spacing={2}>
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

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label={t("business_trip_entry_time")}
                value={formData.entryDateTime}
                onChange={handleEntryDateTimeChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label={t("business_trip_exit_time")}
                value={formData.exitDateTime}
                onChange={handleExitDateTimeChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label={t("business_trip_hotel_reservation_date")}
                value={formData.hotelReserveDate}
                onChange={handleInputChange("hotelReserveDate")}
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
          sx={{
            border: "1px solid #ccc",
            minHeight: 600,
            p: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            {t("business_trip_tracking") || "Business Trip Tracking"}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
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
            <TableContainer component={Paper} sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("requestDate") || "Request Date"}</TableCell>
                    <TableCell>{t("from") || "From"}</TableCell>
                    <TableCell>{t("business_trip_name_en") || "English Name"}</TableCell>
                    <TableCell>{t("business_trip_name_kr") || "Korean Name"}</TableCell>
                    <TableCell>{t("business_trip_dept_from") || "From Department"}</TableCell>
                    <TableCell>{t("business_trip_position") || "Position"}</TableCell>
                    <TableCell>{t("email") || "Email"}</TableCell>
                    <TableCell>{t("business_trip_dept_related") || "Related Dept"}</TableCell>
                    <TableCell>{t("business_trip_purpose") || "Purpose"}</TableCell>
                    <TableCell>{t("business_trip_entry_time") || "Entry"}</TableCell>
                    <TableCell>{t("business_trip_exit_time") || "Exit"}</TableCell>
                    <TableCell>{t("business_trip_hotel_reservation_date") || "Hotel Date"}</TableCell>
                    <TableCell>{t("business_trip_airport_pickup_required") || "Airport"}</TableCell>
                    <TableCell>{t("business_trip_upload_e_visa") || "E-Visa / APEC"}</TableCell>
                    <TableCell>{t("business_trip_upload_flight_ticket") || "Flight Ticket"}</TableCell>
                    <TableCell>{t("status") || "Status"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrackingRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={16} align="center">
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
                        })()}
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
