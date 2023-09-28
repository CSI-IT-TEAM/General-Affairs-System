import { createBrowserRouter, RouterProvider } from "react-router-dom";

import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import FormCar from "./pages/FormPage/FormCar";
import HistoryPage from "./pages/HistoryPage/HistoryPage";
import Layout from "./components/Layout";
import ErrorPage from "./pages/ErrorPage";

import "./App.scss";
import 'devextreme/dist/css/dx.light.css';
import FormChangePass from "./pages/FormPage/FormChangePass";

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
        path: "/user/history",
        errorElement: <ErrorPage />,
        element: (
            <Layout>
                <HistoryPage />
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