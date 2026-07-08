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
      case "007":
        navigate("/registration/canteen-attendance");
        break;
      case "008":
        navigate("/registration/business-trip");
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
        <Container maxWidth="xl" className="s-home-container">
          <Box className="s-home-grid-wrapper">
            <Grid justifyContent={"flex-start"} alignItems="stretch" container spacing={colSpacing} className="s-home-grid">
            {(() => {
                // Kiểm tra quyền xem menu
                const isExpOrSpecialEmp = persType === "EXP" || emp_id === "15050432" || emp_id === "99115447" || emp_id === "10100384" ;
                const isAdminGA = emp_id === "02026154"|| emp_id === "05110243"
                const canViewJobPositionMenu = jobPosition !== null && (Number(jobPosition) <= 180 || Number(jobPosition) === 300);
                
                // Thu thập tất cả các cards sẽ hiển thị
                const visibleCards = [];
                
                optionData.forEach((item) => {
                  // Luôn hiển thị menu 001 và 005
                  if (item.id === "001" || item.id === "005" || item.id === "008") {
                    visibleCards.push(item);
                  }
                  // Menu 002 và 006: hiển thị nếu EXP/special emp
                  else if (item.id === "002" || item.id === "006"|| item.id === "007" ) {
                    if (isExpOrSpecialEmp || isAdminGA) {
                      visibleCards.push(item);
                    }
                  }
                  // Menu 004: hiển thị nếu EXP/special emp hoặc jobPosition thỏa
                  else if (item.id === "004") {
                    if (isExpOrSpecialEmp || canViewJobPositionMenu) {
                      visibleCards.push(item);
                    }
                  }
                });

                // Sắp xếp cards theo sort_order để đảm bảo thứ tự đúng
                visibleCards.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                // Render cards với width cố định và căn giữa
                const result = [];
                const cardCount = visibleCards.length;
                
                // Với 5 cards: layout đặc biệt 3 trên, 2 dưới (căn giữa)
                if (cardCount === 5) {
                  // 3 cards đầu tiên
                  visibleCards.slice(0, 3).forEach((item) => {
                    result.push(
                      <Grid 
                        item 
                        lg="auto"
                        md={6} 
                        xs={12} 
                        key={item.id} 
                        sx={{ 
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          maxWidth: { lg: '400px', md: '100%', xs: '100%' },
                          width: { lg: '400px', md: '100%', xs: '100%' },
                          flex: { lg: '0 0 400px', md: '1 1 auto', xs: '1 1 auto' }
                        }}
                      >
                        <CardPrimary
                          data={item}
                          handleClick={()=>handleNavigate(item.id)}
                        />
                      </Grid>
                    );
                  });
                  
                  // Wrapper để căn giữa 2 cards dưới
                  // Sử dụng Grid item với width 100% và flex để căn giữa nội dung bên trong
                  result.push(
                    <Grid 
                      item 
                      lg={12}
                      md={12} 
                      xs={12} 
                      key="wrapper-5cards-bottom" 
                      sx={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        flex: '0 0 100%',
                        padding: 0,
                        margin: 0
                      }} 
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: { xs: `${colSpacing * 8}px`, md: `${colSpacing * 8}px` },
                        justifyContent: 'center',
                        alignItems: 'stretch',
                        width: '100%',
                        '@media (min-width: 1280px)': {
                          maxWidth: '816px' // 2 cards (800px) + 1 spacing (16px)
                        }
                      }}>
                        {visibleCards.slice(3, 5).map((item) => (
                          <Box
                            key={item.id}
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              maxWidth: { lg: '400px', md: 'calc(50% - 16px)', xs: '100%' },
                              width: { lg: '400px', md: 'calc(50% - 16px)', xs: '100%' },
                              flex: { lg: '0 0 400px', md: '0 0 calc(50% - 16px)', xs: '1 1 auto' }
                            }}
                          >
                            <CardPrimary
                              data={item}
                              handleClick={()=>handleNavigate(item.id)}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  );
                } else {
                  // Các trường hợp khác: render bình thường
                  visibleCards.forEach((item) => {
                    result.push(
                      <Grid 
                        item 
                        lg="auto"
                        md={6} 
                        xs={12} 
                        key={item.id} 
                        sx={{ 
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          maxWidth: { lg: '400px', md: '100%', xs: '100%' },
                          width: { lg: '400px', md: '100%', xs: '100%' },
                          flex: { lg: '0 0 400px', md: '1 1 auto', xs: '1 1 auto' }
                        }}
                      >
                        <CardPrimary
                          data={item}
                          handleClick={()=>handleNavigate(item.id)}
                        />
                      </Grid>
                    );
                  });
                }
                
                return result;
              })()}
            </Grid>
          </Box>
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
