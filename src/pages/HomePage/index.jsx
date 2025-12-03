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
  const [jobPosition, setJobPosition] = useState(null);
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
      // Lưu JOB_POSITION nếu có
      setJobPosition(empData.JOB_POSITION || null);
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
      case "004":
        navigate("/booking/pickleball");
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
        <Container maxWidth="xl">
          <h3 className="s-home-title">
            {t("service")} <span>{t("provide")}</span>
          </h3>
          <Grid justifyContent={"center"} alignItems="stretch" container spacing={colSpacing}>
            {(() => {
              // Kiểm tra quyền xem menu
              const isExpOrSpecialEmp = persType === "EXP" || emp_id === "15050432" || emp_id === "99115447";
              const canViewJobPositionMenu = jobPosition !== null && (Number(jobPosition) <= 180 || Number(jobPosition) === 300);
              
              // Logic hiển thị menu:
              // 1. EXP hoặc emp_id đặc biệt → thấy hết 4 menu (001, 002, 003, 004)
              // 2. jobPosition <= 180 hoặc = 300 → thấy 3 menu (001, 002, 004)
              // 3. Ngược lại → chỉ thấy menu 001
              
              return optionData.map((item) => {
                // Luôn hiển thị menu 001
                if (item.id === "001") {
                  return (
                    <Grid item lg={3} md={6} xs={12} key={item.id} style={{ height: "100%" }}>
                      <CardPrimary
                        data={item}
                        handleClick={()=>handleNavigate(item.id)}
                      />
                    </Grid>
                  );
                }
                
                // Menu 002: hiển thị nếu EXP/special emp hoặc jobPosition thỏa
                if (item.id === "002") {
                  if (isExpOrSpecialEmp) {
                    return (
                      <Grid item lg={3} md={6} xs={12} key={item.id} style={{ height: "100%" }}>
                        <CardPrimary
                          data={item}
                          handleClick={()=>handleNavigate(item.id)}
                        />
                      </Grid>
                    );
                  }
                  return null;
                }
                
                // Menu 003: chỉ hiển thị nếu EXP/special emp
                if (item.id === "003") {
                  if (isExpOrSpecialEmp) {
                    return (
                      <Grid item lg={3} md={6} xs={12} key={item.id} style={{ height: "100%" }}>
                        <CardPrimary
                          data={item}
                          handleClick={handleOpen}
                        />
                      </Grid>
                    );
                  }
                  return null;
                }
                
                // Menu 004: hiển thị nếu EXP/special emp hoặc jobPosition thỏa
                if (item.id === "004") {
                  if (isExpOrSpecialEmp || canViewJobPositionMenu) {
                    return (
                      <Grid item lg={3} md={6} xs={12} key={item.id} style={{ height: "100%" }}>
                        <CardPrimary
                          data={item}
                          handleClick={()=>handleNavigate(item.id)}
                        />
                      </Grid>
                    );
                  }
                  return null;
                }
                
                return null;
              });
            })()}
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
