import { createBrowserRouter, RouterProvider } from "react-router-dom";

import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import FormCar from "./pages/FormPage/FormCar";

import HistoryPage from "./pages/HistoryPage/HistoryPage";
import Layout from "./components/Layout";
import ErrorPage from "./pages/ErrorPage";
import "rsuite/dist/rsuite-no-reset.css"; 
import 'devextreme/dist/css/dx.light.css';
import "./App.scss";
import FormChangePass from "./pages/FormPage/FormChangePass";
import FormHospital from "./pages/FormPage/FormHospital";
import HistoryMedicalPage from "./pages/HistoryPage/HistoryMedicalPage";
import PickleballBooking from "./pages/PickleballBooking";
import MeetingRoomBooking from "./pages/MeetingRoomBooking";
import TemporaryResidence from "./pages/TemporaryResidence";
import CanteenAttendanceRegistration from "./pages/CanteenAttendanceRegistration";
import BusinessTripForm from "./pages/FormPage/BusinessTripForm";
const router = createBrowserRouter([
    {
        path: "/signin",
        errorElement: <ErrorPage />,
        element: <SignIn />,
    },
    {
        path: "/",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <HomePage />
            </Layout>
        ),
    },
    {
        path: "/request/car",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <FormCar />
            </Layout>
        ),
    },
    {
        path: "/fee/medical",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <FormHospital />
            </Layout>
        ),
    },
    {
        path: "/user/history",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <HistoryPage />
            </Layout>
        ),
    },
    {
        path: "/fee/medical/history",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <HistoryMedicalPage />
            </Layout>
        ),
    },
    {
        path: "/user/passwordchange",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <FormChangePass />
            </Layout>
        ),
    },
    {
        path: "/booking/pickleball",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <PickleballBooking />
            </Layout>
        ),
    },
    {
        path: "/booking/meeting-room",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <MeetingRoomBooking />
            </Layout>
        ),
    },
    {
        path: "/registration/temporary-residence",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <TemporaryResidence />
            </Layout>
        ),
    },
    {
        path: "/registration/canteen-attendance",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <CanteenAttendanceRegistration />
            </Layout>
        ),
    },

    {
        path: "/registration/business-trip",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <BusinessTripForm />
            </Layout>
        ),
    },
    {
        path: "*",
        element: (
            <ErrorPage />
        ),
    },
]);

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;
