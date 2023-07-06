import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const names = ["Mr.Shim", "Mr.Nguyên", "Mr.Hoàng", "Mr.Điền", "Mr.Phước"];

const PassengersSelect = ({ cValue, handleEvent, expList,handleClearClick }) => {
  const [personName, setPersonName] = React.useState([]);
 
  const handleChange = (event, obj) => {
    const {
      target: { value },
    } = event;
    setPersonName(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
    handleEvent(event.target.value);
  };

  return (
    <div>
      <FormControl fullWidth>
        <InputLabel id="demo-multiple-checkbox-label">
          Korean Passengers
        </InputLabel>
        <Select
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          multiple
          value={cValue}
          onChange={handleChange}
          input={<OutlinedInput label="Korean Passengers" />}
          //   renderValue={(selected) => selected.join(", ")}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => (
                // <Chip key={value} label={selected[index]} />
                <Chip
                  key={value}
                  label={expList.find((item) => item.EMPID === value).NAME}
                  variant="light"
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
          endAdornment={
            <IconButton
              sx={{ display: personName.length > 0 ? "" : "none" }}
              onClick={handleClearClick}
            >
              <HighlightOffIcon />
            </IconButton>
          }
        >
          {expList !== null &&
            expList.map((item) => (
              <MenuItem key={item.EMPID} value={item.EMPID}>
                <Checkbox checked={cValue.indexOf(item.EMPID) > -1} />
                <ListItemText primary={item.NAME} />
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default PassengersSelect;
