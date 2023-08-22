import { useState } from "react";

import DateModal from "../DateModal/Desktop";
import DateModalMobile from "../DateModal/Mobile";
import TimeModal from "../TimeModal/Desktop";
import TimeModalMobile from "../TimeModal/Mobile";

import getDevice from "../../function/getDevice";

const ResponsiveDateTime = ({
  type,
  title,
  placeholder,
  name,
  cValue,
  handleChange,
  isValidate,
  validMessage,
}) => {
  // eslint-disable-next-line no-unused-vars
  const [_isMobile, setIsMobile] = useState(getDevice());
  if (type === "DATE") {
    return (
      <DateModalMobile
        title={title}
        placeholder={placeholder}
        name={name}
        cValue={cValue}
        handleEvent={handleChange}
        isValidate={isValidate}
        message={validMessage}
      />
    );
  } else if (type === "TIME") {
    return (
      <TimeModalMobile
        title={title}
        placeholder={placeholder}
        name={name}
        cValue={cValue}
        handleEvent={handleChange}
        isValidate={isValidate}
        message={validMessage}
      />
    );
  }
  // if(_isMobile){
  //     if(type === "DATE"){
  //         return(
  //             <DateModalMobile
  //                 title={title}
  //                 placeholder={placeholder}
  //                 name={name}
  //                 cValue={cValue}
  //                 handleEvent={handleChange}
  //                 isValidate={isValidate}
  //                 message={validMessage} />
  //         )
  //     }
  //     else if(type === "TIME"){
  //         return(
  //             <TimeModalMobile
  //                 title={title}
  //                 placeholder={placeholder}
  //                 name={name}
  //                 cValue={cValue}
  //                 handleEvent={handleChange}
  //                 isValidate={isValidate}
  //                 message={validMessage} />
  //         )
  //     }
  // }
  // else{
  //     if(type === "DATE"){
  //         return(
  //             <DateModal
  //                 title={title}
  //                 placeholder={placeholder}
  //                 name={name}
  //                 cValue={cValue}
  //                 handleEvent={handleChange}
  //                 isValidate={isValidate}
  //                 message={validMessage} />
  //         )
  //     }
  //     else if(type === "TIME"){
  //         return(
  //             <TimeModal
  //                 title={title}
  //                 placeholder={placeholder}
  //                 name={name}
  //                 cValue={cValue}
  //                 handleEvent={handleChange}
  //                 isValidate={isValidate}
  //                 message={validMessage} />
  //         )
  //     }
  // }
};

export default ResponsiveDateTime;
