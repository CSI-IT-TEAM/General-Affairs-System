import { Typography } from "@mui/material";
import React from "react";
export default function TransInput() {
  const Trans = ({ targetText }) => {
    // https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=welcome
    fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=welcome`,
      {
        method: "POST",
        mode: "cors",
        dataType: "json",
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then((response) => {
        console.log(response);
    });
  };

  return <Typography></Typography>;
}
