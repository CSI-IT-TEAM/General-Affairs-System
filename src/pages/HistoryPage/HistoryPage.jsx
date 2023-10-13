import * as React from "react";
import { styled } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Collapse from "@mui/material/Collapse";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { red } from "@mui/material/colors";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useTranslation } from "react-i18next";
import { Box, Container, Stack } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { historyURL } from "../../api";
import { NoticeCard } from "../../components";
const carImage = "../../assets/images/car.png";
const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));
const width = window.innerWidth;
const height = window.innerHeight - (width <= 479 ? 180 : 230);
export default function HistoryPage() {
  const [expanded, setExpanded] = React.useState(false);
  const [data, setData] = React.useState(null);
  /////// Handle Warning Modal
  const [openInfo, setOpenInfo] = React.useState(false);
  const handleCloseInfo = () => setOpenInfo(false);
  /////// Translate Lang
  const { t } = useTranslation();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  ////// Cancel Fetch API After Timeout
  const Timeout = (time) => {
    let controller = new AbortController();
    setTimeout(() => controller.abort(), time * 1000);
    return controller;
  };
  const handleDownload = (empID) => {
    fetch(historyURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ARG_TYPE: "Q",
        ARG_EMPID: empID, //user name
        OUT_CURSOR: "",
      }),
      signal: Timeout(5).signal,
    })
      .then((response) => {
        response.json().then(async (result) => {
          if (result && result?.length > 0) {
            setData((data) => result);
          } else {
            setData((data) => null);
          }
        });
      })
      .catch(() => {
        setOpenInfo(true);
      });
  };

  ///Download On Visible
  React.useEffect(() => {
    const empData = JSON.parse(sessionStorage.getItem("userData"));
    handleDownload(empData.EMPID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Box className="s-form" style={{ minHeight: height }} bgcolor={"#d9d9d9"}>
      <Container>
        <h3 className="s-form-title">
          {t("history_bef")} <span>{t("history_aft")}</span>
        </h3>
        {data && data !== null && data?.length > 0 ? (
          data.map((item, index) => {
            return (
              <Card sx={{ width: "100%", marginTop: 2, borderRadius: 5 }}>
                <CardHeader
                  avatar={
                    <Avatar
                      //   sx={{ bgcolor: red[500] }}
                      //   aria-label="recipe"
                      alt="avatar-car"
                      src="../../assets/images/car.png"
                    >
                      R
                    </Avatar>
                  }
                  action={
                    <IconButton aria-label="settings">
                      <MoreVertIcon />
                    </IconButton>
                  }
                  title={item.DEPART + " > " + item.ARRIVAL}
                  titleTypographyProps={{ variant: "h5" }}
                  subheader={
                    "Go Date Time: " + item.GO_DATE + " " + item.GO_TIME
                  }
                />
                {/* <CardMedia
                  component="img"
                  height="194"
                  image="/static/images/cards/paella.jpg"
                  alt="Paella dish"
                /> */}
                <CardContent>
                  <Stack spacing={0.5} direction={"column"}>
                    <Typography variant="h4" color="text.primary">
                      {t("frm_passenger")}: {item.MAN_QTY}
                    </Typography>
                    {item.CFM_YN === "Y" ? (
                      <Stack
                        key={index}
                        direction={"row"}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                      >
                        <Typography variant="h6" color="text.primary">
                          {/* - {t("btn_confirm")}: */}
                        </Typography>
                        <Typography
                          bgcolor={"green"}
                          color="white"
                          p={2}
                          borderRadius={15}
                        >
                          Confirmed
                        </Typography>
                      </Stack>
                    ) : item.CFM_YN === "N" ? (
                      <Stack
                        direction={"row"}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                      >
                        <Typography variant="h6" color="text.primary">
                          {/* - {t("btn_confirm")}: */}
                        </Typography>
                        <Typography
                          bgcolor={"yellow"}
                          color="black"
                          p={2}
                          borderRadius={15}
                        >
                          Waiting...
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack
                        direction={"row"}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                      >
                        <Typography variant="h6" color="text.primary">
                          {/* - {t("btn_confirm")}: */}
                        </Typography>
                        <Typography
                          bgcolor={"red"}
                          color="white"
                          p={2}
                          borderRadius={15}
                        >
                          Denied
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <CardContent>
                    <Typography paragraph>Method:</Typography>
                    <Typography paragraph>
                      Heat 1/2 cup of the broth in a pot until simmering, add
                      saffron and set aside for 10 minutes.
                    </Typography>
                    <Typography paragraph>
                      Heat oil in a (14- to 16-inch) paella pan or a large, deep
                      skillet over medium-high heat. Add chicken, shrimp and
                      chorizo, and cook, stirring occasionally until lightly
                      browned, 6 to 8 minutes. Transfer shrimp to a large plate
                      and set aside, leaving chicken and chorizo in the pan. Add
                      pimentón, bay leaves, garlic, tomatoes, onion, salt and
                      pepper, and cook, stirring often until thickened and
                      fragrant, about 10 minutes. Add saffron broth and
                      remaining 4 1/2 cups chicken broth; bring to a boil.
                    </Typography>
                    <Typography paragraph>
                      Add rice and stir very gently to distribute. Top with
                      artichokes and peppers, and cook without stirring, until
                      most of the liquid is absorbed, 15 to 18 minutes. Reduce
                      heat to medium-low, add reserved shrimp and mussels,
                      tucking them down into the rice, and cook again without
                      stirring, until mussels have opened and rice is just
                      tender, 5 to 7 minutes more. (Discard any mussels that
                      don&apos;t open.)
                    </Typography>
                    <Typography>
                      Set aside off of the heat to let rest for 10 minutes, and
                      then serve.
                    </Typography>
                  </CardContent>
                </Collapse>
              </Card>
            );
          })
        ) : (
          <NoticeCard />
        )}
      </Container>
    </Box>
  );
}
