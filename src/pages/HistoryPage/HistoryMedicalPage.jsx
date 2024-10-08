import {
  AppBar,
  Box,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import i18next from "i18next";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import HistoryCard from "../../components/Card/MedicalHistory/HistoryCard";
import { HistoryListURL } from "../../api";

import DateRangePicker from "rsuite/DateRangePicker";
import subDays from "date-fns/subDays";
import startOfWeek from "date-fns/startOfWeek";
import endOfWeek from "date-fns/endOfWeek";
import addDays from "date-fns/addDays";
import startOfMonth from "date-fns/startOfMonth";
import startOfYear from "date-fns/startOfYear";
import endOfMonth from "date-fns/endOfMonth";
import addMonths from "date-fns/addMonths";
import isBefore from 'date-fns/isBefore';

import { formatNumber } from "devextreme/localization";

const predefinedRanges = [
  {
    label: "Today",
    value: [new Date(), new Date()],
    placement: "left",
  },
  {
    label: "Yesterday",
    value: [addDays(new Date(), -1), addDays(new Date(), -1)],
    placement: "left",
  },
  {
    label: "This week",
    value: [startOfWeek(new Date()), endOfWeek(new Date())],
    placement: "left",
  },
  {
    label: "Last 7 days",
    value: [subDays(new Date(), 6), new Date()],
    placement: "left",
  },
  {
    label: "Last 30 days",
    value: [subDays(new Date(), 29), new Date()],
    placement: "left",
  },
  {
    label: "This month",
    value: [startOfMonth(new Date()), new Date()],
    placement: "left",
  },
  {
    label: "Last month",
    value: [
      startOfMonth(addMonths(new Date(), -1)),
      endOfMonth(addMonths(new Date(), -1)),
    ],
    placement: "left",
  },
  {
    label: "This year",
    value: [new Date(new Date().getFullYear(), 0, 1), new Date()],
    placement: "left",
  },
  {
    label: "Last year",
    value: [
      new Date(new Date().getFullYear() - 1, 0, 1),
      new Date(new Date().getFullYear(), 0, 0),
    ],
    placement: "left",
  },
  {
    label: "All time",
    value: [new Date(new Date().getFullYear() - 1, 0, 1), new Date()],
    placement: "left",
  },
  {
    label: "Last week",
    closeOverlay: false,
    value: (value) => {
      const [start = new Date()] = value || [];
      return [
        addDays(startOfWeek(start, { weekStartsOn: 0 }), -7),
        addDays(endOfWeek(start, { weekStartsOn: 0 }), -7),
      ];
    },
    appearance: "default",
  },
  {
    label: "Next week",
    closeOverlay: false,
    value: (value) => {
      const [start = new Date()] = value || [];
      return [
        addDays(startOfWeek(start, { weekStartsOn: 0 }), 7),
        addDays(endOfWeek(start, { weekStartsOn: 0 }), 7),
      ];
    },
    appearance: "default",
  },
];

export default function HistoryMedicalPage() {
  const { t } = useTranslation();
  const { navigate } = useNavigate();
  const langCookie = i18next.language;
  const [historyData, sethistoryData] = useState([]);
  const [date, setDate] = React.useState([
    new Date(new Date().getFullYear(), 0, 1),
    new Date(),
  ]);

  const handleDateChange = (event) => {
    setDate(event);
    //const empData = JSON.parse(sessionStorage.getItem("userData"));
    // getHistoryList(
    //   empData.EMPID,
    //   moment(event[0]).format("YYYYMMDD"),
    //   moment(event[1]).format("YYYYMMDD")
    // );
  };

  const getHistoryList = (EMP_ID, DATEF, DATET) => {
    fetch(HistoryListURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_TYPE: "Q",
        ARG_EMP_ID: EMP_ID,
        ARG_DATEF: DATEF,
        ARG_DATET: DATET,
        OUT_CURSOR: "",
      }),
    })
      .then((response) => {
        response.json().then(async (result) => {
          if (result.length > 0) {
            console.log(result);
            sethistoryData(result);
          }
        });
      })
      .catch((e) => console.log(e));
  };

  useEffect(() => {
    sethistoryData([]);
    const empData = JSON.parse(sessionStorage.getItem("userData"));
    if (empData != null) {
      getHistoryList(
        empData.EMPID,
        moment(date[0]).format("YYYYMMDD"),
        moment(date[1]).format("YYYYMMDD")
      );
    }
  }, [date]);

  return (
    <>
      <Box className="s-form">
        <Container>
          <h3 className="s-form-title" id="title_text">
            {langCookie === "en" ? (
              <>
                {t("title_medical")} <span>{t("frm_history")}</span>
              </>
            ) : (
              <>
                <span>{t("frm_history")} </span>
                {t("title_medical")}
              </>
            )}
          </h3>
          <DateRangePicker
            cleanable={false}
            ranges={predefinedRanges}
            // shouldDisableDate={date => isBefore(date, new Date(new Date().getFullYear(), 0, 1))}
            showOneCalendar
            value={date}
            onChange={(event) => handleDateChange(event)}
            block
            size="lg"
            appearance="default"
            placeholder="Date Range Picker"
          />

          {historyData && historyData.length > 0 ? (
            <Paper
              sx={{
                marginTop: "5px",
                borderWidth: "3px",
                borderColor: "navy",
                borderStyle: "dashed",
                borderRadius: "10px",
                padding: 1,
              }}
            >
              <Grid container textAlign={"center"}>
                <Grid item xs={4} md={4} lg={4}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "navy",
                      backgroundColor: "yellow",
                    }}
                  >
                    Items
                  </Typography>
                </Grid>
                <Grid item xs={4} md={4} lg={4}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "navy",
                      backgroundColor: "yellow",
                    }}
                  >
                    VNĐ
                  </Typography>
                </Grid>
                <Grid item xs={4} md={4} lg={4}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "navy",
                      backgroundColor: "yellow",
                    }}
                  >
                    USD
                  </Typography>
                </Grid>
                <Grid item xs={12} md={12} lg={12}>
                  <Grid container textAlign={"center"}>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color: "green",
                          backgroundColor: "#e9f2ed",
                        }}
                      >
                        Budget
                      </Typography>
                    </Grid>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color: "green",
                        }}
                      >
                        {formatNumber(historyData[0].BUDGET)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color: "green",
                        }}
                      >
                        {formatNumber(historyData[0].BUDGET_USD)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color: "purple",
                          backgroundColor: "#ece1ed",
                        }}
                      >
                        Using
                      </Typography>
                    </Grid>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color: "purple",
                        }}
                      >
                        {formatNumber(historyData[0].USING_QTY)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color: "purple",
                        }}
                      >
                        {formatNumber(historyData[0].USING_QTY_USD)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "#e1e2e3",
                        }}
                      >
                        Remain
                      </Typography>
                    </Grid>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                        }}
                      >
                        {formatNumber(historyData[0].REMAIN_QTY)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} md={4} lg={4}>
                      <Typography
                        sx={{
                          fontWeight: "bold",
                        }}
                      >
                        {formatNumber(historyData[0].REMAIN_QTY_USD)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
                {/* <Grid item xs={6} md={6} lg={4}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "green",
                    }}
                  >
                    Budget: {formatNumber(historyData[0].BUDGET)}đ
                  </Typography>
                </Grid>
                <Grid item xs={6} md={6} lg={4}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "navy",
                    }}
                  >
                    Using: {formatNumber(historyData[0].USING_QTY)}đ
                  </Typography>
                </Grid>
                <Grid item xs={12} md={12} lg={4}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "orangered",
                    }}
                  >
                    Remain: {formatNumber(historyData[0].REMAIN_QTY)}đ
                  </Typography>
                </Grid> */}
              </Grid>
            </Paper>
          ) : null}
          <Grid container spacing={2}>
            {historyData && historyData.length > 0 ? (
              historyData.map(function (item, index) {
                return <HistoryCard item={item} />;
              })
            ) : (
              <Grid
                item
                xs={12}
                sm={12}
                md={12}
                alignItems={"center"}
                alignContent={"center"}
                textAlign={"center"}
              >
                <Typography alignSelf={"center"}>No History Found!</Typography>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
