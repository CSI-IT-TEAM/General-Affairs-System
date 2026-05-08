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
    const [deptList, setDeptList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [justRegistered, setJustRegistered] = useState(false);
    const [originalData, setOriginalData] = useState([]);

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
            if (activeTab !== 'self') return;

            const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (!rawUserData) return;
            const parsedUserData = JSON.parse(rawUserData);
            const empNo = parsedUserData?.EMPID || '';
            if (empNo) {
                // Fetch self registration data (no department filter)
                await fetchRegistrationDataForWeek(empNo, weekOffset, null);
            }
        };

        fetchSelfData();
    }, []);

    // Fetch registration data for visitor tab based on selected department
    useEffect(() => {
        const fetchVisitorData = async () => {
            if (activeTab !== 'visitor') return;

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

            if (deptToUse) {
                // Clear old visitor data to avoid showing unfiltered data while loading
                setAllWeekData((prev) => ({
                    ...prev,
                    [weekOffset]: {
                        ...(prev[weekOffset] || { self: buildNextSevenDays(weekOffset), visitor: buildNextSevenDays(weekOffset) }),
                        visitor: buildNextSevenDays(weekOffset),
                    },
                }));
                // Fetch with correct department
                await fetchRegistrationDataForWeek(empNo, weekOffset, deptToUse);
            }
        };

        fetchVisitorData();
    }, [activeTab, deptList]);

    // Re-fetch when department changes manually (user selects different department)
    useEffect(() => {
        if (activeTab === 'visitor' && visitorDepartment) {
            const rawUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (!rawUserData) return;
            const parsedUserData = JSON.parse(rawUserData);
            const empNo = parsedUserData?.EMPID || '';
            if (empNo) {
                // Fetch with new department (data will be cleared and updated inside fetch function)
                fetchRegistrationDataForWeek(empNo, weekOffset, visitorDepartment);
            }
        }
    }, [visitorDepartment]);

    useEffect(() => {
        if (!showSelfTab && activeTab === 'self') {
            setActiveTab('visitor');
        }
    }, [showSelfTab, activeTab]);

    const prevActiveTabRef = useRef(activeTab);
    const isFirstLoadRef = useRef(true);
    const isVisitorDataReadyRef = useRef(false);

    // Clear visitor data on mount and mark as not ready to force re-fetch with correct department
    useEffect(() => {
        const freshVisitor = buildNextSevenDays(0);
        setAllWeekData({ 0: { self: buildNextSevenDays(0), visitor: freshVisitor } });
        isVisitorDataReadyRef.current = false;
    }, []);

    useEffect(() => {
        const prevTab = prevActiveTabRef.current;
        const prevRows = selectedDateRows;

        // On first load, don't use cached data from allWeekData (let fetch functions handle it)
        if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
            prevActiveTabRef.current = activeTab;
            return;
        }

        // For visitor tab, only use cached data if it's been explicitly set by fetch with correct department
        // Otherwise, if switching to visitor tab while data is being fetched, show empty rows
        if (activeTab === 'visitor') {
            const saved = allWeekData[weekOffset]?.visitor;
            // Only use cached data if visitor data has been explicitly fetched with department filter
            if (isVisitorDataReadyRef.current && saved?.some((row) => row.factoryCode)) {
                setSelectedDateRows(saved);
            } else {
                // Not yet fetched or no data - show empty rows while fetching
                setSelectedDateRows(buildNextSevenDays(weekOffset));
            }
        } else {
            const saved = allWeekData[weekOffset]?.[activeTab];
            setSelectedDateRows(saved || buildNextSevenDays(weekOffset));
        }

        if (prevTab !== activeTab && prevTab) {
            setAllWeekData((prevAll) => ({
                ...prevAll,
                [weekOffset]: {
                    ...(prevAll[weekOffset] || { self: buildNextSevenDays(weekOffset), visitor: buildNextSevenDays(weekOffset) }),
                    [prevTab]: prevRows,
                },
            }));
            // Reset justRegistered when switching tabs so panel shows correctly
            setJustRegistered(false);
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

    // Fetch registration data from API and apply to rows (used for initial load only)
    const fetchAndApplyRegistrationData = async (empNo, offset = weekOffset, filterDept = null) => {
        setIsLoading(true);
        try {
            const today = new Date();
            today.setDate(today.getDate() + offset * 7);
            const startDate = new Date(today);
            startDate.setDate(today.getDate());
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 7);
            const fromDate = startDate.toISOString().slice(0, 10);
            const toDate = endDate.toISOString().slice(0, 10);

            // Use filterDept if provided, otherwise fall back to state
            const deptToFilter = filterDept ?? (activeTab === 'visitor' && visitorDepartment ? visitorDepartment : null);

            const result = await getCanteenRegistration({
                argEmpNo: empNo,
                argFromDate: fromDate,
                argToDate: toDate,
                argVisitorDept: deptToFilter,
            });

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                // Build separate maps for SELF and VISITOR registrations
                const selfRegMap = {};
                const visitorRegMap = {};

                result.data.forEach((item) => {
                    // Skip VISITOR records when fetching for self tab (no department filter)
                    // VISITOR records should only be fetched when a specific department is selected
                    if (item.REG_TYPE === 'VISITOR' && !deptToFilter) {
                        return;
                    }

                    // Skip VISITOR records that don't match the requested department
                    if (item.REG_TYPE === 'VISITOR' && deptToFilter && item.VISITOR_DEPT !== deptToFilter) {
                        return;
                    }

                    // Determine mealKey from mealType
                    let mealKey = '';
                    switch (item.MEAL_TYPE) {
                        case 'LUNCH':
                            mealKey = 'lunch';
                            break;
                        case 'BREAKFAST':
                            mealKey = 'breakfast';
                            break;
                        case 'DINNER':
                            mealKey = 'dinner';
                            break;
                        default:
                            mealKey = item.MEAL_TYPE?.toLowerCase() || '';
                    }
                    const key = `${item.REG_DATE}-${mealKey}`;
                    const regData = {
                        factoryCode: item.FACTORY_CODE,
                        breakfastNote: item.MEAL_NOTE || '',
                        visitorCnt: item.VISITOR_CNT || 1,
                    };

                    // Separate data by REG_TYPE
                    if (item.REG_TYPE === 'SELF') {
                        selfRegMap[key] = regData;
                    } else if (item.REG_TYPE === 'VISITOR') {
                        visitorRegMap[key] = regData;
                    }
                });

                // Build updated rows for SELF tab
                const updatedSelfRows = selectedDateRows.map((row) => {
                    const key = `${row.date}-${row.mealKey}`;
                    const regData = selfRegMap[key];
                    if (regData) {
                        return {
                            ...row,
                            factoryCode: regData.factoryCode,
                            breakfastNote: regData.breakfastNote,
                            visitorCnt: regData.visitorCnt,
                        };
                    }
                    return row;
                });

                // Build updated rows for VISITOR tab
                const updatedVisitorRows = selectedDateRows.map((row) => {
                    const key = `${row.date}-${row.mealKey}`;
                    const regData = visitorRegMap[key];
                    if (regData) {
                        return {
                            ...row,
                            factoryCode: regData.factoryCode,
                            breakfastNote: regData.breakfastNote,
                            visitorCnt: regData.visitorCnt,
                        };
                    }
                    return row;
                });

                // Apply to current rows based on active tab and save as original data
                if (activeTab === 'self') {
                    setSelectedDateRows(updatedSelfRows);
                    setOriginalData(JSON.parse(JSON.stringify(updatedSelfRows)));
                } else {
                    setSelectedDateRows(updatedVisitorRows);
                    setOriginalData(JSON.parse(JSON.stringify(updatedVisitorRows)));
                }

                // Update allWeekData with both self and visitor data
                setAllWeekData((prev) => ({
                    ...prev,
                    [offset]: {
                        ...(prev[offset] || { self: buildNextSevenDays(offset), visitor: buildNextSevenDays(offset) }),
                        self: updatedSelfRows,
                        visitor: updatedVisitorRows,
                    },
                }));
            } else {
                // No data from API, save current rows as original
                setOriginalData(JSON.parse(JSON.stringify(selectedDateRows)));
            }
        } catch (error) {
            console.error('Error fetching registration data:', error);
            // Save current state as original on error
            setOriginalData(JSON.parse(JSON.stringify(selectedDateRows)));
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch registration data for a specific week (used during navigation - doesn't overwrite selectedDateRows)
    const fetchRegistrationDataForWeek = async (empNo, offset, filterDept = null) => {
        setIsLoading(true);
        try {
            const today = new Date();
            today.setDate(today.getDate() + offset * 7);
            const startDate = new Date(today);
            startDate.setDate(today.getDate());
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 7);
            const fromDate = startDate.toISOString().slice(0, 10);
            const toDate = endDate.toISOString().slice(0, 10);

            // Use filterDept if provided, otherwise fall back to state
            const deptToFilter = filterDept ?? (activeTab === 'visitor' && visitorDepartment ? visitorDepartment : null);

            const result = await getCanteenRegistration({
                argEmpNo: empNo,
                argFromDate: fromDate,
                argToDate: toDate,
                argVisitorDept: deptToFilter,
            });

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                // Build separate maps for SELF and VISITOR registrations
                const selfRegMap = {};
                const visitorRegMap = {};

                result.data.forEach((item) => {
                    // Skip VISITOR records when fetching for self tab (no department filter)
                    // VISITOR records should only be fetched when a specific department is selected
                    if (item.REG_TYPE === 'VISITOR' && !deptToFilter) {
                        return;
                    }

                    // Skip VISITOR records that don't match the requested department
                    if (item.REG_TYPE === 'VISITOR' && deptToFilter && item.VISITOR_DEPT !== deptToFilter) {
                        return;
                    }

                    let mealKey = '';
                    switch (item.MEAL_TYPE) {
                        case 'LUNCH':
                            mealKey = 'lunch';
                            break;
                        case 'BREAKFAST':
                            mealKey = 'breakfast';
                            break;
                        case 'DINNER':
                            mealKey = 'dinner';
                            break;
                        default:
                            mealKey = item.MEAL_TYPE?.toLowerCase() || '';
                    }
                    const key = `${item.REG_DATE}-${mealKey}`;
                    const regData = {
                        factoryCode: item.FACTORY_CODE,
                        breakfastNote: item.MEAL_NOTE || '',
                        visitorCnt: item.VISITOR_CNT || 1,
                    };

                    // Separate data by REG_TYPE
                    if (item.REG_TYPE === 'SELF') {
                        selfRegMap[key] = regData;
                    } else if (item.REG_TYPE === 'VISITOR') {
                        visitorRegMap[key] = regData;
                    }
                });

                // Build rows for the week with SELF registration data
                const weekSelfRows = buildNextSevenDays(offset).map((row) => {
                    const key = `${row.date}-${row.mealKey}`;
                    const regData = selfRegMap[key];
                    if (regData) {
                        return {
                            ...row,
                            factoryCode: regData.factoryCode,
                            breakfastNote: regData.breakfastNote,
                            visitorCnt: regData.visitorCnt,
                        };
                    }
                    return row;
                });

                // Build rows for the week with VISITOR registration data
                const weekVisitorRows = buildNextSevenDays(offset).map((row) => {
                    const key = `${row.date}-${row.mealKey}`;
                    const regData = visitorRegMap[key];
                    if (regData) {
                        return {
                            ...row,
                            factoryCode: regData.factoryCode,
                            breakfastNote: regData.breakfastNote,
                            visitorCnt: regData.visitorCnt,
                        };
                    }
                    return row;
                });

                // Update allWeekData with both self and visitor data
                setAllWeekData((prev) => ({
                    ...prev,
                    [offset]: {
                        ...(prev[offset] || { self: buildNextSevenDays(offset), visitor: buildNextSevenDays(offset) }),
                        self: weekSelfRows,
                        visitor: weekVisitorRows,
                    },
                }));

                // Mark visitor data as ready (fetched with correct department filter)
                if (offset === weekOffset) {
                    isVisitorDataReadyRef.current = true;
                }

                // If this is the current week, also update selectedDateRows and originalData based on active tab
                if (offset === weekOffset) {
                    if (activeTab === 'self') {
                        setSelectedDateRows(weekSelfRows);
                        setOriginalData(JSON.parse(JSON.stringify(weekSelfRows)));
                    } else {
                        setSelectedDateRows(weekVisitorRows);
                        setOriginalData(JSON.parse(JSON.stringify(weekVisitorRows)));
                    }
                }
            } else {
                // No data from API - set fresh empty rows for the current tab
                if (offset === weekOffset) {
                    const freshRows = buildNextSevenDays(offset);
                    setSelectedDateRows(freshRows);
                    setOriginalData(JSON.parse(JSON.stringify(freshRows)));
                }
            }
        } catch (error) {
            console.error('Error fetching registration data for week:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getAllRowsForTab = (tab) => {
        return Object.values(allWeekData).flatMap((week) => week[tab] || []);
    };

    const allSelfRows = getAllRowsForTab('self');
    const allVisitorRows = getAllRowsForTab('visitor');

    const selfHasAtLeastOneCanteen = allSelfRows.some((row) => Boolean(row.factoryCode));
    const visitorHasAtLeastOneCanteen = allVisitorRows.some((row) => Boolean(row.factoryCode));

    // Check current week selected rows (for when allWeekData is not yet populated)
    const currentTabHasCanteen = selectedDateRows.some((row) => Boolean(row.factoryCode));

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

    const canRegister = !justRegistered && hasDataChangedFromOriginal() && (
        activeTab === 'visitor'
            ? (selfHasAtLeastOneCanteen || currentTabHasCanteen)
            : (selfHasAtLeastOneCanteen || currentTabHasCanteen)
    );

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
                argVisitorDept: activeTab === 'visitor' ? formik.values.visitorDepartment : '',
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
        <main style={{ minHeight: '100vh', paddingTop: '96px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '24px' }}>
            <div style={{ width: '100%', margin: '0 auto' }}>
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

                    <button
                        id="tab-report"
                        type="button"
                        onClick={() => setActiveTab('report')}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: 'none',
                            borderBottom: activeTab === 'report' ? '2px solid #13005f' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '14px',
                            backgroundColor: activeTab === 'report' ? '#13005f' : 'transparent',
                            color: activeTab === 'report' ? '#ffffff' : '#4b5563',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Report
                    </button>
                </div>

                <section
                    id="canteen-attendance-content"
                    style={{
                        minHeight: 'calc(100vh - 290px)',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '16px',
                    }}
                >
                    <>
                        <div style={{ overflowX: 'auto' }}>
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

                            {activeTab === 'report' && (
                                <div
                                    style={{
                                        marginBottom: '14px',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <label
                                            htmlFor="report-from-date"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#78350f' }}
                                        >
                                            From Date
                                            <input
                                                id="report-from-date"
                                                type="date"
                                                style={{
                                                    padding: '8px 12px',
                                                    border: '2px solid rgb(16, 12, 73)',
                                                    borderRadius: '10px',
                                                    background: '#ffffff',
                                                    color: '#0f172a',
                                                    fontWeight: 600,
                                                    outline: 'none',
                                                }}
                                            />
                                        </label>
                                        <label
                                            htmlFor="report-to-date"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#78350f' }}
                                        >
                                            To Date
                                            <input
                                                id="report-to-date"
                                                type="date"
                                                style={{
                                                    padding: '8px 12px',
                                                    border: '2px solid rgb(16, 12, 73)',
                                                    borderRadius: '10px',
                                                    background: '#ffffff',
                                                    color: '#0f172a',
                                                    fontWeight: 600,
                                                    outline: 'none',
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
 
                            {activeTab !== 'report' && <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
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
                                            await fetchRegistrationDataForWeek(empNo, newOffset);
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
                                            await fetchRegistrationDataForWeek(empNo, 0);
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
                                            await fetchRegistrationDataForWeek(empNo, newOffset);
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
                            </div>}

                            {activeTab !== 'report' && <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <thead>
                                    <tr>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700 }}>Date</th>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700 }}>Meal</th>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700 }}>Canteen</th>
                                        {activeTab === 'visitor' && (
                                            <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700 }}>Visitors</th>
                                        )}
                                        {activeTab === 'visitor' && (
                                            <th style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700 }}>Pre-order Note</th>
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
                                                        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap', alignItems: 'stretch' }}>
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
                            </table>}

                            {activeTab === 'report' && (
                                <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>
                                    hello world
                                </div>
                            )}
                        </div>
                    </>
                </section>
            </div>

            <div
                style={{
                    position: 'sticky',
                    bottom: '0',
                    left: 0,
                    width: '100%',
                    marginTop: '20px',
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
