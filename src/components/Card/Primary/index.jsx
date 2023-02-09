import { Box, Card, CardContent, Typography } from "@mui/material";
import ButtonSecondary from "../../Button/Secondary";

import "./CardPrimary.scss";

const CardPrimary = ({ data, handleClick }) => {
    return (
        <>
            <Card className="b-card" onClick={handleClick}>
                <Box
                    className={data.id === "001" ? `b-thumb b-thumb--first` : `b-thumb`}
                    sx={{
                        backgroundColor: data.bgColor,
                    }}
                />
                <Box
                    className={
                        data.id === "001"
                        ? `b-image b-image--first`
                        : data.id === "002"
                        ? `b-image b-image--sub`
                        : `b-image`
                    }
                >
                    <img src={data.thumb} alt={data.title} />
                </Box>
                <CardContent className="b-content">
                    <Typography
                        gutterBottom
                        variant="h5"
                        component="div"
                        className="b-title"
                    >
                        {data.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="b-desc">
                        {data.desc}
                    </Typography>
                </CardContent>
                <Box className="b-bot">
                    <ButtonSecondary title="Order now" />
                </Box>
            </Card>
        </>
    );
};

export default CardPrimary;