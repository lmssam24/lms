import PageBanner from "../src/components/PageBanner";
import Layout from "../src/layout/Layout";
const county_state = require("../public/assets/files/countries+states.json");
import { useEffect } from "react";
import { useState } from "react";
import CartService from "./api/cart.service";
import ProfileService from "./api/profile.service";
import AdminService from "./api/admin.service";

import { Modal, ResponsiveEmbed } from "react-bootstrap";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Checkout = () => {
  const router = useRouter();
  const [cartList, setCartList] = useState([]);
  const [couponForm, setCouponForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [priceAfterDiscount, setPriceAfterDiscount] = useState(0);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [emiPrice, setEmiPrice] = useState(0);
  const [courseprice, setCoursePrice] = useState(0);
  const [coursename, setCourseName] = useState("");
  const [userId, setUserId] = useState("");
  const [emioffer, setEmiOfferMonth] = useState(0);
  const [userVerificationcheck, setUserVerified] = useState(false);
  const [userDetail, setUserDetail] = useState();
  const [modalText, setModalText] = useState({
    heading: "Payment",
    context: "Thank you for your order.<br/> We are now redirecting you to CcAvenue to make payment."
  });
  const [courseList, setCourseList] = useState([]);
  const [product, setProduct] = useState([]);

  const [checkout, setCheckout] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    company_name: "",
    company_address: "",
    country: "India",
    state: "",
    city: "",
    zipcode: "",
    street: "",
    address: "",
    note: "",
    total_amount: 0,
    coupon: couponCode,
    discount,
    final_amount: 0,
    cart: []
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    ProfileService.userProfile().then((userres) => {
      if (userres && userres.data && userres.data.data) {
        if (userres.data.data.id == searchParams?.get("credential")) {
          setUserDetail(userres.data.data);
        }
      }
    });
  }, []);

  useEffect(() => {
    // console.log(window?.location.href, "window locationnnn okayyy done...");
    const url = new URL(window.location.href);
    if (url.search.length > 0) {
      const searchParams = url.searchParams;
      setEmiPrice(searchParams?.get("emiamount"));
      setCoursePrice(searchParams?.get("courseprice"));
      setCourseName(searchParams?.get("course"));
      setUserId(searchParams?.get("credential"));
      setEmiOfferMonth(searchParams?.get("emi_offer"));
      const id = searchParams?.get("productid");
      AdminService.listCourseDetails().then((res) => {
        if (res && res.data && res.data.data) {
          res.data.data.forEach((element) => {
            if (element.course.id == id) {
              let product = {};
              product["product"] = element;
              product["user"] = userDetail;
              setProduct([product]);
            }
          });
        }
      });
    }
  }, [userDetail]);

  useEffect(() => {
    ProfileService.userProfile().then((res) => {
      if (res && res.data && res.data.data) {
        if (res.data.data.id == userId) {
          setUserVerified(true);
        }
      }
    });
  }, [userId]);

  // useEffect(() => {
  //   setPriceAfterDiscount(checkout?.total_amount - (discount * checkout?.total_amount) / 100);
  // }, [discount]);

  async function submitCoupon(e) {
    e.preventDefault();
    const response = await CartService.couponVerification(couponCode);
    if (response.status == 200) {
      setDiscount(response.data.discount);
      return toast.success("coupon code applied successfully");
    }
    if (response.status == 404) {
      return toast.warning("Seems like you are entering the wrong code.Please enter the code carefully");
    } else {
      return toast.error("Something went wrong");
    }
  }

  useEffect(() => {
    getCartInfo();
  }, []);

  useEffect(() => {
    if (router?.query?.app_code || router?.query?.code) {
      setModalText({
        heading: "Payment",
        context: "Validating the data"
      });
      setOpenPaymentModal(true);
      validateTransaction(router?.query);
    } else {
    }
  }, [router.query]);

  useEffect(() => {
    if (cartList) {
      let temp_total = 0;
      cartList?.forEach((cart_list) => {
        temp_total += +cart_list?.product?.price?.price;
      });
      // console.log(typeof temp_total, Number(Number(emiPrice).toFixed(2)), "carttttt");
      temp_total = emiPrice ? parseInt(emiPrice) : temp_total;
      setCheckout((prevState) => ({
        ...prevState,
        total_amount: temp_total,
        final_amount: temp_total - (temp_total * discount) / 100,
        cart: emiPrice ? product : cartList
      }));
    }
  }, [cartList, discount, product]);

  const getCartInfo = () => {
    CartService.getCartInfo()
      .then((res) => {
        if (res && res.status === 200) {
          setCartList(res.data.data);
        }
      })
      .catch((e) => {
        setCartList([]);
      });
  };

  const validateTransaction = (data) => {
    CartService.validateTransaction(data)
      .then((res) => {
        if (res && res.status === 200) {
          let data = res?.data;
          if (data?.success) {
            setModalText({
              heading: "Payment received",
              context: "Your transaction was successful!,<br/> Page will be redirected to home in 5 Seconds"
            });
            setTimeout(() => {
              return router.push("/");
            }, 5000);
          } else {
            setModalText({
              heading: "Payment Failed",
              context: "Your transaction was failed!,<br/> Page will be redirected to cart in 5 Seconds"
            });
            setTimeout(() => {
              return router.push("/cart");
            }, 5000);
          }
        }
      })
      .catch((e) => {
        setCartList([]);
      });
  };

  const doCheckout = (e) => {
    e.preventDefault();
    setOpenPaymentModal(true);
    setModalText({
      heading: "Payment",
      context: "Thank you for your order. We are now redirecting you to CcAvenue to make payment."
    });
    CartService.checkout(checkout)
      .then((res) => {
        if (res && res.status === 200) {
          setTimeout(() => {
            // window.open(res.data.payment_url,"_target")
            window.location.href = res.data.payment_url;
          }, 2000);
        } else {
          setOpenPaymentModal(false);
        }
      })
      .catch((e) => {
        setCartList([]);
      });
  };

  return (
    <Layout>
      <PageBanner pageName={"Checkout"} />
      <section className="checkout-area pt-130 rpt-95 pb-100 rpb-70">
        <form onSubmit={(e) => doCheckout(e)} id="payment-method" name="payment-method" className="checkout-form mb-30">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <h3 className="from-title mb-25">Order Confirmation</h3>
                <hr />
                <div className="row mt-35">
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="first-name"
                        name="first-name"
                        className="form-control"
                        value={checkout?.first_name}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            first_name: e.target.value
                          }));
                        }}
                        placeholder="First Name"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="last-name"
                        name="last-name"
                        className="form-control"
                        value={checkout?.last_name}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            last_name: e.target.value
                          }));
                        }}
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="tel"
                        id="number"
                        name="number"
                        className="form-control"
                        value={checkout?.phone_number}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            phone_number: e.target.value
                          }));
                        }}
                        placeholder="Phone Number"
                        pattern="[1-9][0-9]{9}"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="email"
                        id="emailAddress"
                        name="email"
                        className="form-control"
                        value={checkout?.email}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            email: e.target.value
                          }));
                        }}
                        placeholder="Email Address"
                        pattern="^\S+@\S+\.\S+$"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="company-name"
                        name="company-name"
                        className="form-control"
                        value={checkout?.company_name}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            company_name: e.target.value
                          }));
                        }}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="company-address"
                        name="company-address"
                        className="form-control"
                        value={checkout?.company_address}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            company_address: e.target.value
                          }));
                        }}
                        placeholder="Company Address"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <h6>Your Address</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <select
                        name="country"
                        id="country"
                        value={checkout?.country}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            country: e.target.value
                          }));
                        }}
                      >
                        <option value={null}>Select Country</option>
                        {county_state.map((a, idx) => (
                          <option key={idx} value={a.name}>
                            {a?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <select
                        name="state"
                        id="state"
                        value={checkout?.state}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            state: e.target.value
                          }));
                        }}
                      >
                        <option value={null}>Select State</option>
                        {county_state
                          .find((c) => c.name == checkout.country)
                          ?.states?.map((a, idx) => (
                            <option key={idx} value={a.name}>
                              {a?.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="city"
                        name="city"
                        className="form-control"
                        value={checkout?.city}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            city: e.target.value
                          }));
                        }}
                        placeholder="City"
                        required=""
                      />
                    </div>
                  </div>
                  {/* <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="state"
                        name="state"
                        className="form-control"
                        defaultValue=""
                        placeholder="State"
                        required=""
                      />
                    </div>
                  </div> */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="zip"
                        name="zip"
                        className="form-control"
                        value={checkout?.zipcode}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            zipcode: e.target.value
                          }));
                        }}
                        placeholder="Zip"
                        required=""
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="street-name"
                        name="street-name"
                        className="form-control"
                        value={checkout?.street}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            street: e.target.value
                          }));
                        }}
                        placeholder="House, street name"
                        required=""
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="apartment-name"
                        name="apartment-name"
                        className="form-control"
                        value={checkout?.address}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            address: e.target.value
                          }));
                        }}
                        placeholder="Apartment, suite, unit etc."
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <h6>Order Notes</h6>
                  </div>
                  <div className="col-md-12">
                    <div className="form-group">
                      <textarea
                        name="order-note"
                        id="order-note"
                        className="form-control"
                        rows={5}
                        placeholder="Notes about your order, e.g. special notes for delivery."
                        value={checkout?.note}
                        onChange={(e) => {
                          setCheckout((prevState) => ({
                            ...prevState,
                            note: e.target.value
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <h3 className="from-title mb-25">Order Summary</h3>
                {/* <div className="row mb-3 pt-5">
                  <div className="col-8 pr-0 mr-0">
                    <input
                      className="coupon-code rounded-0"
                      type="text"
                      placeholder="Coupon Code"
                    /></div>
                  <div className="col-4 pl-0 ml-0">
                    <button type="button" className="theme-btn w-100 rounded-0">
                      Apply
                    </button>
                  </div>

                </div> */}
                <div className="package-summary mb-25">
                  <table>
                    <tbody>
                      {!emiPrice ? (
                        <>
                          {cartList?.map((item, index) => (
                            <tr key={index}>
                              <td>
                                {item?.product?.title}
                                <strong> × 1</strong>
                              </td>
                              <td>INR {(+item?.product?.price?.price).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td>
                              <strong>Order Total</strong>
                            </td>
                            <td>
                              <strong>INR {checkout?.total_amount}</strong>
                            </td>
                          </tr>
                        </>
                      ) : userVerificationcheck ? (
                        <>
                          <tr>
                            <td>
                              {coursename}
                              {/* <strong> × 1</strong> */}
                            </td>
                            <td>INR {courseprice}</td>
                          </tr>

                          <tr>
                            <td>
                              <strong>This Month Emi:</strong>
                            </td>
                            <td>
                              <strong>INR {parseInt(emiPrice).toFixed(2)}</strong>
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td>You are not an authorized user for the emi offer</td>
                          </tr>
                        </>
                      )}

                      {discount ? (
                        <>
                          <tr>
                            <td>
                              <strong>Discount applied</strong>
                            </td>
                            <td>
                              <strong>{discount}%</strong>
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <strong>Now Total</strong>
                            </td>
                            <td>
                              <strong>INR {checkout?.total_amount - (discount * checkout?.total_amount) / 100}</strong>
                            </td>
                          </tr>
                        </>
                      ) : (
                        ""
                      )}
                    </tbody>
                  </table>
                </div>
                {/* coupon code related */}
                {!couponForm && (
                  <div>
                    <a
                      style={{ color: "blue" }}
                      onClick={() => {
                        setCouponForm(true);
                      }}
                    >
                      Do you have a coupon code?
                    </a>
                  </div>
                )}

                {couponForm && !discount && (
                  <div>
                    <input
                      id="couponcode"
                      name="couponcode"
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                      }}
                      type="text"
                      className="form-control"
                      placeholder="Enter coupon code"
                    />
                    <button type="button" onClick={submitCoupon} className="theme-btn mt-3 w-30">
                      Apply
                    </button>
                  </div>
                )}

                {/* <h5 className="title mt-20 mb-15">Payment Method</h5>
                <div className="form-group">
                  <select name="payment" id="payment">
                    <option value="default">Choose an Option</option>
                    <option value="payment1">chash on delivey</option>
                    <option value="payment2">Bank Transfer</option>
                    <option value="payment3">Paypal</option>
                  </select>
                </div> */}
                <button type="submit" className="theme-btn mt-30 w-100">
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      <Modal show={openPaymentModal} data-backdrop="static" data-keyboard="false">
        <Modal.Header>{modalText?.heading}</Modal.Header>
        <Modal.Body>
          <div dangerouslySetInnerHTML={{ __html: modalText?.context }}></div>

          {/* Thank you for your order. We are now redirecting you to CcAvenue to make payment. */}
        </Modal.Body>
      </Modal>
      <ToastContainer autoClose={2000} />
    </Layout>
  );
};
export default Checkout;
