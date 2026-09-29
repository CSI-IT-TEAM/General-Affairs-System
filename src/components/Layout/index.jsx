import Header from "../Header";
import Footer from "../Footer";
import CarouselDialog from "../Dialog/Carousel";

const Layout = ({children}) => {
    return (
        <>
            <Header />
            {children}
            {/* <Footer /> */}
            <CarouselDialog />
        </>
    );
}

export default Layout;