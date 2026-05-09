import React, { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import { Building2, Lock, Check } from 'lucide-react';
import { saveCanteenRegistration, getCanteenRegistration } from '../../api/canteenAttendance';

const factories = [
    { value: 'VJ1', label: 'VJ1', code: '2110' },
    { value: 'VJ2', label: 'VJ2', code: '2120' },
    { value: 'VJ3', label: 'VJ3', code: '2210' },
];

const mealTemplates = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
];

const buildNextSevenDays = (weekOffset = 0) => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        const dateString = date.toISOString().slice(0, 10);

        return mealTemplates.map((meal) => ({
            id: `${dateString}-${meal.key}`,
            date: dateString,
            mealKey: meal.key,
            mealLabel: meal.label,
            selected: true,
            breakfastNote: '',
            factoryCode: '',
            visitorCnt: 1,
        }));
    }).flat();
};

const CanteenAttendanceRegistration = () => {
    const [activeTab, setActiveTab] = useState('self');
    const [userPersType, setUserPersType] = useState('');
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedDateRows, setSelectedDateRows] = useState(() => buildNextSevenDays(0));
    const [allWeekData, setAllWeekData] = useState({ 0: { self: buildNextSevenDays(0), visitor: buildNextSevenDays(0) } });
    const allWeekDataRef = useRef({ 0: { self: buildNextSevenDays(0), visitor: buildNextSevenDays(0) } });
    const [visitorDepartment, setVisitorDepartment] = useState('');
    const visitorDeptRef = useRef('');
    const [deptList, setDeptList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [justRegistered, setJustRegistered] = useState(false);
    const [originalData, setOriginalData] = useState([]);
    // Separate state for SELF data - not affected by visitor operations
    const [selfWeekData, setSelfWeekData] = useState({});

    const showSelfTab = userPersType !== 'EMP';

    const formik = useFormik({
        initialValues: {
            visitorDepartment: '',
        },
        validate: () => {
            return {};
        },
        onSubmit: () => {
            if (canRegister && !isSubmitting) {
                setShowConfirmDialog(true);
            }
        },
        enableReinitialize: false,
    });

    // Handle visitor department change
    const handleVisitorDepartmentChange = (value) => {
        setJustRegistered(false);
        setVisitorDepartment(value);
        visitorDeptRef.current = value;
        formik.setFieldValue('visitorDepartment', value);

        // Clear visitor data for current week to avoid showing stale data
        setAllWeekData((prev) => ({
            ...prev,
            [weekOffset]: {
                ...prev[weekOffset],
                visitor: buildNextSevenDays(weekOffset),
            },
        }));

        // Clear current selected rows if on visitor tab
        if (activeTab === 'visitor') {
            setSelectedDateRows(buildNextSevenDays(weekOffset));
            setOriginalData(JSON.parse(JSON.stringify(buildNextSevenDays(weekOffset))));
        }
    };



    useEffect(() => {
        try {
            const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (!rawUserData) {
                return;
            }

            const parsedUserData = JSON.parse(rawUserData);
            setUserPersType(parsedUserData?.PERS_TYPE || '');
        } catch (error) {
            console.error('Failed to parse userData from localStorage:', error);
        }
    }, []);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('DeptList');
            if (raw) {
                const parsed = JSON.parse(raw);
                setDeptList(Array.isArray(parsed) ? parsed : []);
            }
        } catch (error) {
            console.error('Failed to load DeptList:', error);
        }
    }, []);

    useEffect(() => {
        allWeekDataRef.current = allWeekData;
    }, [allWeekData]);

    // Fetch registration data for self tab on initial load
    useEffect(() => {
        const fetchSelfData = async () => {
            const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (!rawUserData) return;
            const parsedUserData = JSON.parse(rawUserData);
            const empNo = parsedUserData?.EMPID || '';
            if (empNo) {
                // Fetch self registration data with null department
                setIsLoading(true);
                try {
                    const today = new Date();
                    today.setDate(today.getDate() + weekOffset * 7);
                    const startDate = new Date(today);
                    startDate.setDate(today.getDate());
                    const endDate = new Date(today);
                    endDate.setDate(today.getDate() + 6);
                    const fromDate = startDate.toISOString().slice(0, 10);
                    const toDate = endDate.toISOString().slice(0, 10);

                    const result = await getCanteenRegistration({
                        argEmpNo: empNo,
                        argRegType: 'SELF',
                        argFromDate: fromDate,
                        argToDate: toDate,
                        argVisitorDept: null,
                    });

                    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                        const selfRegMap = {};

                        result.data.forEach((item) => {
                            // Only process SELF records
                            if (item.REG_TYPE !== 'SELF') return;

                            let mealKey = '';
                            switch (item.MEAL_TYPE) {
                                case 'LUNCH': mealKey = 'lunch'; break;
                                case 'BREAKFAST': mealKey = 'breakfast'; break;
                                case 'DINNER': mealKey = 'dinner'; break;
                                default: mealKey = item.MEAL_TYPE?.toLowerCase() || '';
                            }
                            const key = `${item.REG_DATE}-${mealKey}`;
                            selfRegMap[key] = {
                                factoryCode: item.FACTORY_CODE,
                                breakfastNote: item.MEAL_NOTE || '',
                                visitorCnt: item.VISITOR_CNT || 1,
                            };
                        });

                        // Build rows with SELF data
                        const weekSelfRows = buildNextSevenDays(weekOffset).map((row) => {
                            const key = `${row.date}-${row.mealKey}`;
                            const regData = selfRegMap[key];
                            if (regData) {
                                return { ...row, ...regData };
                            }
                            return row;
                        });

                        // Store to separate SELF data store
                        selfDataRef.current = { [weekOffset]: weekSelfRows };
                        setSelfWeekData({ [weekOffset]: weekSelfRows });

                        // If on self tab, update UI
                        if (activeTab === 'self') {
                            setSelectedDateRows(weekSelfRows);
                            setOriginalData(JSON.parse(JSON.stringify(weekSelfRows)));
                        }
                    } else {
                        // No data - store empty rows
                        const emptyRows = buildNextSevenDays(weekOffset);
                        selfDataRef.current = { [weekOffset]: emptyRows };
                        setSelfWeekData({ [weekOffset]: emptyRows });
                        if (activeTab === 'self') {
                            setSelectedDateRows(emptyRows);
                            setOriginalData(JSON.parse(JSON.stringify(emptyRows)));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching self registration data:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchSelfData();
    }, []);

    // Sync selfDataRef when selfWeekData changes
    useEffect(() => {
        selfDataRef.current = selfWeekData;
    }, [selfWeekData]);

    // Fetch registration data for visitor tab based on selected department
    useEffect(() => {
        const fetchVisitorData = async () => {
            if (activeTab !== 'visitor') {
                return;
            }

            const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (!rawUserData) return;
            const parsedUserData = JSON.parse(rawUserData);
            const empNo = parsedUserData?.EMPID || '';
            if (!empNo) return;

            // If no department selected, set default from deptList
            let deptToUse = visitorDepartment;
            if (!deptToUse && deptList.length > 0) {
                deptToUse = deptList[0].DEPT_CODE || deptList[0].value || '';
                if (deptToUse) {
                    setVisitorDepartment(deptToUse);
                    formik.setFieldValue('visitorDepartment', deptToUse);
                }
            }

            if (!deptToUse) {
                const emptyRows = buildNextSevenDays(weekOffset);
                setAllWeekData((prev) => ({
                    ...prev,
                    [weekOffset]: {
                        ...(prev[weekOffset] || {}),
                        visitor: emptyRows,
                    },
                }));
                setSelectedDateRows(emptyRows);
                setOriginalData(JSON.parse(JSON.stringify(emptyRows)));
                isVisitorDataReadyRef.current = true;
                return;
            }

            // Fetch visitor data with department filter
            setIsLoading(true);
            try {
                const today = new Date();
                today.setDate(today.getDate() + weekOffset * 7);
                const startDate = new Date(today);
                startDate.setDate(today.getDate());
                const endDate = new Date(today);
                endDate.setDate(today.getDate() + 6);
                const fromDate = startDate.toISOString().slice(0, 10);
                const toDate = endDate.toISOString().slice(0, 10);

                const result = await getCanteenRegistration({
                    argEmpNo: empNo,
                    argRegType: 'VISITOR',
                    argFromDate: fromDate,
                    argToDate: toDate,
                    argVisitorDept: deptToUse,
                });

                if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                    const visitorRegMap = {};

                    result.data.forEach((item) => {
                        if (item.REG_TYPE !== 'VISITOR') return;
                        if (item.VISITOR_DEPT !== deptToUse) return;

                        let mealKey = '';
                        switch (item.MEAL_TYPE) {
                            case 'LUNCH': mealKey = 'lunch'; break;
                            case 'BREAKFAST': mealKey = 'breakfast'; break;
                            case 'DINNER': mealKey = 'dinner'; break;
                            default: mealKey = item.MEAL_TYPE?.toLowerCase() || '';
                        }
                        const key = `${item.REG_DATE}-${mealKey}`;
                        visitorRegMap[key] = {
                            factoryCode: item.FACTORY_CODE,
                            breakfastNote: item.MEAL_NOTE || '',
                            visitorCnt: item.VISITOR_CNT || 1,
                        };
                    });

                    // Build rows with VISITOR data
                    const weekVisitorRows = buildNextSevenDays(weekOffset).map((row) => {
                        const key = `${row.date}-${row.mealKey}`;
                        const regData = visitorRegMap[key];
                        if (regData) {
                            return { ...row, ...regData };
                        }
                        return row;
                    });

                    // Store to visitor data store
                    setAllWeekData((prev) => ({
                        ...prev,
                        [weekOffset]: {
                            ...(prev[weekOffset] || {}),
                            visitor: weekVisitorRows,
                        },
                    }));
                    isVisitorDataReadyRef.current = true;

                    // Update UI
                    setSelectedDateRows(weekVisitorRows);
                    setOriginalData(JSON.parse(JSON.stringify(weekVisitorRows)));
                } else {
                    // No data - show empty visitor rows
                    const emptyRows = buildNextSevenDays(weekOffset);
                    setAllWeekData((prev) => ({
                        ...prev,
                        [weekOffset]: {
                            ...(prev[weekOffset] || {}),
                            visitor: emptyRows,
                        },
                    }));
                    isVisitorDataReadyRef.current = true;
                    setSelectedDateRows(emptyRows);
                    setOriginalData(JSON.parse(JSON.stringify(emptyRows)));
                }
            } catch (error) {
                console.error('Error fetching visitor data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVisitorData();
    }, [activeTab, deptList, visitorDepartment, weekOffset]);

    useEffect(() => {
        if (!showSelfTab && activeTab === 'self') {
            setActiveTab('visitor');
        }
    }, [showSelfTab, activeTab]);

    const prevActiveTabRef = useRef(activeTab);
    const isFirstLoadRef = useRef(true);
    const isVisitorDataReadyRef = useRef(false);
    const isFetchingVisitorDataRef = useRef(false);
    // Separate ref to store SELF data independently from allWeekData
    const selfDataRef = useRef({});

    // Clear visitor data on mount - but don't touch self data
    useEffect(() => {
        setAllWeekData({});
        isVisitorDataReadyRef.current = false;
    }, []);

    useEffect(() => {
        const prevTab = prevActiveTabRef.current;
        const prevRows = selectedDateRows;

        // On first load, don't use cached data - let fetch functions handle it
        if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
            prevActiveTabRef.current = activeTab;
            return;
        }

        // Save current tab data before switching
        if (prevTab !== activeTab && prevTab) {
            if (prevTab === 'self') {
                // Save self data to selfWeekData
                setSelfWeekData((prev) => ({
                    ...prev,
                    [weekOffset]: prevRows,
                }));
            } else if (prevTab === 'visitor') {
                // Save visitor data to allWeekData
                setAllWeekData((prevAll) => ({
                    ...prevAll,
                    [weekOffset]: {
                        ...(prevAll[weekOffset] || {}),
                        visitor: prevRows,
                    },
                }));
            }
            // Reset justRegistered when switching tabs
            setJustRegistered(false);
        }

        // Restore data for the new active tab
        if (activeTab === 'self') {
            const savedSelfData = selfDataRef.current[weekOffset];
            if (savedSelfData) {
                setSelectedDateRows(savedSelfData);
                setOriginalData(JSON.parse(JSON.stringify(savedSelfData)));
            } else {
                // No self data yet - show empty rows and fetch
                const emptyRows = buildNextSevenDays(weekOffset);
                setSelectedDateRows(emptyRows);
                setOriginalData(JSON.parse(JSON.stringify(emptyRows)));
            }
        } else if (activeTab === 'visitor') {
            const savedVisitorData = allWeekData[weekOffset]?.visitor;
            if (isVisitorDataReadyRef.current && savedVisitorData) {
                setSelectedDateRows(savedVisitorData);
                setOriginalData(JSON.parse(JSON.stringify(savedVisitorData)));
            } else {
                // Not yet fetched or no data - show empty rows
                const emptyRows = buildNextSevenDays(weekOffset);
                setSelectedDateRows(emptyRows);
                setOriginalData(JSON.parse(JSON.stringify(emptyRows)));
            }
        }

        prevActiveTabRef.current = activeTab;
    }, [activeTab]);

    const groupedRowsByDate = selectedDateRows.reduce((acc, row) => {
        if (!acc[row.date]) {
            acc[row.date] = [];
        }
        acc[row.date].push(row);
        return acc;
    }, {});

    // Check if registration is allowed based on current time and meal type
    // Rules:
    // - Past dates: Fully locked (disabled)
    // - Today: Locked based on time rules:
    //   - After 07:30 AM: Cannot register for Lunch
    //   - After 12:00 PM: Cannot register for Breakfast
    //   - After 04:30 PM: Cannot register for Dinner
    const isRegistrationDisabled = (rowDate, mealKey) => {
        const today = new Date().toISOString().slice(0, 10);
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Past dates are always locked
        if (rowDate < today) return true;

        // Today: check time-based rules
        if (rowDate === today) {
            switch (mealKey) {
                case 'lunch': // Lunch
                    return currentTimeInMinutes >= 12 * 60 + 30; // After 12:30
                case 'breakfast':
                    return currentTimeInMinutes >= 7 * 60; // After 7:30
                case 'dinner':
                    return currentTimeInMinutes >= 16 * 60 + 30; // After 16:30
                default:
                    return false;
            }
        }

        // Future dates: allow registration
        return false;
    };

    const handleRowFactoryChange = (date, factoryCode, rowId, mealKey) => {
        if (isRegistrationDisabled(date, mealKey)) return;

        setJustRegistered(false);
        setSelectedDateRows((prev) =>
            prev.map((row) =>
                row.id === rowId && row.date === date
                    ? {
                        ...row,
                        factoryCode: row.factoryCode === factoryCode ? '' : factoryCode,
                    }
                    : row,
            ),
        );
    };

    const handleBreakfastNoteChange = (date, note, rowId) => {
        setJustRegistered(false);
        setSelectedDateRows((prev) =>
            prev.map((row) =>
                row.id === rowId && row.date === date
                    ? {
                        ...row,
                        breakfastNote: note,
                    }
                    : row,
            ),
        );
    };

    const handleVisitorCntChange = (date, visitorCnt, rowId, mealKey) => {
        if (isRegistrationDisabled(date, mealKey)) return;
        const cnt = Number(visitorCnt);
        if (isNaN(cnt) || cnt < 0) return;
        setJustRegistered(false);
        setSelectedDateRows((prev) =>
            prev.map((row) =>
                row.id === rowId && row.date === date
                    ? {
                        ...row,
                        visitorCnt: cnt,
                    }
                    : row,
            ),
        );
    };

    // Fetch registration data from API and apply to rows (used after save or cancel)
    const fetchAndApplyRegistrationData = async (empNo, offset = weekOffset) => {
        setIsLoading(true);
        try {
            const today = new Date();
            today.setDate(today.getDate() + offset * 7);
            const startDate = new Date(today);
            startDate.setDate(today.getDate());
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 6);
            const fromDate = startDate.toISOString().slice(0, 10);
            const toDate = endDate.toISOString().slice(0, 10);

            // Fetch SELF data
            const selfResult = await getCanteenRegistration({
                argEmpNo: empNo,
                argRegType: 'SELF',
                argFromDate: fromDate,
                argToDate: toDate,
                argVisitorDept: null,
            });

            // Fetch VISITOR data with current department
            const currentDept = visitorDepartment || '';
            const visitorResult = await getCanteenRegistration({
                argEmpNo: empNo,
                argRegType: 'VISITOR',
                argFromDate: fromDate,
                argToDate: toDate,
                argVisitorDept: currentDept || null,
            });

            const selfRegMap = {};
            const visitorRegMap = {};

            // Process SELF data
            if (selfResult.success && Array.isArray(selfResult.data)) {
                selfResult.data.forEach((item) => {
                    let mealKey = '';
                    switch (item.MEAL_TYPE) {
                        case 'LUNCH': mealKey = 'lunch'; break;
                        case 'BREAKFAST': mealKey = 'breakfast'; break;
                        case 'DINNER': mealKey = 'dinner'; break;
                        default: mealKey = item.MEAL_TYPE?.toLowerCase() || '';
                    }
                    const key = `${item.REG_DATE}-${mealKey}`;
                    selfRegMap[key] = {
                        factoryCode: item.FACTORY_CODE,
                        breakfastNote: item.MEAL_NOTE || '',
                        visitorCnt: item.VISITOR_CNT || 1,
                    };
                });
            }

            // Process VISITOR data
            if (visitorResult.success && Array.isArray(visitorResult.data)) {
                visitorResult.data.forEach((item) => {
                    let mealKey = '';
                    switch (item.MEAL_TYPE) {
                        case 'LUNCH': mealKey = 'lunch'; break;
                        case 'BREAKFAST': mealKey = 'breakfast'; break;
                        case 'DINNER': mealKey = 'dinner'; break;
                        default: mealKey = item.MEAL_TYPE?.toLowerCase() || '';
                    }
                    const key = `${item.REG_DATE}-${mealKey}`;
                    visitorRegMap[key] = {
                        factoryCode: item.FACTORY_CODE,
                        breakfastNote: item.MEAL_NOTE || '',
                        visitorCnt: item.VISITOR_CNT || 1,
                    };
                });
            }

            // Build SELF rows
            const selfRows = buildNextSevenDays(offset).map((row) => {
                const key = `${row.date}-${row.mealKey}`;
                const regData = selfRegMap[key];
                return regData ? { ...row, ...regData } : row;
            });

            // Build VISITOR rows
            const visitorRows = buildNextSevenDays(offset).map((row) => {
                const key = `${row.date}-${row.mealKey}`;
                const regData = visitorRegMap[key];
                return regData ? { ...row, ...regData } : row;
            });

            // Update self data store
            selfDataRef.current = { ...selfDataRef.current, [offset]: selfRows };
            setSelfWeekData((prev) => ({ ...prev, [offset]: selfRows }));

            // Update visitor data store
            setAllWeekData((prev) => ({
                ...prev,
                [offset]: {
                    ...(prev[offset] || {}),
                    visitor: visitorRows,
                },
            }));

            // Update UI based on current tab
            if (activeTab === 'self') {
                setSelectedDateRows(selfRows);
                setOriginalData(JSON.parse(JSON.stringify(selfRows)));
            } else {
                setSelectedDateRows(visitorRows);
                setOriginalData(JSON.parse(JSON.stringify(visitorRows)));
            }

            isVisitorDataReadyRef.current = true;
        } catch (error) {
            console.error('Error fetching registration data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch registration data for a specific week (used during navigation)
    const fetchRegistrationDataForWeek = async (empNo, offset, filterDept = null) => {
        setIsLoading(true);
        try {
            const today = new Date();
            today.setDate(today.getDate() + offset * 7);
            const startDate = new Date(today);
            startDate.setDate(today.getDate());
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 6);
            const fromDate = startDate.toISOString().slice(0, 10);
            const toDate = endDate.toISOString().slice(0, 10);

            const result = await getCanteenRegistration({
                argEmpNo: empNo,
                argRegType: filterDept === null ? 'SELF' : 'VISITOR',
                argFromDate: fromDate,
                argToDate: toDate,
                argVisitorDept: filterDept,
            });

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                // If filterDept is null, this is a SELF fetch - only update self data
                if (filterDept === null) {
                    const selfRegMap = {};

                    result.data.forEach((item) => {
                        // Only process SELF records
                        if (item.REG_TYPE !== 'SELF') return;

                        let mealKey = '';
                        switch (item.MEAL_TYPE) {
                            case 'LUNCH': mealKey = 'lunch'; break;
                            case 'BREAKFAST': mealKey = 'breakfast'; break;
                            case 'DINNER': mealKey = 'dinner'; break;
                            default: mealKey = item.MEAL_TYPE?.toLowerCase() || '';
                        }
                        const key = `${item.REG_DATE}-${mealKey}`;
                        selfRegMap[key] = {
                            factoryCode: item.FACTORY_CODE,
                            breakfastNote: item.MEAL_NOTE || '',
                            visitorCnt: item.VISITOR_CNT || 1,
                        };
                    });

                    const weekSelfRows = buildNextSevenDays(offset).map((row) => {
                        const key = `${row.date}-${row.mealKey}`;
                        const regData = selfRegMap[key];
                        if (regData) {
                            return { ...row, ...regData };
                        }
                        return row;
                    });

                    // Update self data store
                    selfDataRef.current = { ...selfDataRef.current, [offset]: weekSelfRows };
                    setSelfWeekData((prev) => ({ ...prev, [offset]: weekSelfRows }));

                    // If on self tab and current week, update UI
                    if (offset === weekOffset && activeTab === 'self') {
                        setSelectedDateRows(weekSelfRows);
                        setOriginalData(JSON.parse(JSON.stringify(weekSelfRows)));
                    }
                } else {
                    // filterDept has value - this is a VISITOR fetch
                    const visitorRegMap = {};

                    result.data.forEach((item) => {
                        // Only process VISITOR records that match the department
                        if (item.REG_TYPE !== 'VISITOR') return;
                        if (item.VISITOR_DEPT !== filterDept) return;

                        let mealKey = '';
                        switch (item.MEAL_TYPE) {
                            case 'LUNCH': mealKey = 'lunch'; break;
                            case 'BREAKFAST': mealKey = 'breakfast'; break;
                            case 'DINNER': mealKey = 'dinner'; break;
                            default: mealKey = item.MEAL_TYPE?.toLowerCase() || '';
                        }
                        const key = `${item.REG_DATE}-${mealKey}`;
                        visitorRegMap[key] = {
                            factoryCode: item.FACTORY_CODE,
                            breakfastNote: item.MEAL_NOTE || '',
                            visitorCnt: item.VISITOR_CNT || 1,
                        };
                    });

                    const weekVisitorRows = buildNextSevenDays(offset).map((row) => {
                        const key = `${row.date}-${row.mealKey}`;
                        const regData = visitorRegMap[key];
                        if (regData) {
                            return { ...row, ...regData };
                        }
                        return row;
                    });

                    // Update visitor data store only (don't touch self data)
                    setAllWeekData((prev) => ({
                        ...prev,
                        [offset]: {
                            ...(prev[offset] || {}),
                            visitor: weekVisitorRows,
                        },
                    }));

                    // Mark visitor data as ready
                    if (offset === weekOffset) {
                        isVisitorDataReadyRef.current = true;
                    }

                    // If on visitor tab and current week, update UI
                    if (offset === weekOffset && activeTab === 'visitor') {
                        setSelectedDateRows(weekVisitorRows);
                        setOriginalData(JSON.parse(JSON.stringify(weekVisitorRows)));
                    }
                }
            } else {
                // No data from API
                if (filterDept === null) {
                    // Self - store empty rows
                    const emptyRows = buildNextSevenDays(offset);
                    selfDataRef.current = { ...selfDataRef.current, [offset]: emptyRows };
                    setSelfWeekData((prev) => ({ ...prev, [offset]: emptyRows }));
                    if (offset === weekOffset && activeTab === 'self') {
                        setSelectedDateRows(emptyRows);
                        setOriginalData(JSON.parse(JSON.stringify(emptyRows)));
                    }
                } else {
                    // Visitor - store empty rows
                    const emptyRows = buildNextSevenDays(offset);
                    setAllWeekData((prev) => ({
                        ...prev,
                        [offset]: {
                            ...(prev[offset] || {}),
                            visitor: emptyRows,
                        },
                    }));
                    if (offset === weekOffset) {
                        isVisitorDataReadyRef.current = true;
                    }
                    if (offset === weekOffset && activeTab === 'visitor') {
                        setSelectedDateRows(emptyRows);
                        setOriginalData(JSON.parse(JSON.stringify(emptyRows)));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching registration data for week:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to compare if current data differs from original data
    const hasDataChangedFromOriginal = () => {
        // If no original data (first time), check if there's any canteen selected
        if (originalData.length === 0) {
            return selectedDateRows.some((row) => Boolean(row.factoryCode));
        }

        const hasRowChanges = selectedDateRows.some((currentRow) => {
            const originalRow = originalData.find(
                (orig) => orig.id === currentRow.id
            );
            if (!originalRow) return false;

            return (
                currentRow.factoryCode !== originalRow.factoryCode ||
                currentRow.breakfastNote !== originalRow.breakfastNote ||
                currentRow.visitorCnt !== originalRow.visitorCnt
            );
        });

        return hasRowChanges;
    };

    // Check if current tab has any canteen selected
    const currentTabHasAnyCanteen = selectedDateRows.some((row) => Boolean(row.factoryCode));

    const canRegister = !isLoading
        && !justRegistered
        && hasDataChangedFromOriginal()
        && currentTabHasAnyCanteen;

    const handleSaveAll = async () => {
        if (!canRegister || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            const parsedUserData = JSON.parse(rawUserData || '{}');
            const empNo = parsedUserData?.EMPID || '';
            const userId = parsedUserData?.EMPID || parsedUserData?.EMPID || '';

            // Build detail JSON from selected rows (only rows with factoryCode selected)
            const detailJson = selectedDateRows
                .filter((row) => row.factoryCode)
                .map((row) => {
                    // Map mealKey to mealType
                    let mealType = '';
                    switch (row.mealKey) {
                        case 'lunch':
                            mealType = 'LUNCH';
                            break;
                        case 'breakfast':
                            mealType = 'BREAKFAST';
                            break;
                        case 'dinner':
                            mealType = 'DINNER';
                            break;
                        default:
                            mealType = row.mealKey.toUpperCase();
                    }

                    return {
                        regDate: row.date,
                        mealType: mealType,
                        factoryCode: row.factoryCode,
                        factoryCost: '',
                        mealNote: row.breakfastNote || '',
                        isSelected: 1,
                        visitorCnt: row.visitorCnt || 1,
                    };
                });

            const registrationData = {
                argEmpNo: empNo,
                argRegType: activeTab === 'visitor' ? 'VISITOR' : 'SELF',
                argVisitorDept: activeTab === 'visitor' ? (visitorDeptRef.current || formik.values.visitorDepartment) : '',
                argRemarks: '',
                argCreatedBy: userId,
                argDetailJson: detailJson,
            };

            const result = await saveCanteenRegistration(registrationData);

            if (result.success) {
                // alert(`Registration successful! Registration ID: ${result.data?.regId}`);
                // Set flags to hide panel
                setJustRegistered(true);
                // Close confirmation dialog
                setShowConfirmDialog(false);

                // Store current department before resetting form
                const currentDept = formik.values.visitorDepartment;

                // Reset form values
                formik.resetForm();
                setVisitorDepartment('');

                // Fetch and apply registration data from API to update UI
                // Re-fetch with current department after a short delay to ensure state is updated
                setTimeout(async () => {
                    try {
                        // Clear current data first
                        const freshRows = buildNextSevenDays(weekOffset);

                        // Update state for current tab
                        if (activeTab === 'self') {
                            setSelectedDateRows(freshRows);
                            setOriginalData(JSON.parse(JSON.stringify(freshRows)));
                        } else {
                            setSelectedDateRows(freshRows);
                            setOriginalData(JSON.parse(JSON.stringify(freshRows)));
                        }

                        // Update allWeekData
                        setAllWeekData((prev) => ({
                            ...prev,
                            [weekOffset]: {
                                self: activeTab === 'self' ? freshRows : (prev[weekOffset]?.self || freshRows),
                                visitor: activeTab === 'visitor' ? freshRows : (prev[weekOffset]?.visitor || freshRows),
                            },
                        }));

                        // Re-fetch data
                        await fetchAndApplyRegistrationData(empNo);

                        // Restore department if visitor tab
                        if (activeTab === 'visitor' && currentDept) {
                            setVisitorDepartment(currentDept);
                            formik.setFieldValue('visitorDepartment', currentDept);
                        }
                    } catch (error) {
                        console.error('Error refreshing data after save:', error);
                    }
                }, 100);
            } else {
                alert(`Registration failed: ${result.error?.message || result.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving canteen registration:', error);
            alert('An error occurred while saving. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Confirm Dialog Component
    const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
        if (!isOpen) return null;

        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out',
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '20px',
                        padding: '32px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        textAlign: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Warning Icon */}
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 8px 24px rgba(251, 191, 36, 0.3)',
                        }}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ animation: 'pulse 1.5s infinite' }}>
                            <path d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h3
                        style={{
                            fontSize: '22px',
                            fontWeight: 800,
                            color: '#1f2937',
                            marginBottom: '12px',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {title}
                    </h3>

                    {/* Message */}
                    <p
                        style={{
                            fontSize: '15px',
                            color: '#6b7280',
                            lineHeight: 1.6,
                            marginBottom: '28px',
                        }}
                    >
                        {message}
                    </p>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '14px 24px',
                                borderRadius: '12px',
                                border: '2px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                color: '#374151',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: isLoading ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.backgroundColor = '#f9fafb';
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '14px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: '#ffffff',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: isLoading ? 0.6 : 1,
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';
                            }}
                        >
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : 'Confirm'}
                        </button>
                    </div>
                </div>

                {/* CSS Animations */}
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    };


    return (
        <main style={{ height: '100vh', paddingTop: '72px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        marginBottom: '20px',
                        borderBottom: '1px solid #e5e7eb',
                        background: 'rgba(248, 250, 252, 0.7)',
                        backdropFilter: 'blur(8px)',
                        overflow: 'hidden',
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px',
                    }}
                >

                    {showSelfTab && (
                        <button
                            id="tab-self-attendance"
                            type="button"
                            onClick={() => setActiveTab('self')}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                border: 'none',
                                borderBottom: activeTab === 'self' ? '2px solid #13005f' : '2px solid transparent',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '14px',
                                backgroundColor: activeTab === 'self' ? '#13005f' : 'transparent',
                                color: activeTab === 'self' ? '#ffffff' : '#4b5563',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Your Self Registration
                        </button>
                    )}

                    <button
                        id="tab-visitor-attendance"
                        type="button"
                        onClick={() => setActiveTab('visitor')}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: 'none',
                            borderBottom: activeTab === 'visitor' ? '2px solid #13005f' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '14px',
                            backgroundColor: activeTab === 'visitor' ? '#13005f' : 'transparent',
                            color: activeTab === 'visitor' ? '#ffffff' : '#4b5563',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Visitors Registration
                    </button>
                </div>

                <section
                    id="canteen-attendance-content"
                    style={{
                        flex: 1,
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '12px 16px 20px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <div style={{ marginBottom: '14px', flexShrink: 0 }}>
                            {activeTab === 'visitor' && (
                                <div
                                    style={{
                                        marginBottom: '14px',
                                        border: '1px solid #bfdbfe',
                                        background: 'linear-gradient(90deg, #eff6ff 0%, #eef2ff 100%)',
                                        borderRadius: '12px',
                                        padding: '12px 14px',
                                        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.16)',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <label
                                            htmlFor="visitor-department"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                fontWeight: 800,
                                                color: '#1e3a8a',
                                                letterSpacing: '0.2px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '999px',
                                                    background: '#0c0659',
                                                    color: '#ffffff',
                                                    fontSize: '16px',
                                                    boxShadow: '0 4px 10px rgba(10, 16, 75, 0.84)',
                                                }}
                                            >
                                                <Building2 size={16} />
                                            </span>
                                            Department
                                            <select
                                                id="visitor-department"
                                                name="visitorDepartment"
                                                value={formik.values.visitorDepartment}
                                                onChange={(e) => handleVisitorDepartmentChange(e.target.value)}
                                                onBlur={formik.handleBlur}
                                                style={{
                                                    width: '220px',
                                                    padding: '8px 12px',
                                                    border: '2px solid #c4b5fd',
                                                    borderRadius: '10px',
                                                    background: '#ffffff',
                                                    color: '#0f172a',
                                                    fontWeight: 700,
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {deptList.map((dept) => (
                                                    <option key={dept.DEPT_CD} value={dept.DEPT_CD}>
                                                        {dept.DEPT_NM}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const currentWeekOffset = weekOffset;
                                        const newOffset = currentWeekOffset - 1;

                                        // Save current week data before navigating
                                        setAllWeekData((prev) => ({
                                            ...prev,
                                            [currentWeekOffset]: {
                                                ...(prev[currentWeekOffset] || { self: buildNextSevenDays(currentWeekOffset), visitor: buildNextSevenDays(currentWeekOffset) }),
                                                [activeTab]: selectedDateRows,
                                            },
                                        }));

                                        // Get or build rows for new week
                                        const saved = allWeekData[newOffset]?.[activeTab];
                                        const newRows = saved || buildNextSevenDays(newOffset);

                                        setWeekOffset(newOffset);
                                        setSelectedDateRows(newRows);
                                        // Update originalData for the new week
                                        setOriginalData(JSON.parse(JSON.stringify(newRows)));

                                        // Fetch existing registration data for the new week (in background, don't overwrite)
                                        const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
                                        const parsedUserData = JSON.parse(rawUserData || '{}');
                                        const empNo = parsedUserData?.EMPID || '';
                                        if (empNo) {
                                            // Fetch with filterDept for VISITOR tab, null for SELF tab
                                            const filterDept = activeTab === 'visitor' ? (visitorDepartment || null) : null;
                                            await fetchRegistrationDataForWeek(empNo, newOffset, filterDept);
                                        }
                                    }}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '8px',
                                        border: '2px solid #e2e8f0',
                                        background: '#13005f',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                        e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const currentWeekOffset = weekOffset;

                                        // Save current week data before navigating
                                        setAllWeekData((prev) => ({
                                            ...prev,
                                            [currentWeekOffset]: {
                                                ...(prev[currentWeekOffset] || { self: buildNextSevenDays(currentWeekOffset), visitor: buildNextSevenDays(currentWeekOffset) }),
                                                [activeTab]: selectedDateRows,
                                            },
                                        }));

                                        const saved = allWeekData[0]?.[activeTab];
                                        const newRows = saved || buildNextSevenDays(0);
                                        setSelectedDateRows(newRows);
                                        setWeekOffset(0);
                                        // Update originalData for the new week
                                        setOriginalData(JSON.parse(JSON.stringify(newRows)));

                                        // Fetch existing registration data for current week (in background, don't overwrite)
                                        const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
                                        const parsedUserData = JSON.parse(rawUserData || '{}');
                                        const empNo = parsedUserData?.EMPID || '';
                                        if (empNo) {
                                            // Fetch with filterDept for VISITOR tab, null for SELF tab
                                            const filterDept = activeTab === 'visitor' ? (visitorDepartment || null) : null;
                                            await fetchRegistrationDataForWeek(empNo, 0, filterDept);
                                        }
                                    }}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '8px',
                                        border: '2px solid #e2e8f0',
                                        background: '#f1f5f9',
                                        color: '#0f172a',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        opacity: weekOffset === 0 ? 0.4 : 1,
                                        pointerEvents: weekOffset === 0 ? 'none' : 'auto',
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                        e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const currentWeekOffset = weekOffset;
                                        const newOffset = currentWeekOffset + 1;

                                        // Save current week data before navigating
                                        setAllWeekData((prev) => ({
                                            ...prev,
                                            [currentWeekOffset]: {
                                                ...(prev[currentWeekOffset] || { self: buildNextSevenDays(currentWeekOffset), visitor: buildNextSevenDays(currentWeekOffset) }),
                                                [activeTab]: selectedDateRows,
                                            },
                                        }));

                                        // Get or build rows for new week
                                        const saved = allWeekData[newOffset]?.[activeTab];
                                        const newRows = saved || buildNextSevenDays(newOffset);

                                        setWeekOffset(newOffset);
                                        setSelectedDateRows(newRows);
                                        // Update originalData for the new week
                                        setOriginalData(JSON.parse(JSON.stringify(newRows)));

                                        // Fetch existing registration data for the new week (in background, don't overwrite)
                                        const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
                                        const parsedUserData = JSON.parse(rawUserData || '{}');
                                        const empNo = parsedUserData?.EMPID || '';
                                        if (empNo) {
                                            // Fetch with filterDept for VISITOR tab, null for SELF tab
                                            const filterDept = activeTab === 'visitor' ? (visitorDepartment || null) : null;
                                            await fetchRegistrationDataForWeek(empNo, newOffset, filterDept);
                                        }
                                    }}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '8px',
                                        border: '2px solid #e2e8f0',
                                        background: '#13005f',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                        e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    Next
                                </button>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: 'calc(100vh - 350px)' }}>
                                <div style={{ flex: 1, overflowY: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}>
                                <table style={{ width: '100%', minWidth: activeTab === 'self' ? '600px' : '100%', maxWidth: '100%', margin: 0, borderCollapse: 'collapse', background: '#fff', tableLayout: 'fixed' }}>
                                    <thead>
                                    <tr>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700, position: 'sticky', top: 0, zIndex: 10, width: '140px' }}>Date</th>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700, position: 'sticky', top: 0, zIndex: 10, width: '120px' }}>Meal</th>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700, position: 'sticky', top: 0, zIndex: 10 }}>Canteen</th>
                                        {activeTab === 'visitor' && (
                                            <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700, position: 'sticky', top: 0, zIndex: 10, width: '130px' }}>Visitors</th>
                                        )}
                                        {activeTab === 'visitor' && (
                                            <th style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700, position: 'sticky', top: 0, zIndex: 10 }}>Pre-order Note</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(groupedRowsByDate).map(([date, rows]) =>
                                        rows.map((row, index) => {
                                            const rowColors = [
                                                { bg: '#fafafa', hover: '#f1f5f9' },
                                                { bg: '#f8f9ff', hover: '#eef0ff' },
                                                { bg: '#faf8ff', hover: '#f3eeff' },
                                            ];
                                            const colorIdx = (Object.keys(groupedRowsByDate).indexOf(date) * 3 + index) % 3;
                                            const isRowDisabled = isRegistrationDisabled(row.date, row.mealKey);
                                            return (
                                                <tr key={row.id} style={{ transition: 'background 0.15s' }}>
                                                    {index === 0 && (
                                                        <td
                                                            rowSpan={rows.length}
                                                            style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '10px 12px', fontWeight: 700, verticalAlign: 'middle', background: rowColors[colorIdx].bg }}
                                                        >
                                                            {date}
                                                        </td>
                                                    )}
                                                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '10px 12px', fontWeight: 600, background: rowColors[colorIdx].bg }}>{row.mealLabel}</td>
                                                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '10px 12px', background: rowColors[colorIdx].bg }}>
                                                        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap', alignItems: 'center',justifyContent: 'center' }}>
                                                            {factories.map((factory) => {
                                                                const isSelected = row.factoryCode === factory.code;
                                                                const isDisabled = isRegistrationDisabled(row.date, row.mealKey);
                                                                const isFullyLocked = row.date < new Date().toISOString().slice(0, 10);
                                                                return (
                                                                    <button
                                                                        key={`${row.id}-${factory.value}`}
                                                                        type="button"
                                                                        onClick={() => handleRowFactoryChange(row.date, factory.code, row.id, row.mealKey)}
                                                                        disabled={isDisabled}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            maxWidth: '200px',
                                                                            flex: 1,
                                                                            gap: '6px',
                                                                            fontWeight: isSelected ? 700 : 600,
                                                                            color: isSelected ? '#ffffff' : (isDisabled ? '#94a3b8' : '#0f172a'),
                                                                            background: isSelected ? '#13005f' : (isDisabled ? '#e2e8f0' : '#f1f5f9'),
                                                                            border: isSelected ? '2px solid #13005f' : '2px solid #e2e8f0',
                                                                            borderRadius: '8px',
                                                                            padding: '6px 4px',
                                                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                            transition: 'all 0.2s ease',
                                                                            boxShadow: isSelected && !isDisabled ? '0 4px 12px rgba(19, 0, 95, 0.35)' : 'none',
                                                                            marginRight: factories.indexOf(factory) < factories.length - 1 ? '6px' : '0',
                                                                            opacity: isDisabled && !isSelected ? 0.6 : 1,
                                                                        }}
                                                                    >
                                                                        {isSelected ? (
                                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                {isDisabled ? <Lock size={12} /> : <Check size={12} />}
                                                                                {factory.label}
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                {isDisabled && <Lock size={12} />}
                                                                                {factory.label}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    {activeTab === 'visitor' && (
                                                        <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '10px 12px', background: rowColors[colorIdx].bg, textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={row.visitorCnt || 1}
                                                                onChange={(e) => {
                                                                    handleVisitorCntChange(row.date, e.target.value, row.id, row.mealKey);
                                                                }}
                                                                disabled={isRowDisabled}
                                                                style={{
                                                                    width: '80px',
                                                                    padding: '6px 8px',
                                                                    border: '2px solid #e2e8f0',
                                                                    borderRadius: '8px',
                                                                    background: isRowDisabled ? '#f1f5f9' : '#ffffff',
                                                                    color: isRowDisabled ? '#94a3b8' : '#0f172a',
                                                                    fontWeight: 700,
                                                                    textAlign: 'center',
                                                                    outline: 'none',
                                                                    cursor: isRowDisabled ? 'not-allowed' : 'text',
                                                                }}
                                                            />
                                                        </td>
                                                    )}
                                                    {activeTab === 'visitor' && (
                                                        <td style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 12px', background: rowColors[colorIdx].bg }}>
                                                            {row.mealKey === 'breakfast' ? (() => {
                                                                const isDisabled = isRegistrationDisabled(row.date, row.mealKey);
                                                                return (
                                                                    <div style={{ position: 'relative', width: '100%' }}>
                                                                        <input
                                                                            type="text"
                                                                            placeholder={isDisabled ? "Over Time" : "Enter pre-order note"}
                                                                            value={row.breakfastNote || ''}
                                                                            onChange={(e) => {
                                                                                if (!isDisabled) {
                                                                                    handleBreakfastNoteChange(row.date, e.target.value, row.id);
                                                                                }
                                                                            }}
                                                                            disabled={isDisabled}
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '6px 10px',
                                                                                paddingRight: isDisabled ? '30px' : '10px',
                                                                                border: '2px solid #e2e8f0',
                                                                                borderRadius: '8px',
                                                                                background: isDisabled ? '#f1f5f9' : '#ffffff',
                                                                                color: isDisabled ? '#94a3b8' : '#0f172a',
                                                                                fontWeight: 600,
                                                                                outline: 'none',
                                                                                cursor: isDisabled ? 'not-allowed' : 'text',
                                                                            }}
                                                                        />
                                                                        {isDisabled && (
                                                                            <Lock
                                                                                size={14}
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    right: '8px',
                                                                                    top: '50%',
                                                                                    transform: 'translateY(-50%)',
                                                                                    color: '#94a3b8',
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })() : (
                                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        }),
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                    </div>
                </section>
                </div>

            <div
                style={{
                    position: 'sticky',
                    bottom: '8px',
                    left: 0,
                    width: '100%',
                    marginTop: '8px',
                    padding: '14px 18px',
                    borderTop: '1px solid rgba(191, 219, 254, 0.45)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.32)',
                    background: canRegister
                        ? 'linear-gradient(130deg, rgba(255, 255, 255, 0.26) 0%, rgba(186, 230, 253, 0.22) 38%, rgba(199, 210, 254, 0.2) 100%)'
                        : 'linear-gradient(130deg, rgba(248, 250, 252, 0.78) 0%, rgba(226, 232, 240, 0.64) 100%)',

                    backdropFilter: 'blur(18px) saturate(185%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(185%)',
                    transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: canRegister ? 'translateY(0)' : 'translateY(100%)',
                    opacity: canRegister ? 1 : 0,
                    visibility: canRegister ? 'visible' : 'hidden',
                    pointerEvents: canRegister ? 'auto' : 'none',
                    zIndex: 20,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        maxWidth: '996px',
                        margin: '0 auto',
                        paddingBottom: '4px',
                    }}
                >

                    <button
                        type="button"
                        onClick={async () => {
                            formik.resetForm();
                            setVisitorDepartment('');
                            setWeekOffset(0);
                            setActiveTab('self');
                            setIsSubmitting(false);
                            setJustRegistered(false);
                            const fresh = buildNextSevenDays(0);
                            setSelectedDateRows(fresh);
                            setOriginalData(JSON.parse(JSON.stringify(fresh)));
                            setAllWeekData({ 0: { self: fresh, visitor: fresh } });
                            allWeekDataRef.current = { 0: { self: fresh, visitor: fresh } };
                            // Fetch existing registration data for current week
                            const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
                            const parsedUserData = JSON.parse(rawUserData || '{}');
                            const empNo = parsedUserData?.EMPID || '';
                            if (empNo) {
                                await fetchAndApplyRegistrationData(empNo);
                            }
                        }}
                        style={{
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 18px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            transition: 'all 0.3s ease',
                            marginRight: '8px',
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={formik.submitForm}
                        disabled={!canRegister || isSubmitting}
                        style={{
                            background: canRegister && !isSubmitting ? '#04085aff' : '#94a3b8',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 18px',
                            cursor: canRegister && !isSubmitting ? 'pointer' : 'not-allowed',
                            fontWeight: 700,
                            transition: 'all 0.3s ease',
                            filter: canRegister && !isSubmitting ? 'none' : 'grayscale(0.3)',
                        }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Register'}
                    </button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={handleSaveAll}
                title="Confirm Registration"
                message="Once registered, this action cannot be undone. Are you sure you want to continue?"
                isLoading={isSubmitting}
            />
        </main>
    );
};

export default CanteenAttendanceRegistration;
