import { useRouter } from "next/router";
import CartService from "./api/cart.service";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const WordpressCart = () => {
  const router = useRouter();
  const manageData = (title, price, mysql_id) => {
    if (title && price && mysql_id) {
      var data = {
        title: title,
        price: price,
        mysql_id: mysql_id
      };
    }
    CartService.wordpressAddToCart(data)
      .then((res) => {
        console.log(res, "ress okayyy");
        if (res && res.status === 200) {
          // alert("okay it's done");
          toast.success("Course added successfully in cart");
          return router.push("/cart");
        } else if (res.status === 409) {
          toast.error(res.data.message);
          return router.push("/cart");
        }
      })
      .catch((e) => {
        console.log("Error:::", e);
      });
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.search.length > 0) {
      var searchParams = url.searchParams;
      var title = searchParams?.get("title");
      var price = searchParams?.get("price");
      var mysql_id = searchParams?.get("mysql_id");
    }
    if (Cookies.get("loggedIn")) {
      manageData(title, price, mysql_id);
    }
    if (!Cookies.get("loggedIn")) {
      toast.error("Please Login First");
      router.push(`/login?title=${title}&price=${price}&mysql_id=${mysql_id}`);
    }
  }, []);

  function onClicked() {}

  return (
    <>
      <ToastContainer autoClose={2000} />
    </>
    // <div>
    //   <button onClick={onClicked}>Click to add to cart</button>
    // </div>
  );
};

export default WordpressCart;
