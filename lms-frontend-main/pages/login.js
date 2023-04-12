import Link from "next/link";
import { useState } from "react";
import PageBanner from "../src/components/PageBanner";
import Layout from "../src/layout/Layout";
import Router from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthService from "./api/auth.service";
import Cookies from "js-cookie";
import CartService from "./api/cart.service";
import { useRouter } from "next/router";
const Login = () => {
  const router = useRouter();
  const [input, setInput] = useState({
    username: "",
    password: ""
  });

  const [error, setError] = useState({
    username: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput((prevState) => ({
      ...prevState,
      [name]: value
    }));
    validateInput(e);
  };

  // Validate input errors
  const validateInput = (e) => {
    let { name, value } = e.target;
    setError((prev) => {
      const stateObj = { ...prev, [name]: "" };
      switch (name) {
        case "username":
          if (!value) {
            stateObj[name] = "Please enter email.";
          }
          break;
        case "password":
          if (!value) {
            stateObj[name] = "Please enter Password.";
          }
          break;
        default:
          break;
      }
      return stateObj;
    });
  };

  const manageData = (title, price, mysql_id) => {
    if (title && price && mysql_id) {
      const data = {
        title: title,
        price: price,
        mysql_id: mysql_id
      };
      CartService.wordpressAddToCart(data)
        .then((res) => {
          if (res && res.status === 200) {
            toast.success("Course added successfully in cart");
            // return router.push("/cart");
          } else if (res.status === 409) {
            toast.error(res.data.message);
            return router.push("/cart");
          }
        })
        .catch((e) => {
          console.log("Error:::", e);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { username, password } = input;
    if (username === "" || password === "") {
      setError((prev) => ({
        ...prev,
        username: "Please enter email !",
        password: "Please enter password !"
      }));
      return;
    }
    //login service
    AuthService.login(username, password)
      .then((response) => {
        // console.log("response====", response)
        if (response.status === 200) {
          Cookies.set("loggedIn", true);
          // if(response.data && response.data.type === "teacher"){
          Cookies.set("type", response.data.type);
          Cookies.set("admin", response.data.admin);

          const url = new URL(window.location.href);
          if (url.search.length > 0) {
            var searchParams = url.searchParams;
            var title = searchParams?.get("title");
            var price = searchParams?.get("price");
            var mysql_id = searchParams?.get("mysql_id");
            manageData(title, price, mysql_id);
          }
          Router.push("/faculty");

          // }
        } else if (response.response.status === 403) {
          toast.error(`Error: ${response.response.data.message}`);
        }
      })
      .catch((error) => {
        toast.error(`Error: ${error.message}`);
      });
  };

  return (
    <Layout>
      <PageBanner pageName={"login"} />
      {/* login Form Start */}
      <section className="contact-form-area wow fadeInUp delay-0-2s">
        <div className="container">
          <ToastContainer autoClose={2000} />
          <div className="row justify-content-center">
            <form onSubmit={handleSubmit} id="login-form" className=" p-50 z-1 rel" name="contact-form" action="#" method="post" autoComplete="off">
              <div className="row mt-25 justify-content-center">
                <div className="col-md-12">
                  <div className="form-group mb-0">
                    <input
                      type="email"
                      id="email-address"
                      value={input.username}
                      onChange={handleChange}
                      onBlur={validateInput}
                      name="username"
                      className="form-control"
                      placeholder="Email Address"
                      // required
                    />
                    {error.username && <span className="err">{error.username}</span>}
                  </div>
                </div>
              </div>
              <div className="row mt-25 justify-content-center">
                <div className="col-md-12">
                  <div className="form-group">
                    <input
                      type="password"
                      id="password"
                      value={input.password}
                      onChange={handleChange}
                      onBlur={validateInput}
                      name="password"
                      className="form-control"
                      placeholder="Enter password"
                      // required
                    />
                    {error.password && <span className="err">{error.password}</span>}
                  </div>
                </div>
                <div className="col-md-12 mb-3">
                  <div className="form-group text-center mb-0">
                    <button type="submit" className="theme-btn">
                      login
                      <i className="fas fa-arrow-right" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-Just-between">
                <Link href="/register">Don&apos;t have an account?</Link>
                <Link href="/forgotpassword">Forgot password?</Link>
              </div>
            </form>
          </div>
        </div>
      </section>
      {/* login Form End */}
    </Layout>
  );
};

export default Login;
