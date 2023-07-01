import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { Typography, Stack } from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { useState } from "react";

const DropOffSelect = ({ handleEvent, DropOffList }) => {
  const [DropOff, setDropOff] = useState("");
  const handleChange = (event, obj) => {
    const {
      target: { value },
    } = event;
    setDropOff(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
    handleEvent(event.target.value);
  };
  return (
    <>
      <Stack sx={{ width: "100%" }}>
        <FormControl fullWidth>
          <Select
            value={DropOff}
            onChange={handleChange}
            sx={{ backgroundColor: "#f8f6f7" }}
          >
            {DropOffList.length > 0 &&
              DropOffList.map((item) => {
                return (
                  <MenuItem key={item.DROP_OFF_CD} value={item.DROP_OFF_CD}>
                    {item.DROP_OFF_NM}
                  </MenuItem>
                );
              })}
          </Select>
        </FormControl>
        {!DropOff.length > 0 && (
          <Typography className="b-validate">
            <HighlightOffIcon sx={{ width: "17px", height: "17px" }} />
            Hãy chọn Drop Off
          </Typography>
        )}
      </Stack>
    </>
  );
};

export default DropOffSelect;
