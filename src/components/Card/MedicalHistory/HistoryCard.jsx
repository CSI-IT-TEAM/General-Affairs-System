import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import {
  Avatar,
  Box,
  CardActionArea,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
} from "@mui/material";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import StyleIcon from "@mui/icons-material/Style";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import { formatNumber } from "devextreme/localization";

export default function HistoryCard({ item }) {
  return (
    <Card key={item.ROWID} sx={{ width: "100%" }}>
      <CardActionArea>
        {/* <CardMedia
          component="img"
          height="140"
          image="https://picsum.photos/400/200"
          alt="green iguana"
        /> */}
        <CardContent>
          <Stack spacing={1}>
            <Stack>
              <Stack direction={"row"} spacing={2}>
                <Typography
                  sx={{
                    fontWeight: "bolder",
                    fontSize: "20px",
                  }}
                >
                  {item.TREAT_DATE}
                </Typography>
                <Stack direction={"row"} spacing={1} alignItems={"center"}>
                  {/* <Diversity3Icon /> */}
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
                </Stack>
              </Stack>
            </Stack>

            <Divider textAlign="right">
              <Stack spacing={1} direction={"row"}>
                <Typography
                  sx={{
                    padding: "5px",
                    paddingX: "10px",
                    backgroundColor: "#4b50f0",
                    borderRadius: "5px",
                    color: "white",
                    fontSize: "18px",
                  }}
                  variant="h5"
                  color="text.secondary"
                  component={"div"}
                >
                  {formatNumber(item.AMOUNT_QTY)}
                </Typography>
              </Stack>
            </Divider>

            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <LocalHospitalIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  sx={{
                    fontweight: "bold",
                  }}
                  primaryTypographyProps={{ fontSize: "20px" }}
                  secondaryTypographyProps={{ fontSize: "18px" }}
                  primary={`Name: ${item.SERVICE_NAME}`}
                  secondary={`Type: ${item.SERVICE_TYPE}`}
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <StyleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primaryTypographyProps={{
                    padding: "2px",
                    px: "5px",
                    color: "orangered",
                    fontSize: "20px",
                  }}
                  primary={`${item.MEDICAL_NAME}`}
                >
                  {/* <Typography
                    sx={{
                      padding: "5px",
                      backgroundColor: "navy",
                      borderRadius: "5px",
                      color: "white",
                      fontSize: "18px",
                    }}
                    variant="body2"
                    color="text.secondary"
                  >
                    {item.SERVICE_TYPE}
                  </Typography> */}
                </ListItemText>
              </ListItem>
            </List>
            <Divider textAlign="right"></Divider>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
