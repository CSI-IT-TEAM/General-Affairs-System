import { Box, Card, CardContent, Typography } from "@mui/material";
import ButtonSecondary from "../../Button/Secondary";
import { useTranslation } from "react-i18next";

import "./CardPrimary.scss";

const CardPrimary = ({ data, handleClick }) => {
  /////// Translate Lang
  const { t } = useTranslation();

  /////// Handle Content
  const handleContent = (type) => {
    let title = "",
      desc = "";

    switch (data.id) {
      case "001":
        title = t("vehicle_title");
        desc = t("vehicle_desc");
        break;
      case "002":
        title = t("medical_title");
        desc = t("medical_desc");
        break;
      case "003":
        title = t("flight_title");
        desc = t("flight_desc");
        break;
      default:
        break;
    }

    return type === "title" ? title : desc;
  };

  const cardTitle = handleContent("title");
  const cardDesc = handleContent("desc");

  return (
    <>
      <Card className="b-card" onClick={handleClick}>
        <Box
          
          className={`b-thumb b-thumb--first`}
          sx={{
            backgroundColor: data.bgColor,
          }}
        />
        <Box className={`b-image b-image--first`}>
          <img src={data.thumb} alt={data.title} />
        </Box>
        <CardContent className="b-content">
          <Typography
            gutterBottom
            variant="h5"
            component="div"
            className="b-title"
          >
            {cardTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" className="b-desc">
            {cardDesc}
          </Typography>
        </CardContent>
        <Box className="b-bot">
          <ButtonSecondary title={t("order")} />
        </Box>
      </Card>
    </>
  );
};

export default CardPrimary;
