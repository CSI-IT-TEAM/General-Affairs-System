import {
  Typography,
  Box,
  Container,
  Avatar,
  IconButton,
  Menu,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import i18next from "i18next";

import avatarImage from "../../assets/images/avatar.png";
import ModalLogout from "../Modal/Logout";
import { langData } from "../../data";
import { useTranslation } from "react-i18next";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { t } = useTranslation();

  let settings = [];
  if (location.pathname ==="/"){
    settings = [
    
      { title: t("title_change_password"), route: "/user/passwordchange" },
      { title: t("title_log_out"), route: "" },
    ];
  }else if (location.pathname === "/request/car"){
    settings = [
      { title: t("title_history"), route: "/user/history" },
      { title: t("title_change_password"), route: "/user/passwordchange" },
      { title: t("title_log_out"), route: "" },
    ];
  }else if (location.pathname === "/fee/medical"){
    settings = [
      { title: t("title_medical_history"), route: "/fee/medical/history" },
      { title: t("title_change_password"), route: "/user/passwordchange" },
      { title: t("title_log_out"), route: "" },
    ];
  }
  else if (location.pathname === "/fee/medical/history"){
    settings = [
      { title: t("title_medical"), route: "/fee/medical" },
      { title: t("title_change_password"), route: "/user/passwordchange" },
      { title: t("title_log_out"), route: "" },
    ];
  }
  else{
    settings = [
      // { title: t("title_history"), route: "/user/history" },
      { title: t("title_change_password"), route: "/user/passwordchange" },
      { title: t("title_log_out"), route: "" },
    ];
  }
   
  ///// Set Default language
  const i18_Value =
    i18next.language !== null &&
    i18next.language !== undefined &&
    i18next.language !== ""
      ? i18next.language
      : "en";
  const [lang, setLang] = useState(i18_Value);
  const handleChange = (event: SelectChangeEvent) => {
    i18next.changeLanguage(event.target.value);
    setLang(event.target.value);
  };

  const getLangImage = () => {
    const value = langData.filter((item) => item.value === lang);
    return value[0].thumb;
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const langImage = getLangImage();

  /////// Check user Thumb
  const userImage =
    sessionStorage.getItem("userImg") === null ||
    sessionStorage.getItem("userImg").length === 0
      ? avatarImage
      : sessionStorage.getItem("userImg");

  const handleToggle = () => {
    setAnchorElUser(null);
    setOpen((open) => !open);
  };

  const handleLogOut = () => {
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("userImg");
    navigate("/signin");
  };

  const handleNavigate = (url) => {
    navigate(url);
  };

  return (
    <>
      <Box className="s-header">
        <Container className="d-flex">
          <Box className="s-header-text" onClick={() => handleNavigate("/")}>
            <Typography variant="h5" component="div" className="s-header-logo">
              CSG
            </Typography>
            <span>
              <Typography
                variant="h1"
                className="s-header-title s-header-title__top"
              >
                General Affairs
              </Typography>
              <Typography
                variant="h2"
                className="s-header-title s-header-title__bot"
              >
                System
              </Typography>
            </span>
          </Box>
          <Box className="d-flex p-relative">
            <Box className="s-language d-flex">
              <Box className="s-language__thumb">
                <img src={langImage} alt="Language" />
              </Box>
              <FormControl
                sx={{ m: 1 }}
                size="small"
                variant="standard"
                className="s-language__select"
              >
                <Select value={lang} onChange={handleChange}>
                  {langData.map((item) => {
                    return (
                      <MenuItem
                        key={item.value}
                        value={item.value}
                        className="s-lang__item"
                      >
                        {item.title}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar
                alt="avatar"
                src={userImage}
                className="s-avatar"
                //onClick={handleToggle}
              />
            </IconButton>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) =>
                setting.route ? (
                  <MenuItem
                    key={setting.title}
                    component={Link}
                    to={setting.route}
                    onClick={handleCloseUserMenu}
                  >
                    <Typography textAlign="center">{setting.title}</Typography>
                  </MenuItem>
                ) : (
                  <MenuItem key={setting.title} onClick={handleToggle}>
                    <Typography textAlign="center">{setting.title}</Typography>
                  </MenuItem>
                )
              )}
            </Menu>
          </Box>
        </Container>
      </Box>
      <ModalLogout
        open={open}
        handleClose={handleToggle}
        handleLogOut={handleLogOut}
      />
    </>
  );
};

export default Header;
