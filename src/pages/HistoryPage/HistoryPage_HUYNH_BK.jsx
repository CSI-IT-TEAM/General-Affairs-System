import { useState, useEffect } from "react";
import {
    Box,
    Container,
    Table, TableBody, TableHead, TableRow,
    Checkbox
} from "@mui/material";
import { styled } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import { ModalInfo, NoticeCard } from "../../components";
import { useTranslation } from "react-i18next";
import { historyURL } from "../../api";

import "./HistoryPage.scss";
const width = window.innerWidth;
const height =  window.innerHeight - (width <= 479 ? 180 : 230);

const HistoryPage = () => {

    ////Basic Data
    const [data, setData] = useState(null);

    /////// Handle Warning Modal
    const [openInfo, setOpenInfo] = useState(false);
    const handleCloseInfo = () => setOpenInfo(false);

    ////// Cancel Fetch API After Timeout
    const Timeout = (time) => {
        let controller = new AbortController();
        setTimeout(() => controller.abort(), time * 1000);
        return controller;
    };

    const handleDownload = (empID) => {
        fetch(historyURL, {
            method: "POST",
            mode: "cors",
            dataType: "json",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ARG_TYPE: "Q",
                ARG_EMPID: empID, //user name
                OUT_CURSOR: "",
            }),
            signal: Timeout(5).signal,
        }).then((response) => {
            response.json().then(async (result) => {
                if (result && result?.length > 0) {
                    setData(data => result);
                } else {
                    setData(data => null);
                }
            })
        }).catch(() => {
            setOpenInfo(true)
        })
    }

    ///Download On Visible
    useEffect(() => {
        const empData = JSON.parse(sessionStorage.getItem("userData"));
        handleDownload(empData.EMPID);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /////// Translate Lang
    const { t } = useTranslation();

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
            backgroundColor: "#213140",
            color: theme.palette.common.white,
            fontSize: 16,
            fontWeight: 600,
            padding: '8px 0',
        },
        [`&.${tableCellClasses.body}`]: {
            fontSize: 17,
            fontWeight: 700,
            padding: '10px 5px'
        },
    }));

    const StyledTableRow = styled(TableRow)(({ theme }) => ({
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
    }));

    return (
        <>
            <Box className="s-form" style={{ minHeight: height }}>
                <Container>
                    <h3 className="s-form-title">
                        {t("history_bef")} <span>{t("history_aft")}</span>
                    </h3>
                    {data && data !== null && data?.length > 0 &&
                        <Box className="s-table">
                            <Table size="small" aria-label="a dense table" className="b-table" style={{ marginTop: '30px' }} >
                                <TableHead className="b-table-head">
                                    <TableRow >
                                        <StyledTableCell width="20%" align="center">{t('title_request')}</StyledTableCell>
                                        <StyledTableCell width="20%" align="center">{t('title_go_date')}</StyledTableCell>
                                        <StyledTableCell width="20%" align="center">{t('title_go_time')}</StyledTableCell>
                                        <StyledTableCell width="25%" align="center">{t('title_depart')}</StyledTableCell>
                                        <StyledTableCell width="25%" align="center">{t('title_arrival')}</StyledTableCell>
                                        <StyledTableCell width="10%" align="center">{t('title_pass_no')}</StyledTableCell>
                                        <StyledTableCell width="20%" align="center">{t('title_confirm')}</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody className="b-table-body">
                                    {data.map((item, index) => {
                                        return (
                                            <StyledTableRow key={index}>

                                                <StyledTableCell width="20%" align="center" className="b-table-cell">
                                                    <Box className="b-table-item__title">
                                                        {item.REQ_DATE}
                                                    </Box>
                                                </StyledTableCell>
                                                <StyledTableCell width="20%" align="center" className="b-table-cell">
                                                    <Box className="b-table-item__title">
                                                        {item.GO_DATE}
                                                    </Box>
                                                </StyledTableCell>
                                                <StyledTableCell width="20%" align="center" className="b-table-cell">
                                                    <Box className="b-table-item__title">
                                                        {item.GO_TIME}
                                                    </Box>
                                                </StyledTableCell>
                                                <StyledTableCell width="25%" align="center" className="b-table-cell">
                                                    <Box className="b-table-item__title">
                                                        {item.DEPART}
                                                    </Box>
                                                </StyledTableCell>
                                                <StyledTableCell width="25%" align="center" className="b-table-cell">
                                                    <Box className="b-table-item__title">
                                                        {item.ARRIVAL}
                                                    </Box>
                                                </StyledTableCell>
                                                <StyledTableCell width="10%" align="center" className="b-table-cell">
                                                    <Box className="b-table-item__title">
                                                        {item.MAN_QTY}
                                                    </Box>
                                                </StyledTableCell>
                                                <StyledTableCell width="20%" align="center" className="b-table-cell">
                                                    <Checkbox
                                                        className='b-table-item__checkbox'
                                                        checked={item.CFM_YN === "Y"}
                                                        sx={{ '& .MuiSvgIcon-root': { fontSize: 40 } }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    }
                    {data === null && <NoticeCard />}
                </Container>
            </Box>
            <ModalInfo open={openInfo} handleClose={handleCloseInfo} type="connect-failed" />
        </>
    )
}

export default HistoryPage;