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
  Badge,
  Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
import {
  MedicalHistoryDeleteURL,
  MedicalImageListSelectURL,
} from "../../../api";
import { t } from "i18next";
import { Drawer } from "rsuite";
// import { Document, Page } from "react-pdf";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { uploadImageListData } from "../../../data/uploadMedicalData";
export default function HistoryCard({ item }) {
  const [Iscollapse, setIscollapse] = useState(true);
  const [IsDisplay, setIsDisplay] = useState(true);
  const [FileList, setFileList] = useState([]);
  const [isOpen, setisOpen] = useState(false);
  const [numPages, setNumPages] = useState();
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  const handleImageClick = async (item) => {
    // console.log(item);
    let UploadData = await uploadImageListData({
      TYPE: "Q",
      TREAT_DATE: item.TREAT_DATE_NO_FM,
      TREAT_SEQ: item.TREAT_SEQ,
      EMP_ID: item.EMP_ID,
    });
    console.log(UploadData);
    await fetch(MedicalImageListSelectURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(UploadData),
    }).then((response) => {
      response.json().then(async (result) => {
        if (result) {
          console.log(result);
          setFileList(result);
          setisOpen(true);
        }
      });
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
    <>
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
              <Card
                key={item.ROWID}
                sx={{
                  width: "100%",
                  // border: "0.5px dashed",
                  // borderColor: item.CFM_YN === "Y" ? "green" : "yellow",
                }}
              >
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

                          {item.IMAGE_COUNT > 0 ? (
                            <Badge
                              badgeContent={item.IMAGE_COUNT}
                              color="error"
                            >
                              <IconButton
                                onClick={() => handleImageClick(item)}
                                color="primary"
                                size="large"
                                aria-label="Invoice Image Picture"
                              >
                                <CollectionsIcon
                                  sx={{
                                    fontSize: "2rem",
                                  }}
                                />
                              </IconButton>
                            </Badge>
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
                        sx={{
                          paddingY: 3,
                        }}
                        label={
                          <Stack direction={"row"} alignItems={"center"}>
                            <PriceChangeOutlinedIcon />
                            <Stack>
                              <Typography
                                sx={{
                                  paddingY: "1px",
                                  paddingX: "10px",
                                  // backgroundColor: "#4b50f0",
                                  // borderRadius: "5px",
                                  color: "#4b50f0",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}
                                variant="h5"
                                color="text.secondary"
                                component={"div"}
                              >
                                {formatNumber(item.AMOUNT_QTY)} VNĐ
                              </Typography>
                              <Divider />
                              <Typography
                                sx={{
                                  paddingY: "1px",
                                  paddingX: "10px",
                                  // backgroundColor: "#4b50f0",
                                  // borderRadius: "5px",
                                  color: "#4b50f0",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}
                                variant="h5"
                                color="navy"
                                component={"div"}
                              >
                                {formatNumber(item.AMOUNT_QTY_USD)} $
                              </Typography>
                            </Stack>
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
                    <Divider textAlign="left" color="red">
                      <Stack
                        direction={"row"}
                        alignItems={"flex-end"}
                        justifyContent={"space-between"}
                        spacing={2}
                      >
                        {/* <Button
                        disabled={item.CFM_YN === "Y" || item.CFM_YN === "D"}
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
                      </Button> */}

                        {item.CFM_YN === "N" ? (
                          <Box
                            sx={{
                              px: 2,
                              py: 0.3,
                              bgcolor: "yellow",
                              borderRadius: 2,
                            }}
                          >
                            <Typography color={"blue"}>
                              {t("frm_waiting")}
                            </Typography>{" "}
                          </Box>
                        ) : item.CFM_YN === "Y" ? (
                          <Box
                            sx={{
                              px: 2,
                              py: 0.3,
                              bgcolor: "green",
                              borderRadius: 2,
                            }}
                          >
                            <Typography color={"white"}>
                              {t("frm_confirmed")}
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              px: 2,
                              py: 0.3,
                              bgcolor: "red",
                              borderRadius: 2,
                            }}
                          >
                            <Typography color={"white"}>
                              {t("frm_denied")}
                            </Typography>
                          </Box>
                        )}

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
      <Drawer
        // backdrop="static"
        size="full"
        placement={"bottom"}
        open={isOpen}
        onClose={() => setisOpen(false)}
      >
        <Drawer.Header closeButton={false}>
          <Drawer.Title>
            <Typography
              width={"100%"}
              variant="h5"
              component={"div"}
              sx={{
                color: "navy",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {t("title_invoice_image_list")}
            </Typography>
          </Drawer.Title>
          <Drawer.Actions>
            <IconButton
              sx={{
                color: "red",
                textTransform: "none",
                fontSize: "18px",
                fontWeight: 600,
              }}
              // variant="outlined"
              color={"error"}
              icon={<CloseIcon />}
              onClick={async () => {
                setisOpen(false);
              }}
            >
              <CloseIcon
                sx={{
                  color: "red",
                }}
              />
            </IconButton>
          </Drawer.Actions>
        </Drawer.Header>
        <Drawer.Body>
          <Box
            sx={{
              width: "100%",
            }}
          >
            <Stack spacing={1}>
              <Grid container spacing={2}>
                {FileList && FileList.length === 1 ? (
                  <Grid item xs={12} md={12} lg={12}>
                    {FileList[0].IMAGE_PATH.toString()
                      .toUpperCase()
                      .includes(".PDF") ? (
                      <Stack
                        direction={"row"}
                        spacing={1}
                        alignItems={"center"}
                      >
                        <PictureAsPdfIcon
                          sx={{
                            fontSize: "2.5rem",
                          }}
                        />
                        <Link
                          href={FileList[0].IMAGE_PATH}
                          target="_blank"
                          variant="h5"
                        >
                          {t("title_click_to_view_pdf")}
                        </Link>
                      </Stack>
                    ) : (
                      <img
                        alt="invoice"
                        style={{
                          width: "100%",
                          height: "auto",
                        }}
                        src={FileList[0].IMAGE_PATH}
                      />
                    )}
                  </Grid>
                ) : (
                  FileList.length > 1 &&
                  FileList &&
                  FileList.map((item) => {
                    return (
                      <Grid item xs={12} md={6} lg={6}>
                        {item.IMAGE_PATH.toString()
                          .toUpperCase()
                          .includes(".PDF") ? (
                          <Stack
                            direction={"row"}
                            spacing={1}
                            alignItems={"center"}
                          >
                            <PictureAsPdfIcon
                              sx={{
                                fontSize: "2.5rem",
                              }}
                            />
                            <Link
                              href={item.IMAGE_PATH}
                              target="_blank"
                              variant="h5"
                            >
                              {t("title_click_to_view_pdf")}
                            </Link>
                          </Stack>
                        ) : (
                          <img
                            alt="invoice"
                            style={{
                              width: "100%",
                              height: "auto",
                            }}
                            src={item.IMAGE_PATH}
                          />
                        )}
                      </Grid>
                    );
                  })
                )}
              </Grid>
            </Stack>
          </Box>
        </Drawer.Body>
      </Drawer>
    </>
  );
}
