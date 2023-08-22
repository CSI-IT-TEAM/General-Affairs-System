import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PersonIcon from "@mui/icons-material/Person";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { Grid, InputAdornment, TextField, Typography } from "@mui/material";

const ITEM_HEIGHT = 45;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const names = ["IT", "HR", "Modern", "PCC", "RSM"];

const DepartmentSelect = ({
  cValue,
  DeptList,
  handleEvent,
  PassengerChange,
}) => {
  const [deptName, setDeptName] = React.useState([]);
  const [PassengerCount, setPassengerCount] = React.useState(1);
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
    console.log(event.target.value);
    if (event.target.value < 1) {
      if (event.target.value === "") {
        setPassengerCount(event.target.value);
        PassengerChange(event.target.value);
      } else {
        setPassengerCount(1);
        PassengerChange(1);
      }
    } else {
      setPassengerCount(event.target.value);
      PassengerChange(event.target.value);
    }
  };

  return (
    <div>
      <FormControl fullWidth>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <InputLabel id="demo-multiple-checkbox-label">
              Department
            </InputLabel>
            <Select
              fullWidth
              labelId="demo-multiple-checkbox-label"
              id="demo-multiple-checkbox"
              value={cValue}
              onChange={handleChange}
              input={<OutlinedInput label="Department" />}
              // renderValue={(selected) => selected.join(", ")}
              MenuProps={MenuProps}
            >
              {DeptList.map((item) => (
                <MenuItem key={item.DEPT_CD} value={item.DEPT_NM}>
                  <ListItemText primary={item.DEPT_NM} />
                </MenuItem>
              ))}
            </Select>
          </Grid>

          {/* {cValue && (
            <Grid item xs={6}>
              <TextField
                name="PASSSENGER_COUNT"
                type="number"
                // className="b-text-input__desc"
                disabled={false}
                placeholder="Number of passengers"
                color="info"
                value={tValue}
                onChange={handlePassengerChange}
                inputProps={{ min: 0, style: { textAlign: "center" } }}
                // InputProps={
                //   {
                // startAdornment: (
                //   <InputAdornment position="start">
                //     <PeopleAltIcon />
                //   </InputAdornment>
                // ),
                // endAdornment: (
                //   <InputAdornment position="end">
                //     <PeopleAltIcon />
                //   </InputAdornment>
                // ),
                // }
                // }
              />
            </Grid>
          )} */}
        </Grid>
      </FormControl>
    </div>
  );
};

export default DepartmentSelect;
