import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminService from "./api/admin.service";
import FacultyService from "./api/faculty.service";
import FacLayout from "./faculty";

const Attendance = () => {
  const [showModal, setShowModal] = useState(false);
  const [showModals, setShowModals] = useState(false);
  const [studentsAttend, setStudentsAttend] = useState([]);
  const [course, setCourse] = useState([]);
  const [courseId, setCourseId] = useState();
  const [addAttendanceForm, setAddAttendance] = useState(false);

  useEffect(() => {
    fn();
  }, []);

  useEffect(() => {
    gn();
  }, [courseId]);

  // handleClose();
  const gn = async () => {
    if (!courseId) {
      return;
    }
    const response = await AdminService.getAttendance(courseId);
    let data = response.data.data;
    if (data?.length > 0 && data[0] && data[0].attendance.length > 0) {
      data.forEach((element) => {
        element.attendance.sort(function (a, b) {
          return new Date(Object.keys(a)[0]) - new Date(Object.keys(b)[0]);
        });
      });
    }

    setStudentsAttend(data);
    console.log(data);
  };

  const fn = async () => {
    const response = await FacultyService.listCourse();
    setCourse(response?.data?.data);
  };

  function handleClose() {
    setShowModal(false);
    setShowModals(false);
  }

  const getTiming = (dateTime, returndecider) => {
    const date = new Date(dateTime);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mlist = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (returndecider) {
      return days[date.getDay()];
    } else {
      return date.getDate() + " " + mlist[date.getMonth()] + " " + date.getFullYear();
    }
  };

  const addAttendance = async (e) => {
    e.preventDefault();
    const id = e.target[0].value;
    const date = e.target[1].value;
    if (!id || !date) {
      return toast.warn("Please enter all the data carefully");
    }
    const response = await AdminService.addAttendance(id, date);
    if (response.status == 200) {
      setAddAttendance(false);

      toast.success("Success: Attendance list added successfully");
      location.reload();
    }
  };

  const changeAttHandler = async (studentData, k, ind) => {
    studentData.attendance[ind][k] = !studentData.attendance[ind][k];
    const response = await AdminService.updateAttendance(studentData.course, { ...studentData });
    if (response.status == 200) {
      toast.success("Success: Attendance updated successfully");
      gn();
    }
  };

  return (
    <>
      <FacLayout>
        <div className="">
          <h3>Attendance</h3>
        </div>

        {!addAttendanceForm && (
          <section className="container-fluid py-5">
            <div className="row">
              <div className="col col-9">
                <div className="container">
                  <a
                    className="btn btn-sm btn-primary mb-3"
                    onClick={() => {
                      setAddAttendance(true);
                    }}
                  >
                    Take attendance
                  </a>

                  <a
                    className="btn btn-sm btn-primary ml-3 mb-3"
                    onClick={() => {
                      setShowModal(true);
                    }}
                  >
                    See the student on the basis of course
                  </a>
                  {studentsAttend && !showModals && (
                    <div style={{ "overflow-x": "auto" }}>
                      <table className="table">
                        <thead>
                          <tr>
                            {studentsAttend[0] && <th scope="col">Name</th>}

                            {studentsAttend[0] &&
                              studentsAttend[0].attendance.map((e, i) => (
                                <>
                                  <th className="text-center text-nowrap" scope="col" key={i}>
                                    {getTiming(new Date(Object.keys(e)[0]), 0)}
                                  </th>
                                  <th scope="col"></th>
                                </>
                              ))}
                            {/* <th scope="col" className="text-center">
                          Action
                        </th> */}
                          </tr>
                          <tr>
                            <th scope="col"></th>
                            {studentsAttend[0] &&
                              studentsAttend[0].attendance.map((e, i) => (
                                <>
                                  <th className="text-center" key={i}>
                                    {getTiming(Object.keys(e)[0], 1)}
                                  </th>
                                  <th scope="col">🅰️</th>
                                </>
                              ))}

                            {/* <th scope="col" className="text-center"></th> */}
                          </tr>
                        </thead>

                        <tbody>
                          {studentsAttend &&
                            studentsAttend.map((e, i) => (
                              <tr key={i}>
                                <th scope="row">{e.student}</th>
                                {e.attendance.map((a, ind) => {
                                  return (
                                    <>
                                      <td key={ind} className="text-center">
                                        {Object.values(a)[0] ? "Present" : "Absent"}
                                      </td>
                                      <td>
                                        <a
                                          onClick={() => {
                                            changeAttHandler(e, Object.keys(a)[0], ind);
                                          }}
                                        >
                                          ✏️
                                        </a>
                                      </td>
                                    </>
                                  );
                                })}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!studentsAttend && courseId && (
                    <div className="text-center">
                      <h4>No attendance taken yet for this subject.</h4>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>{showModal && <AttendanceModal clName="attendance" xl setShowModal={setShowModal} showModal={showModal} header={"See the student attendance by selecting the course"} />}</div>
            {/* <div>{showModals && <AddAttendanceModal clName="addattendance" xl setshowModals={setShowModals} showModals={showModals} header={"Enter date for attendance"} />}</div> */}
          </section>
        )}

        {addAttendanceForm && (
          <>
            <AddAttendanceModal />
          </>
        )}
      </FacLayout>
      <div>
        <ToastContainer autoClose={2000} />
      </div>
    </>
  );

  function AttendanceModal(props) {
    return (
      <>
        <Modal show={props.showModal} onHide={handleClose} dialogClassName={props.xl ? "modal-xl" : ""} className="attendanceModal attendance">
          <Modal.Header closeButton>{props.header}</Modal.Header>
          <Modal.Body>
            <form>
              <div>
                <select
                  name="course"
                  onChange={(e) => {
                    handleClose();
                    setCourseId(e.target.value);
                  }}
                >
                  <option>Select the course</option>
                  {course && course.map(({ id, title }) => <option value={id}>{title}</option>)}
                </select>
              </div>
            </form>
          </Modal.Body>
          {!props.hideClose && (
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </Modal.Footer>
          )}
        </Modal>
        <div>
          <ToastContainer autoClose={2000} />
        </div>
      </>
    );
  }

  function AddAttendanceModal() {
    return (
      <>
        <div className="container bg-light">
          <form onSubmit={addAttendance}>
            <div className="mt-3">
              <label for="course_title">Select Course</label>
              <select
                name="course"
                // onChange={(e) => {
                //   setCourseIdformaking(e.target.value);
                // }}
              >
                <option>Select the course</option>
                {course &&
                  course.map(({ id, title }, i) => (
                    <option key={i} value={id}>
                      {title}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mt-3">
              <label for="attendance_date">Attendance Date</label>
              <input name="attendance_date" id="attendance_date" type="date" placeholder="Date" max={new Date().toISOString().split("T").at(0)} />
            </div>
            <div className="mt-3">
              <button type="submit" className=" btn btn-info my-3">
                Make attendance for the selected date
              </button>
            </div>
          </form>
        </div>
        {/* <div>
          <ToastContainer autoClose={2000} />
        </div> */}
      </>
    );
  }
};

export default Attendance;
