import { Box, Container, Grid } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CardPrimary, ModalWarning } from "../../components";

import "./HomePage.scss";
import { optionData } from "../../data";
import { downloadURL } from "../../api";

const width = window.innerWidth;

const HomePage = () => {
  /////// Translate Lang
  const { t } = useTranslation();

  /////// Handle Warning Modal
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [persType, setPersType] = useState("EMP");
  const [emp_id, setEmp_id] = useState('')
  const colSpacing = width > 479 ? 2 : 1.5;

  /////// Check user Info
  const userIsActive =
    sessionStorage.getItem("userData") === null ||
      sessionStorage.getItem("userData").length === 0
      ? true
      : false;
  const navigate = useNavigate();

  const handleReason = async (type, empid = "") => {
    const dataConfig = {
      ARG_TYPE: type,
      ARG_EMPID: empid,
      OUT_CURSOR: "",
    };
    fetchDownload(type, dataConfig);
  };

  ///// Handle Download Data
  const fetchDownload = async (type, dataConfig) => {
    fetch(downloadURL, {
      method: "POST",
      mode: "cors",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataConfig),
    }).then((response) => {
      response.json().then(async (result) => {
        if (result.length > 0) {
          // Store
          if (type === "MAIN_REASON") {
            sessionStorage.setItem("mainReason", JSON.stringify(result));
          } else if (type === "SUB_REASON") {
            sessionStorage.setItem("subReason", JSON.stringify(result));
          } else if (type === "DEPART") {
            sessionStorage.setItem("departList", JSON.stringify(result));
          } else if (type === "DROP_OFF") {
            sessionStorage.setItem("dropOffList", JSON.stringify(result));
          } else if (type === "DEPT_EMP") {
            sessionStorage.setItem("deptEmpList", JSON.stringify(result));
          } else if (type === "EXP") {
            sessionStorage.setItem("EXPList", JSON.stringify(result));
          } else if (type === "DEPT") {
            sessionStorage.setItem("DeptList", JSON.stringify(result));
          }
        }
      });
    });
  };

  useEffect(() => {
    handleLogOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /////// LogOut Event
  const handleLogOut = () => {
    if (userIsActive) {
      navigate("/signin");
    } else {
      const empData = JSON.parse(sessionStorage.getItem("userData"));

      sessionStorage.removeItem("mainReason");
      sessionStorage.removeItem("subReason");
      sessionStorage.removeItem("departList");
      sessionStorage.removeItem("dropOffList");
      sessionStorage.removeItem("deptEmpList");
      setEmp_id(empData.EMPID);
      setPersType(empData.PERS_TYPE);
      handleReason("MAIN_REASON");
      handleReason("SUB_REASON");
      handleReason("DEPART");
      handleReason("DROP_OFF");
      handleReason("DEPT_EMP", empData.DEPT);
      handleReason("EXP");
      handleReason("DEPT");
    }
  };

  /////// Navigate to new Screen
  const handleNavigate = (id) => {
    switch (id) {
      case "001":
        navigate("/request/car");
        break;
      case "002":
        navigate("/fee/medical");
        break;
      case "003":
        navigate("/request/plane");
        break;
      default: {
        navigate("/");
        break;
      }
    }
  };
  //300503005
  return (
    <>
      <Box className="s-home">
        <Container>
          <h3 className="s-home-title">
            {t("service")} <span>{t("provide")}</span>
          </h3>
          <Grid justifyContent={"center"} alignItems="stretch" container spacing={colSpacing}>
            {persType === "EXP" || emp_id === "15050432" || emp_id === "99115447" ? (
              optionData.map((item, index) => {
                if (item.id === "001" || item.id === "002") {
                  //|| item.id === "002"
                  return (
                    <Grid item md={4} xs={12} key={item.id} style={{ height: "100%" }}>
                      <CardPrimary
                        data={item}
                        handleClick={() => handleNavigate(item.id)}
                      />
                    </Grid>
                  );
                } else {
                  return (
                    <Grid item md={4} xs={12} key={item.id} style={{ height: "100%" }}>
                      <CardPrimary data={item} handleClick={handleOpen} />
                    </Grid>
                  );
                }
              })
            ) : (
              <Grid
                item
                justifyItems={"center"}
                alignItems={"center"}
                md={4}
                xs={12}
                key={optionData[0].id}
              >
                <CardPrimary
                  data={optionData[0]}
                  handleClick={() => handleNavigate(optionData[0].id)}
                />
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
      <ModalWarning
        open={open}
        handleOpen={handleOpen}
        handleClose={handleClose}
        type="under-construct"
      />
    </>
  );
};

export default HomePage;
