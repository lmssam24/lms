import React, { useState } from "react";
import CartService from "../../pages/api/cart.service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { useRouter } from "next/router";
const AddCouponCode = () => {
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [active, setActive] = useState(true);
  const router = useRouter();
  var isActiveOrNot = [
    { value: true, name: "Active" },
    { value: false, name: "Disabled" }
  ];

  const submitCodeData = async (e) => {
    e.preventDefault();
    if (!couponCode || !discount || !validFrom || !validTo) {
      return toast.warn("Please enter all the data carefully");
    }
    const response = await CartService.addCoupon({
      code: couponCode,
      discount: discount,
      valid_from: validFrom,
      valid_to: validTo,
      active: active
    });
    if (response.status == 200) {
      toast.success("Success: Coupon Code added successfully");
      router.push("/admin-dashboard");
    } else {
      let k = Object.keys(response.data)[0];
      return toast.error(response.data[k][0]);
    }
  };

  return (
    <>
      <section className="container-fluid">
        <div className="row">
          <div className="col">
            <div className="container">
              <h5>Add a Coupon</h5>
              <Link href="/admin-dashboard" key="go_back" style={{ textDecoration: "none" }}>
                <button className="btn btn-sm btn-primary mt-2"> Go Back </button>
              </Link>
              {/* <a href="/coupon/all" className="btn btn-sm btn-primary mt-2">
                Go Back
              </a> */}
            </div>
            <br />
            <div className="container table-style card pt-3 px-5 shadow-lg p-3 mb-5 bg-body rounded">
              <p>Please enter either discount in percentages or flat, don't enter both at a time.</p>
              <form onSubmit={submitCodeData}>
                <div className="row">
                  <div className="col col-4 mb-3">
                    <label htmlFor="coupon">Enter the coupon code</label>
                    <input
                      className="form-control rounded-0"
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                      }}
                      type="text"
                      name="coupon"
                      id="coupon"
                      placeholder="Coupone Code"
                    />
                  </div>
                  <div className="col col-4 mb-3">
                    <label htmlFor="discountinpercentage">Discount in(%)</label>
                    <input
                      className="form-control rounded-0"
                      type="number"
                      onChange={(e) => {
                        setDiscount(e.target.value);
                      }}
                      name="discountinpercentage"
                      id="discountinpercentage"
                      placeholder="in %"
                    />
                  </div>
                  <div className="col col-4 mb-3">
                    <label htmlFor="valid_from">Valid From</label>
                    <input
                      className="form-control rounded-0"
                      type="datetime-local"
                      onChange={(e) => {
                        setValidFrom(e.target.value);
                      }}
                      name="valid_from"
                      id="valid_from"
                    />
                  </div>
                  <div className="col col-4 mb-3">
                    <label htmlFor="valid_to">Valid to</label>
                    <input
                      className="form-control rounded-0"
                      type="datetime-local"
                      onChange={(e) => {
                        setValidTo(e.target.value);
                      }}
                      name="valid_to"
                      id="valid_to"
                    />
                  </div>
                  <div className="col col-3 mb-3">
                    <label htmlFor="isActiveOrNot">Status of coupon</label>
                    <div className="d-flex justify-content-between mt-1">
                      <div>
                        <input
                          type="radio"
                          className="form-control rounded-0"
                          name="isActiveOrNot"
                          id="isActiveOrNot"
                          checked
                          onChange={() => {
                            setActive(true);
                          }}
                          // value={this.state.isActiveOrNot[0].value}
                        />{" "}
                        {isActiveOrNot[0].name}
                      </div>
                      <div>
                        <input
                          type="radio"
                          className="form-control rounded-0"
                          name="isActiveOrNot"
                          id="isActiveOrNot"
                          onChange={() => {
                            setActive(false);
                          }}
                          // value={this.state.isActiveOrNot[1].value}
                        />{" "}
                        {isActiveOrNot[1].name}
                      </div>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary my-3 button-style" type="submit">
                  submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default AddCouponCode;
