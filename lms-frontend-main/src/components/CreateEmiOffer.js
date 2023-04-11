import React, { useState, useEffect } from "react";
import FacultyService from "../../pages/api/faculty.service";
import LinkGenerated from "./LinkGenerated";
import UserService from "../../pages/api/user.service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";
function CreateEmiOffer({ id, emi_option }) {
  const [courseList, setCourseList] = useState([]);
  const [course, setCourse] = useState("");
  // var [emiOffer, setEmiOffer] = useState("");
  var [emiOfferInMonth, setEmiOfferInMonth] = useState("");
  let [inputfields, setInputfields] = useState([]);
  const router = useRouter();
  // emi_option["83"] = 2;
  useEffect(() => {
    FacultyService.listCourse().then((res) => {
      if (res && res.data && res.data.data) {
        setCourseList(res.data.data);
      }
    });
  }, []);

  let course_List = [];
  if (courseList) {
    courseList.forEach((element) => {
      course_List.push(
        <option key={element.id} value={element.id}>
          {element.title}
        </option>
      );
    });
  }

  // let inputfieldsinemi = [];
  // useEffect(() => {
  //   if (emiOffer) {
  //     for (let i = 1; i <= emiOffer; i++) {
  //       inputfieldsinemi.push(
  //         <div className="col col-6 mb-3">
  //           <label htmlFor={`offerno_{i}`}>Enter the offer no {i}</label>
  //           <input className="form-control rounded-0" type="number" name={`offerno_{i}`} id={`offerno_{i}`} placeholder={`Enter the offer no ${i}`} />
  //         </div>
  //       );

  //       // <option>{emiOffer}</option>
  //     }
  //   }

  //   setInputfields(inputfieldsinemi);
  // }, [emiOffer]);

  function handleChangeCourse(e) {
    if (e && e.target.value) setCourse(e.target.value);
  }

  const submitEmiData = async (e) => {
    e.preventDefault();
    if (!course || !emiOfferInMonth) {
      return toast.error("Please enter all the field first");
    }

    if (emi_option == null) {
      emi_option = {};
      emi_option[course] = emiOfferInMonth;
    } else if (emi_option) {
      emi_option[course] = emiOfferInMonth;
    }
    const response = await UserService.giveEmiOfferToUser(id, emi_option);
    if (response.status == 200) {
      toast.success("Emi offer given Successfully");
      return router.push("/admin-dashboard");
    } else {
      return toast.success("Something went wrong, Please try again");
    }
  };

  return (
    <>
      <div className="container table-style card pt-3 px-5 shadow-lg p-3 mb-5 bg-body rounded">
        <form onSubmit={submitEmiData}>
          <div className="row">
            <div className="col col-6 mb-3">
              <label className=" col-form-label form-label">Select Course</label>
              <div className="col-sm-9 col-md-9">
                <select id="select_Course" name="select_Course" value={course} onChange={handleChangeCourse} className="form-select">
                  <option value="">Select Course</option>
                  {course_List}
                </select>
              </div>
            </div>
            <div className="col col-6 mb-3">
              <label htmlFor="emi_offer">Enter the number of month of emi period</label>
              <input
                className="form-control rounded-0"
                onChange={(e) => {
                  setEmiOfferInMonth(e.target.value);
                }}
                type="number"
                name="emi_offer_months"
                id="emi_offer_months"
                placeholder="Number of month of emi period"
              />
            </div>
          </div>
          <button className="btn btn-primary my-3 button-style" type="submit">
            submit
          </button>
        </form>
        {/* <button
          className="btn btn-primary my-3 button-style"
          type="submit"
          onClick={() => {
            setRequestForGeneratingTheLink(true);
          }}
        >
          Generate Link
        </button>
        {requestForLink && <LinkGenerated />} */}
      </div>
      <ToastContainer autoClose={2000} />
    </>
  );
}

export default CreateEmiOffer;
