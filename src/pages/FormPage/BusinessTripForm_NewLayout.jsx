import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
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
} from "@mui/material";
import { saveBusinessRegistration } from "../../api/businessTrip";

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

const POSITION_OPTIONS = [
  { value: "STAFF", label: "STAFF / 직원" },
  { value: "SUPERVISOR", label: "SUPERVISOR / 감독자" },
  { value: "MANAGER", label: "MANAGER / 매니저" },
  { value: "SENIOR MANAGER", label: "SENIOR MANAGER / 선임 매니저" },
  { value: "ASSISTANT DIRECTOR", label: "ASSISTANT DIRECTOR / 부이사" },
  { value: "DEPUTY DIRECTOR", label: "DEPUTY DIRECTOR / 부서장" },
  { value: "DIRECTOR", label: "DIRECTOR / 이사" },
  { value: "SENIOR DIRECTOR", label: "SENIOR DIRECTOR / 상무이사" },
  { value: "VICE GENERAL MANAGER", label: "VICE GENERAL MANAGER / 부총경리" },
  { value: "GENERAL MANAGER", label: "GENERAL MANAGER / 총경리" },
  { value: "CEO", label: "CEO / 대표이사" },
];

export default function BusinessTripFormNewLayout() {
  const [tab, setTab] = useState(0);

  /////// Translate Lang
  const { t } = useTranslation();
  const langCookie = i18next.language;
  const [lang, setLang] = useState(langCookie);

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
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

    // Input type="datetime-local" returns YYYY-MM-DDTHH:mm
    // Save to Oracle as YYYYMMDDHH24MI, example: 202606241032
    const normalizedValue = dateTimeValue.replace("T", " ");
    const [datePart, timePart = ""] = normalizedValue.split(" ");
    const [year = "", month = "", day = ""] = datePart.split("-");
    const [hour = "00", minute = "00"] = timePart.split(":");

    if (!year || !month || !day) return "";

    return `${year}${month}${day}${hour}${minute}`;
  };

  const formatDateForSave = (dateValue) => {
    if (!dateValue) return "";

    // Input type="date" returns YYYY-MM-DD
    // Save to Oracle as YYYYMMDD, example: 20260624
    const [year = "", month = "", day = ""] = dateValue.split("-");

    if (!year || !month || !day) return "";

    return `${year}${month}${day}`;
  };

  const handleFileChange = (field) => (event) => {
    const file = event.target.files?.[0];

    setFormData((prev) => ({
      ...prev,
      // Hiện tại API SMT_SAVE_BUSINESS_REG chỉ nhận JSON text,
      // nên phần này lưu tên file. Nếu muốn upload file thật,
      // cần thêm API upload riêng và lưu fileId/fileUrl ở đây.
      [field]: file?.name || "",
    }));
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

          E_VISA: formData.eVisa,
          eVisa: formData.eVisa,

          BUSINESS_TRIP_FLIGHT_TICKET: formData.businessTripFlightTicket,
          businessTripFlightTicket: formData.businessTripFlightTicket,

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
        alert(result.data?.message || `Save successful. Reg ID: ${result.data?.regId || ""}`);
        setFormData({ ...EMPTY_FORM });
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
                <input hidden type="file" onChange={handleFileChange("eVisa")} />
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
                <input hidden type="file" onChange={handleFileChange("businessTripFlightTicket")} />
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Business Trip Report
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="영문 성명 / TÊN TIẾNG ANH" />
            </Grid>
            <Grid item xs={12} md={6}>             

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
          </Grid>
        </Box>
      )}
    </Box>
  );
}
