import { useEffect, useState } from "react";
import PageBanner from "../src/components/PageBanner";
import Layout from "../src/layout/Layout";
import AdminService from "./api/admin.service";
import FacultyService from "./api/faculty.service";
const JoinMeet = () => {
  const [courseList, setCourseList] = useState([]);
  // const [meetList, setMeetList] = useState([]);

  useEffect(() => {
    FacultyService.listCourse().then((res) => {
      setCourseList(res?.data?.data);
    });
  }, []);
  //     const [meetList, setMeetList] = useState();

  //     useEffect(() => {
  //         axios.get('/student_meeting')
  //         .then(res => {
  //             setMeetList(res.data.data);
  //         })
  //         .catch(err => {
  //             console.log("err",err);
  //         })
  //     }, []);

  //   return (
  //     <Layout>
  //       <PageBanner pageName={"JoinMeet"} />
  //       {/* JoinMeet Form Start */}
  //       <section className="contact-form-area wow fadeInUp delay-0-2s">
  //       <div className="container">
  //             <div className="row justify-content-center">
  //                 <div className="col-lg-7">
  //                     <div className="bg-layout wow fadeInUp delay-0-2s" >
  //                         <div className="content">
  //                             <h4>Upcoming Meetings</h4>
  //                             <hr/>
  //                             <ul className="course-video-list">
  //                             {meetList &&
  //                                 <div className="card" key={meetList.meeting_id}>
  //                                     <div className="card-body">
  //                                     <p className="card-text">Topic: {meetList.topic}</p>
  //                                     {/* <p className="card-text">DateTime: {meetList.meet_time} </p> */}
  //                                     <p className="card-text">Passcode: {meetList.password}</p>
  //                                         <a rel="noopener noreferrer"  href={meetList.meeting_link} target="_blank">
  //                                             <span className="title">Meet Link</span> &nbsp;&nbsp;&nbsp;
  //                                             <i className="fas fa-video"></i>
  //                                         </a>
  //                                     </div>
  //                                 </div>
  //                            }
  //                             </ul>
  //                         </div>
  //                     </div>
  //                 </div>
  //             </div>
  //         </div>
  //       </section>
  //       {/* JoinMeet Form End */}
  //     </Layout>
  //   )
  const [courseDetails, setCourseDetails] = useState();
  const handleCourseChange = async (e) => {
    const course_id = e.target.value;
    const res = await AdminService.getCourseDetailsById(course_id);

    if (res.status === 200) {
      setCourseDetails(res.data.data[0]);
    }
  };
  return (
    <Layout>
      <PageBanner pageName={"JoinMeet"} />
      <section className="contact-form-area wow fadeInUp delay-0-2s">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className="bg-layout wow fadeInUp delay-0-2s"></div>
              <div className="content">
                <div className="mx-2 row">
                  <label className="col-sm-4 form-label">Course:</label>
                  <div className="col-sm-8 col-md-8">
                    <select
                      name="meet_course"
                      onChange={handleCourseChange}
                      value={courseDetails?.course.id}
                      className="form-select"
                    >
                      <option value="">Select Course</option>
                      {courseList &&
                        courseList.map((e, key) => {
                          return (
                            <option key={e.id} value={e.id}>
                              {e.title}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>
                <div className="my-3 container">
                  {courseDetails?.meeting_link && (
                    <div className="mx-auto p-3 card text-center">
                      <div className="card-body">
                        <a
                          href={courseDetails?.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="title">Meeting Link</span>
                          <i className="fas fa-video"></i>
                        </a>
                        <p className="card-text">
                          Passcode: {courseDetails?.meeting_pwd}
                        </p>
                      </div>
                    </div>
                  )}

                  {courseDetails && !courseDetails?.meeting_link && (
                    <div className="mx-auto p-3 card text-center">
                      <div className="card-body">
                        <p className="card-text">
                          No meeting link added yet for this course.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default JoinMeet;
