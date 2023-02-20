import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Form from "react-bootstrap/Form";
import { Button, Col, Row } from "react-bootstrap";
import Badge from "react-bootstrap/Badge";
import { v4 as uuid } from "uuid";
import FacultyService from "../../pages/api/faculty.service";
import AdminService from "../../pages/api/admin.service";
import AddCouponCode from "./add_coupon_code";
import CartService from "../../pages/api/cart.service";
import EditCouponCode from "./edit_coupon_code";
import { useRouter } from "next/router";
import Link from "next/link";
function CouponCode(props) {
  const [addButton, setAddButton] = useState(false);
  const [allCode, setAllCode] = useState([]);
  const [openedit, setOpenEdit] = useState(false);
  const [codeData, setCodeData] = useState({});
  const router = useRouter();
  useEffect(() => {
    fn();
  }, []);

  function editHandler(c) {
    setOpenEdit(true);
    setCodeData(c);
  }

  async function deleteHandler(id) {
    const response = await CartService.deleteCoupon(id);
    if (response.status == 204) {
      toast.success(" Coupon Code deleted successfully");
      router.push("/admin-dashboard");
    }
    if (response.status != 204) {
      return toast.error("something went wrong!!Please try again");
    }
  }

  async function fn() {
    const response = await CartService.showCoupons();
    setAllCode(response.data);
  }
  return (
    <>
      {openedit ? (
        <EditCouponCode codeData={codeData} />
      ) : !addButton ? (
        <section className="container-fluid py-5">
          <div className="row">
            <div className="col col-9">
              <div className="container">
                <a className="btn btn-sm btn-primary mb-3" onClick={() => setAddButton(true)}>
                  ADD
                </a>
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col" className="text-center">
                        Discount (in %)
                      </th>
                      <th scope="col" className="text-center">
                        Status
                      </th>
                      <th scope="col" className="text-center">
                        Action.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCode.map((c, i) => (
                      <tr key={i}>
                        <th scope="row">{c.code}</th>
                        <td className="text-center">{c.discount}</td>
                        <td className="text-center">{c.active ? "✅" : "❌"}</td>
                        <td className="text-center">
                          <a
                            onClick={() => {
                              editHandler(c);
                            }}
                          >
                            📝
                          </a>
                          <a
                            onClick={() => {
                              deleteHandler(c.id);
                            }}
                          >
                            🗑️
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <AddCouponCode />
      )}
    </>
  );
}
export default CouponCode;
