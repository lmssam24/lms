import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ClipLoader from "react-spinners/ClipLoader";
import CreateEmiOffer from "./CreateEmiOffer";
import UserService from "../../pages/api/user.service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminService from "../../pages/api/admin.service";
import LinkGenerated from "./LinkGenerated";
const ManageEmi = () => {
  let [clicked, setClicked] = useState(false);
  const [courseList, setCourseList] = useState([]);
  let [spinner, setSpinner] = useState(false);
  let [createEmi, setCreateEmi] = useState(false);
  let [userFound, setUserFound] = useState(false);
  const [userDetail, setUserDetail] = useState(true);
  const [coursesWithEmiOffer, setCoursesWithEmiOffer] = useState([]);
  let [linkmanage, setLinkManage] = useState("");
  let router = useRouter();

  useEffect(() => {
    AdminService.listCourseDetails().then((res) => {
      if (res && res.data && res.data.data) {
        setCourseList(res.data.data);
        fn();
      }
    });
  }, [userDetail]);

  const fn = () => {
    let courseListWithEmiOffer = [];
    if (userDetail?.emi_option && courseList) {
      setSpinner(true);
      for (let i in userDetail?.emi_option) {
        courseList.forEach((e) => {
          if (e.course.id == i) {
            e["emioffer_months"] = userDetail?.emi_option[i];
            courseListWithEmiOffer.push(e);
          }
        });
      }
      setCoursesWithEmiOffer(courseListWithEmiOffer);
      setSpinner(false);
    }
  };

  const FindTheUser = () => {
    let [emailId, setEmailId] = useState("");
    const submitEmail = async (e) => {
      setSpinner(true);
      e.preventDefault();
      const response = await UserService.findUser(emailId);
      if (response.status == 200) {
        setUserDetail(response?.data?.data);
        setSpinner(false);
        setUserFound(true);
        setClicked(false);
        toast.success("student found successfully");
      } else {
        setSpinner(false);
        toast.error("student not found please give correct credential of user");
        return router.push("/admin-dashboard");
      }
    };

    return (
      <>
        {spinner && (
          <>
            <ClipLoader color="#36d7b7" size={50} />
          </>
        )}
        {!spinner && !userFound && (
          <>
            <div className="container table-style card pt-3 px-5 shadow-lg p-3 bg-body rounded" style={{ "margin-top": "50px" }}>
              <form onSubmit={submitEmail}>
                <div className="row mt-5">
                  <div className="col col-6 mb-3 form-group">
                    <label htmlFor="emailid">Enter the email id of user</label>
                    <input
                      className="form-control rounded-0"
                      onChange={(e) => {
                        setEmailId(e.target.value);
                      }}
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Enter the email id"
                    />
                  </div>
                </div>
                <button className="btn btn-primary my-3 button-style" type="submit">
                  search user
                </button>
              </form>
            </div>
          </>
        )}

        <ToastContainer autoClose={2000} />
      </>
    );
  };

  return (
    <div>
      <div>
        <h3>Manage Emi</h3>
      </div>

      <div>
        {!userFound && (
          <>
            <button className="btn btn-primary" onClick={() => setClicked(true)}>
              Find the user
            </button>
          </>
        )}
        {clicked && <FindTheUser />}
        {userFound && (
          <>
            <div className="d-flex justify-content-around">
              <div>
                <button className="btn btn-primary my-3 mx-5 button-style" onClick={() => setCreateEmi(true)}>
                  Give Emi offer
                </button>
              </div>

              {/* <div>
                <button className="btn btn-primary my-3 mx-5 button-style" onClick={() => setCreateEmi(true)}>
                  see previous offer
                </button>
              </div> */}

              <div class="card" style={{ width: "18rem", "margin-bottom": "20px" }}>
                <div class="card-body">
                  <h5 class="card-title">User Detail</h5>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item fw-bolder">
                      <strong>
                        {" "}
                        Name :{" "}
                        <span>
                          {userDetail.user__first_name} {userDetail.user__last_name}
                        </span>
                      </strong>
                    </li>
                    {/* <li class="list-group-item fw-bolder">Mobile No:</li> */}
                    <li class="list-group-item fw-bolder">
                      <strong>Email : {userDetail.user__username}</strong>
                    </li>
                    {/* {spinner && (
                      <>
                        <ClipLoader color="#36d7b7" size={50} />
                      </>
                    )} */}
                    {coursesWithEmiOffer.length > 0 && userDetail?.emi_option && (
                      <>
                        <li class="list-group-item fw-bolder">
                          <strong> Previousemioffer(if any)</strong>
                        </li>
                        {coursesWithEmiOffer.map((evt, i) => (
                          <>
                            {/* {console.log(e,"jdfghmydxc")} */}
                            <button
                              class="btn btn-info mt-3"
                              onClick={(e) => {
                                setLinkManage(evt);
                              }}
                            >
                              Detail of offer {i + 1}
                            </button>
                          </>
                        ))}
                      </>
                    )}
                    {!userDetail?.emi_option && (
                      <li class="list-group-item fw-bolder">
                        <strong> Previousemioffer(if any) : No offer given yet</strong>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <div>{linkmanage && <LinkGenerated linkmanage={linkmanage} userId={userDetail.user__id} />}</div>
            </div>
          </>
        )}

        {createEmi && <CreateEmiOffer emi_option={userDetail?.emi_option} id={userDetail?.id} />}

        {/* <button className="btn btn-primary my-3 button-style mx-5" type="submit">
          Give user emi access
        </button>
        <button className="btn btn-primary my-3 mx-5 button-style" type="submit">
          Go Back
        </button> */}
      </div>

      <ToastContainer autoClose={2000} />
    </div>
  );
};

export default ManageEmi;
