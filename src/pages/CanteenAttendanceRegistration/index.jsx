import React, { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import { Users, Building2 } from 'lucide-react';

const factories = [
    { value: 'VJ1', label: 'VJ1', code: '2110' },
    { value: 'VJ2', label: 'VJ2', code: '2120' },
    { value: 'VJ3', label: 'VJ3', code: '2210' },
];

const mealTemplates = [
    { key: 'lunchMorning', label: 'Lunch' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'dinner', label: 'Dinner' },
];

const buildNextSevenDays = (weekOffset = 0) => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);

    return Array.from({ length: 8 }, (_, index) => {
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

    const showSelfTab = userPersType !== 'EMP';

    const formik = useFormik({
        initialValues: {
            visitorCount: 1,
            visitorDepartment: '',
        },
        validate: (values) => {
            const errors = {};
            if (activeTab === 'visitor' && Number(values.visitorCount) <= 0) {
                errors.visitorCount = 'Number of visitors must be greater than 0';
            }
            return errors;
        },
        onSubmit: () => {
            handleSaveAll();
        },
        enableReinitialize: false,
    });



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

    useEffect(() => {
        setAllWeekData((prev) => ({
            ...prev,
            [weekOffset]: {
                ...(prev[weekOffset] || { self: buildNextSevenDays(weekOffset), visitor: buildNextSevenDays(weekOffset) }),
                [activeTab]: selectedDateRows,
            },
        }));
    }, [selectedDateRows, weekOffset, activeTab]);

    useEffect(() => {
        if (!showSelfTab && activeTab === 'self') {
            setActiveTab('visitor');
        }
    }, [showSelfTab, activeTab]);

    const prevActiveTabRef = useRef(activeTab);

    useEffect(() => {
        const prevTab = prevActiveTabRef.current;
        const prevRows = selectedDateRows;

        const saved = allWeekData[weekOffset]?.[activeTab];
        setSelectedDateRows(saved || buildNextSevenDays(weekOffset));

        if (prevTab !== activeTab && prevTab) {
            setAllWeekData((prevAll) => ({
                ...prevAll,
                [weekOffset]: {
                    ...(prevAll[weekOffset] || { self: buildNextSevenDays(weekOffset), visitor: buildNextSevenDays(weekOffset) }),
                    [prevTab]: prevRows,
                },
            }));
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



    const handleRowFactoryChange = (date, factoryCode, rowId) => {
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

    const visitorCountValue = Number(formik.values.visitorCount);
    const isVisitorCountValid = Number.isFinite(visitorCountValue) && visitorCountValue > 0;

    const getAllRowsForTab = (tab) => {
        return Object.values(allWeekData).flatMap((week) => week[tab] || []);
    };

    const allSelfRows = getAllRowsForTab('self');
    const allVisitorRows = getAllRowsForTab('visitor');

    const selfHasAtLeastOneCanteen = allSelfRows.some((row) => Boolean(row.factoryCode));
    const visitorHasAtLeastOneCanteen = allVisitorRows.some((row) => Boolean(row.factoryCode));

    const canRegister = activeTab === 'visitor'
        ? visitorHasAtLeastOneCanteen && isVisitorCountValid
        : selfHasAtLeastOneCanteen;

    const handleSaveAll = () => {
        if (!canRegister) {
            return;
        }

        const payload = {
            tab: activeTab,
            visitorCount: activeTab === 'visitor' ? String(formik.values.visitorCount) : null,
            visitorDepartment: activeTab === 'visitor' ? formik.values.visitorDepartment : null,
            rows: selectedDateRows,
        };

        console.log('Save all attendance rows:', payload);
        alert('Saved all rows successfully');
    };



    return (
        <main style={{ minHeight: '100vh', paddingTop: '96px' }}>
            <div style={{ maxWidth: '996px', margin: '0 auto' }}>
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '20px',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '8px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}
                >

                    {showSelfTab && (
                        <button
                            id="tab-self-attendance"
                            type="button"
                            onClick={() => setActiveTab('self')}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: activeTab === 'self' ? '2px solid #22d3ee' : '2px solid transparent',
                                boxShadow: activeTab === 'self' ? '0 0 0 2px rgba(34, 211, 238, 0.25), 0 8px 20px rgba(59, 130, 246, 0.25)' : 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                backgroundColor: activeTab === 'self' ? '#0f172a' : '#e2e8f0',
                                color: activeTab === 'self' ? '#ffffff' : '#0f172a',
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
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: activeTab === 'visitor' ? '2px solid #a78bfa' : '2px solid transparent',
                            boxShadow: activeTab === 'visitor' ? '0 0 0 2px rgba(167, 139, 250, 0.25), 0 8px 20px rgba(168, 85, 247, 0.25)' : 'none',
                            cursor: 'pointer',
                            fontWeight: 700,
                            backgroundColor: activeTab === 'visitor' ? '#0f172a' : '#e2e8f0',
                            color: activeTab === 'visitor' ? '#ffffff' : '#0f172a',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Visitors Registration
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
                                            htmlFor="visitor-count"
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
                                                    background: '#2563eb',
                                                    color: '#ffffff',
                                                    fontSize: '16px',
                                                    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)',
                                                }}
                                            >
                                                <Users size={16} />
                                            </span>
                                            Number of Visitors
                                            <input
                                                id="visitor-count"
                                                type="number"
                                                min="1"
                                                name="visitorCount"
                                                value={formik.values.visitorCount}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                placeholder="Enter visitor count"
                                                style={{
                                                    width: '120px',
                                                    padding: '8px 12px',
                                                    border: `2px solid ${formik.touched.visitorCount && formik.errors.visitorCount ? '#ef4444' : '#93c5fd'}`,
                                                    borderRadius: '10px',
                                                    background: '#ffffff',
                                                    color: '#0f172a',
                                                    fontWeight: 700,
                                                    textAlign: 'center',
                                                    outline: 'none',
                                                }}
                                            />
                                            {formik.touched.visitorCount && formik.errors.visitorCount && (
                                                <span style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 700 }}>
                                                    {formik.errors.visitorCount}
                                                </span>
                                            )}
                                        </label>

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
                                                    background: '#7c3aed',
                                                    color: '#ffffff',
                                                    fontSize: '16px',
                                                    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.35)',
                                                }}
                                            >
                                                <Building2 size={16} />
                                            </span>
                                            Department
                                            <select
                                                id="visitor-department"
                                                name="visitorDepartment"
                                                value={formik.values.visitorDepartment}
                                                onChange={(e) => {
                                                    setVisitorDepartment(e.target.value);
                                                    formik.setFieldValue('visitorDepartment', e.target.value);
                                                }}
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
                                    onClick={() => {
                                        const currentWeekOffset = weekOffset;
                                        const newOffset = currentWeekOffset - 1;
                                        const saved = allWeekData[newOffset]?.[activeTab];
                                        const newRows = saved || buildNextSevenDays(newOffset);
                                        setWeekOffset(newOffset);
                                        setSelectedDateRows(newRows);
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
                                    onClick={() => {
                                        setWeekOffset(0);
                                        const saved = allWeekData[0]?.[activeTab];
                                        setSelectedDateRows(saved || buildNextSevenDays(0));
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
                                    onClick={() => {
                                        const currentWeekOffset = weekOffset;
                                        const newOffset = currentWeekOffset + 1;
                                        const saved = allWeekData[newOffset]?.[activeTab];
                                        const newRows = saved || buildNextSevenDays(newOffset);
                                        setWeekOffset(newOffset);
                                        setSelectedDateRows(newRows);
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

                            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <thead>
                                    <tr>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700 }}>Ngày</th>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700 }}>Meal</th>
                                        <th style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', padding: '10px 12px', color: '#0f172a', background: '#f1f5f9', fontWeight: 700 }}>Canteen</th>
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
                                                                return (
                                                                    <button
                                                                        key={`${row.id}-${factory.value}`}
                                                                        type="button"
                                                                        onClick={() => handleRowFactoryChange(row.date, factory.code, row.id)}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            flex: 1,
                                                                            gap: '6px',
                                                                            fontWeight: isSelected ? 700 : 600,
                                                                            color: isSelected ? '#ffffff' : '#0f172a',
                                                                            background: isSelected ? '#13005f' : '#f1f5f9',
                                                                            border: isSelected ? '2px solid #13005f' : '2px solid #e2e8f0',
                                                                            borderRadius: '8px',
                                                                            padding: '6px 4px',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s ease',
                                                                            boxShadow: isSelected ? '0 4px 12px rgba(19, 0, 95, 0.35)' : 'none',
                                                                            marginRight: factories.indexOf(factory) < factories.length - 1 ? '6px' : '0',
                                                                        }}
                                                                    >
                                                                        {factory.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    {activeTab === 'visitor' && (
                                                        <td style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 12px', background: rowColors[colorIdx].bg }}>
                                                            {row.mealKey === 'breakfast' ? (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Enter pre-order note"
                                                                    value={row.breakfastNote || ''}
                                                                    onChange={(e) => handleBreakfastNoteChange(row.date, e.target.value, row.id)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '6px 10px',
                                                                        border: '2px solid #e2e8f0',
                                                                        borderRadius: '8px',
                                                                        background: '#ffffff',
                                                                        color: '#0f172a',
                                                                        fontWeight: 600,
                                                                        outline: 'none',
                                                                    }}
                                                                />
                                                            ) : (
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
                        onClick={() => {
                            formik.resetForm();
                            setVisitorDepartment('');
                            setWeekOffset(0);
                            setActiveTab('self');
                            const fresh = buildNextSevenDays(0);
                            setSelectedDateRows(fresh);
                            setAllWeekData({ 0: { self: fresh, visitor: fresh } });
                            allWeekDataRef.current = { 0: { self: fresh, visitor: fresh } };
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
                        disabled={!canRegister}
                        style={{
                            background: canRegister ? '#04085aff' : '#94a3b8',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 18px',
                            cursor: canRegister ? 'pointer' : 'not-allowed',
                            fontWeight: 700,
                            transition: 'all 0.3s ease',
                            filter: canRegister ? 'none' : 'grayscale(0.3)',
                        }}
                    >
                        Register
                    </button>
                </div>
            </div>
        </main>
    );
};

export default CanteenAttendanceRegistration;
