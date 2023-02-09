import { Typography } from "@mui/material";

import "./FormTitle.scss";

const FormTitle = ({ order, title }) => {

    return (
        <>
            <Typography variant="h5" className="p-sub-title">
                <span>{order}</span>{title}
            </Typography>
        </>
    );
}

export default FormTitle;