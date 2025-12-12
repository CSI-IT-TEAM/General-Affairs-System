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
      // case "003":
      //   navigate("/request/plane");
        // break;
      case "005":
        navigate("/booking/meeting-room");
        break;
      case "004":
        navigate("/booking/pickleball");
        break;
      case "006":
        navigate("/registration/temporary-residence");
        break;
      default: {
        navigate("/");
        break;
      }
    }
  };
  
  // Filter và sort options dựa trên visible và sort_order
  // const filteredAndSortedOptions = optionData
  //   .filter((item) => item.visible !== false) // Hiển thị nếu visible !== false (mặc định true nếu không có visible)
  //   .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)); // Sắp xếp theo sort_order

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

            // {filteredAndSortedOptions.map((item) => {
            //   // Menu 003 vẫn sử dụng handleOpen cho warning modal
            //   const handleClick = item.id === "003"  
            //     ? handleOpen 
            //     : () => handleNavigate(item.id);

              // Thu thập tất cả các cards sẽ hiển thị
              const visibleCards = [];
              
              optionData.forEach((item) => {
                // Luôn hiển thị menu 001
                if (item.id === "001") {
                  visibleCards.push(item);
                }
                // Menu 002: hiển thị nếu EXP/special emp
                else if (item.id === "002") {
                  if (isExpOrSpecialEmp) {
                    visibleCards.push(item);
                  }
                }
                // Menu 004, 005, 006: hiển thị nếu EXP/special emp hoặc jobPosition thỏa
                else if (item.id === "004" || item.id === "005" || item.id === "006") {
                  if (isExpOrSpecialEmp || canViewJobPositionMenu) {
                    visibleCards.push(item);
                  }
                }
              });

              // Render cards với layout: 3 cards trên, 2 cards dưới (căn giữa)
              const result = [];
              
              visibleCards.forEach((item, index) => {
                // Nếu có 5 cards và đang ở card thứ 4 (index 3), thêm Grid item rỗng ở đầu để offset căn giữa
                if (visibleCards.length === 5 && index === 3) {
                  result.push(
                    <Grid item lg={2} md={0} xs={0} key={`spacer-start-${item.id}`} sx={{ display: { xs: 'none', md: 'none', lg: 'block' } }} />
                  );
                }
                
                result.push(
                  <Grid 
                    item 
                    lg={4} 
                    md={6} 
                    xs={12} 
                    key={item.id} 
                    style={{ height: "100%" }}
                  >
                    <CardPrimary
                      data={item}
                      handleClick={()=>handleNavigate(item.id)}
                    />
                  </Grid>
                );
                
                // Nếu có 5 cards và đang ở card cuối cùng (index 4), thêm Grid item rỗng ở cuối để căn giữa hoàn hảo
                if (visibleCards.length === 5 && index === 4) {
                  result.push(
                    <Grid item lg={2} md={0} xs={0} key={`spacer-end-${item.id}`} sx={{ display: { xs: 'none', md: 'none', lg: 'block' } }} />
                  );
                }
              });
              
              return result;
            })()}
              {/* return (
                <Grid item lg={3} md={6} xs={12} key={item.id} style={{ height: "100%" }}>
                  <CardPrimary
                    data={item}
                    handleClick={handleClick}
                  />
                </Grid>
              );
            })} */}
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
