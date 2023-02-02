import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StudentService from "../../pages/api/student.service";
import AdminService from "../../pages/api/admin.service";
import EditCouponCode from "./edit_coupon_code";
import { useRouter } from "next/router";

function FeedbackList() {
  const [allComment, setAllComment] = useState([]);
  const [course, setCourse] = useState();
  const router = useRouter();
  const mlist = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    fn();
    findCourse();
  }, []);

  const findCourse = async () => {
    const response = await AdminService.listCourseDetails();
    setCourse(response.data.data);
  };

  const getTiming = (dateTime) => {
    const date = new Date(dateTime);
    return String(date.getDate()) + " " + String(mlist[date.getMonth()].slice(0, 3));
  };

  async function deleteHandler(id) {
    const response = await StudentService.deletefeedback(id);
    if (response.status == 204) {
      toast.success(" Feedback deleted successfully");
      return router.push("/admin-dashboard");
    }
    if (response.status != 204) {
      return toast.error("something went wrong!!Please try again");
    }
  }

  async function fn() {
    const response = await StudentService.listfeedback();

    if (response) setAllComment(response.data);
  }
  return (
    <>
      <section className="container-fluid py-5">
        <div className="row">
          <div className="col col-9">
            <div className="container">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col" className="text-center">
                      Email
                    </th>
                    <th scope="col" className="text-center">
                      Mobile No.
                    </th>
                    <th scope="col" className="text-center">
                      Course
                    </th>
                    <th scope="col" className="text-center">
                      Batch
                    </th>
                    <th scope="col" className="text-center">
                      Comment
                    </th>
                    <th scope="col" className="text-center">
                      Date-time
                    </th>
                    <th scope="col" className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allComment.map((c, i) => (
                    <tr key={i}>
                      <th scope="row text-nowrap">{c.name}</th>
                      <td className="text-center text-nowrap">{c.email}</td>
                      <td className="text-center text-nowrap">{c.mobile}</td>
                      <td className="text-center text-nowrap">{c.course}</td>
                      <td className="text-center text-nowrap">{c.batch_name}</td>
                      <td className="text-center text-wrap ">{c.detail}</td>
                      <td className="text-center text-nowrap">{getTiming(c.feedback_timing)}</td>
                      <td className="text-center text-nowrap">
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

      <div>
        <ToastContainer autoClose={2000} />
      </div>
    </>
  );
}
export default FeedbackList;
