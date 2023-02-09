import { createBrowserRouter, RouterProvider } from "react-router-dom";

import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import FormCar from "./pages/FormPage/FormCar";
import Layout from "./components/Layout";
import ErrorPage from "./pages/ErrorPage";

import "./App.scss";
import 'devextreme/dist/css/dx.light.css';

const router = createBrowserRouter([
    {
        path: "/signin",
        element: <SignIn />,
    },
    {
        path: "/",
        element: (
            <Layout>
                <HomePage />
            </Layout>
        ),
    },
    {
        path: "/request/car",
        element: (
            <Layout>
                <FormCar />
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
