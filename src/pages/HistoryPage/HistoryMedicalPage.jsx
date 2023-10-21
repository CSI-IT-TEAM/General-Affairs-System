import { Box, Container, Typography } from "@mui/material";
import i18next from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function HistoryMedicalPage() {
  const { t } = useTranslation();
  const { navigate } = useNavigate();
  const langCookie = i18next.language;
  return (
    <>
      <Box className="s-form">
        <Container>
          <h3 className="s-form-title" id="title_text">
            {t("title_medical")} <span>{t("history")}</span>
          </h3>
        </Container>
      </Box>
    </>
  );
}
