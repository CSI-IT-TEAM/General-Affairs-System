import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { InputAdornment, TextField, Typography } from "@mui/material";

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

const names = ["IT", "HR", "Modern", "PCC", "RSM"];

const DepartmentSelect = ({ handleEvent, PassengerChange }) => {
  const [deptName, setDeptName] = React.useState([]);
  const [PassengerCount, setPassengerCount] = React.useState(null);
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setDeptName(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
    handleEvent(event.target.value);
  };

  const handlePassengerChange = (event) => {
    setPassengerCount(event.target.value);
    PassengerChange(event.target.value);
  };

  return (
    <div>
      <FormControl fullWidth>
        <InputLabel id="demo-multiple-checkbox-label">Department</InputLabel>
        <Select
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          value={deptName}
          onChange={handleChange}
          input={<OutlinedInput label="Department" />}
          renderValue={(selected) => selected.join(", ")}
          MenuProps={MenuProps}
        >
          {names.map((name) => (
            <MenuItem key={name} value={name}>
              <ListItemText primary={name} />
            </MenuItem>
          ))}
        </Select>

        {deptName.length > 0 && (
          <TextField
            name="PASSSENGER_COUNT"
            className="b-text-input__desc b-text-input__desc--sub"
            disabled={false}
            placeholder="Number of passengers"
            color="info"
            fullWidth 
            value={PassengerCount}
            onChange={handlePassengerChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <PlaceOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
      </FormControl>
    </div>
  );
};

export default DepartmentSelect;
