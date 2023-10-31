import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import {
  Avatar,
  Box,
  CardActionArea,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Button,
  Collapse,
  Grid,
  Paper,
  Hidden,
  Chip,
  TextField,
} from "@mui/material";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import StyleIcon from "@mui/icons-material/Style";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import CollectionsIcon from "@mui/icons-material/Collections";
import { formatNumber } from "devextreme/localization";
import Swal from "sweetalert2";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import PinDropOutlinedIcon from "@mui/icons-material/PinDropOutlined";
import PriceChangeOutlinedIcon from "@mui/icons-material/PriceChangeOutlined";
import HealingOutlinedIcon from "@mui/icons-material/HealingOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { MedicalHistoryDeleteURL } from "../../../api";
import { t } from "i18next";
export default function HistoryCard({ item }) {
  const [Iscollapse, setIscollapse] = useState(true);
  const [IsDisplay, setIsDisplay] = useState(true);
  const handleImageClick = (item) => {
    Swal.fire({
      title: " ",
      
      showCloseButton: true,
      width: "100%",
      imageUrl: item.IMG_NAME,
      // html:'<img src="'+item.IMG_NAME +'" alt="img" </img>',
      imageWidth: "98%",
      imageAlt: "Invoice image",
      showConfirmButton: false,
      // closeButtonHtml: "<button type='button' class='swal2-close'>X</button>",
    });
  };

  const handleDeleteInvoice = (RowID) => {
    Swal.fire({
      title: t("swal_are_you_sure"),
      text: t("swal_are_you_sure_content"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("swal_confirm_delete_btn"),
      cancelButtonText: t("swal_cancel_btn"),
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(MedicalHistoryDeleteURL, {
          method: "POST",
          mode: "cors",
          dataType: "json",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ARG_TYPE: "D",
            ARG_ROWID: RowID,
          }),
        }).then((response) => {
          // console.log(response);
          if (response.status === 200) {
            setIscollapse(false);
            Swal.fire(
              t("swal_deleted"),
              t("swal_deleted_content"),
              "success"
            ).then(() => {
              setIsDisplay(false);
            });
          } else {
            Swal.fire(
              t("swal_deleted_fail"),
              t("swal_deleted_content_fail"),
              "error"
            );
          }
        });
      }
    });
  };
  return (
    <Grid
      key={item.ROWID}
      item
      xs={12}
      sm={6}
      md={6}
      sx={{
        display: !IsDisplay ? "none" : "",
      }}
    >
      <Collapse
        in={Iscollapse}
        timeout="auto"
        unmountOnExit
        sx={{
          width: "100%",
        }}
      >
        <Paper>
          <Stack>
            <Card key={item.ROWID} sx={{ width: "100%" }}>
              <CardContent>
                <Stack>
                  <Stack>
                    <Stack direction={"column"}>
                      <Stack
                        direction={"row"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                      >
                        <Stack
                          direction={"row"}
                          spacing={1}
                          alignItems={"center"}
                        >
                          <TaskAltOutlinedIcon sx />
                          <Typography
                            sx={{
                              fontWeight: "bolder",
                              fontSize: "20px",
                            }}
                          >
                            {item.TREAT_DATE}
                          </Typography>
                        </Stack>

                        {item.IMG_NAME ? (
                          <IconButton
                            onClick={() => handleImageClick(item)}
                            color="primary"
                            size="large"
                            aria-label="Invoice Image Picture"
                          >
                            <CollectionsIcon />
                          </IconButton>
                        ) : null}
                      </Stack>

                      <Stack
                        direction={"row"}
                        spacing={1}
                        alignItems={"center"}
                      >
                        <PinDropOutlinedIcon />
                        <Typography
                          sx={{
                            fontWeight: "bold",
                            color: "navy",
                          }}
                        >
                          {item.MEDICAL_NAME}
                        </Typography>
                      </Stack>

                      {/* <Stack direction={"row"} spacing={1} alignItems={"center"}>
                <Typography
                  color={"navy"}
                  variant="h6"
                  component="div"
                  sx={{
                    padding: "5px",
                    paddingX: "10px",
                    backgroundColor: "navy",
                    borderRadius: "5px",
                    color: "white",
                    fontSize: "18px",
                  }}
                >
                  {item.RELATIONSHIP}
                </Typography>
              </Stack> */}
                    </Stack>
                  </Stack>

                  <Divider textAlign="right">
                    <Chip
                      label={
                        <Stack direction={"row"} alignItems={"center"}>
                          <PriceChangeOutlinedIcon />
                          <Typography
                            sx={{
                              paddingY: "5px",
                              paddingX: "10px",
                              // backgroundColor: "#4b50f0",
                              // borderRadius: "5px",
                              color: "#4b50f0",
                              fontSize: "20px",
                              fontWeight: "bold",
                            }}
                            variant="h5"
                            color="text.secondary"
                            component={"div"}
                          >
                            {formatNumber(item.AMOUNT_QTY)} VNĐ
                          </Typography>
                        </Stack>
                      }
                    />
                  </Divider>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: "navy",
                          }}
                        >
                          <HealingOutlinedIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primaryTypographyProps={{
                          fontSize: "18px",
                        }}
                        primary={
                          <TextField
                            label={t("frm_services_name")}
                            color="warning"
                            focused
                            fullWidth
                            variant="standard"
                            inputProps={{
                              readonly: "true",
                            }}
                            multiline
                            value={item.SERVICE_NAME}
                          ></TextField>
                        }
                      />
                    </ListItem>
                  </List>
                  <Divider textAlign="right" color="red">
                    <Stack
                      direction={"row"}
                      alignItems={"center"}
                      justifyContent={"space-between"}
                    >
                      <Typography></Typography>
                      <Button
                        sx={{
                          textTransform: "none",
                        }}
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineRoundedIcon />}
                        onClick={() => handleDeleteInvoice(item.ROWID)}
                      >
                        {t("btn_delete_invoice")}
                      </Button>
                      {/* <IconButton
          onClick={() => alert(item.ROWID)}
          color="error"
          size="large"
          aria-label="Invoice Image Picture"
        >
          <DeleteOutlineRoundedIcon />
        </IconButton> */}
                    </Stack>
                  </Divider>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Paper>
      </Collapse>
    </Grid>
  );
}
