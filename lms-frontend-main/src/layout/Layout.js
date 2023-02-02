import { Fragment, useEffect, useState } from "react";
// import niceSelect from "react-nice-select";
import ImageView from "../components/ImageView";
import VideoPopup from "../components/VideoPopup";
import { animation } from "../utils";
import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./Sidebar";
import CartService from "../../pages/api/cart.service";

const Layout = ({ children, footer }) => {
  const [cartcount, setCartCount] = useState(0);

  useEffect(() => {
    getCartInfo();
  }, []);

  const getCartInfo = () => {
    CartService.getCartInfo()
      .then((res) => {
        if (res && res.status === 200) {
          setCartCount(res.data.data.length);
        }
      })
      .catch((e) => {});
  };

  useEffect(() => {
    animation();

    // niceSelect();
  }, []);

  return (
    <Fragment>
      <VideoPopup />
      <ImageView />
      <div className="page-wrapper">
        {/* Preloader */}
        {/* <div className="preloader" /> */}
        {/* main header */}
        <Header cartcount={cartcount} />
        {/*Form Back Drop*/}
        <Sidebar />
        {/*End Hidden Sidebar */}
        {children}
        {/* Footer Area Start */}
        <Footer footer={footer} />
        {/* Footer Area End */}
      </div>
    </Fragment>
  );
};
export default Layout;
