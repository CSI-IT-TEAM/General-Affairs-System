import React from "react";
import { TextField, Stack, Typography, InputAdornment } from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import FactoryIcon from "@mui/icons-material/Factory";
import { NumericFormat } from "react-number-format";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

const NumericFormatCustom = React.forwardRef(function NumericFormatCustom(
  props,
  ref
) {
  const { onChange, ...other } = props;

  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value,
          },
        });
      }}
      thousandSeparator
      valueIsNumericString
      suffix=" VNĐ"
    />
  );
});

const TextInput = ({
  title,
  placeholder,
  value,
  disable,
  inputProp,
  name = "",
  handleEvent,
  isImportant = false,
  isValidate = true,
  message = "",
  isDefault = false,
}) => {
  return (
    <>
      <Stack
        marginBottom={2}
        direction={{ xs: isDefault ? "row" : "column", sm: "row" }}
        alignItems={{ xs: isDefault ? "center" : "normal", sm: "center" }}
        className="b-text-input"
      >
        {/* <Typography variant="h6" className="b-text-input__title b-italic">
          {title} {isImportant && <span>(*)</span>}
        </Typography> */}
        <Stack sx={{ width: "100%" }}>
          {name === "BUDGET" ? (
            <TextField
              variant="standard"
              label={`${title}`}
              name={name}
              isValidate={isValidate}
              InputProps={{
                inputComponent: NumericFormatCustom,
                endAdornment: (
                  <InputAdornment position="start">
                    <MonetizationOnIcon />
                  </InputAdornment>
                ),
                inputProps: {
                  style: { textAlign: "center" },
                },
              }}
              disabled={disable}
              placeholder={placeholder}
              fullWidth
              value={value}
              onChange={handleEvent}
              sx={{
                ".MuiInputBase-input": {
                  fontSize: "1.5rem !important",
                  fontWeight: "bold",
                  fontFamily: "Poppins !important",
                },
              }}
            />
          ) : (
            <TextField
              variant="standard"
              label={`${title}`}
              name={name}
              isValidate={isValidate}
              inputProps={inputProp}
              // className="b-text-input__desc"
              disabled={disable}
              placeholder={placeholder}
              color="info"
              fullWidth
              value={value}
              onChange={handleEvent}
            />
          )}
          {!isValidate && (
            <Typography className="b-validate">
              <HighlightOffIcon sx={{ width: "17px", height: "17px" }} />
              {message}
            </Typography>
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default TextInput;
