import * as React from "react";
import { TextField, Typography, Link, Box, Stack, Grid } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ButtonPrimary from "../../components/Button/Primary";

import "./SignUp.scss";
import loginImage from "../../assets/images/sign-up.png";

const height = window.innerHeight - 30 + "px";

const SignUp = () => {
  return (
    <>
      <Box
        className="s-layout"
        sx={{
          width: "100%",
          height: height,
        }}
      >
        <Box className="b-box">
        <Box className="s-form">
                <Typography variant="h1" className="p-title">
                  Register Account
                </Typography>
                <Box className="b-thumb">
                <img src={loginImage} alt="Register" loading="lazy" />
              </Box>
                <form>
                  <Stack marginBottom={2}>
                    <Typography variant="h5" className="p-label">
                      User ID
                    </Typography>
                    <TextField
                      id="userID"
                      type="text"
                      className="b-input"
                      placeholder="Type your User ID"
                      color="info"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineOutlinedIcon />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                    />
                  </Stack>
                  <Stack marginBottom={1.5}>
                    <Typography variant="h5" className="p-label">
                      Password
                    </Typography>
                    <TextField
                      id="password"
                      type="password"
                      className="b-input"
                      placeholder="Type your password"
                      fullWidth
                      color="info"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <VisibilityIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                  <Stack marginBottom={1.5}>
                    <Typography variant="h5" className="p-label">
                      Confirm Password
                    </Typography>
                    <TextField
                      id="password"
                      type="password"
                      className="b-input"
                      placeholder="Confirm your password"
                      fullWidth
                      color="info"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <VisibilityIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                  <Grid container justifyContent="flex-end" className="s-bot">
                    <ButtonPrimary title="Register" />
                  </Grid>

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    className="b-bot"
                  >
                    <Typography className="p-info">
                      Already have an account?
                    </Typography>
                    <Link href="#" underline="none">
                      Login now
                    </Link>
                  </Stack>
                </form>
              </Box>
        </Box>
      </Box>
    </>
  );
};

export default SignUp;
