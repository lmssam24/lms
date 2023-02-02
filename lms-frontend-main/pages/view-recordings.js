import React, { useState, useEffect } from "react";
import FacLayout from "./faculty";
// import VidRecordings from "../src/components/VidRecordings";
import FacultyService from "./api/faculty.service";
import ReactPlayer from "react-player";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewRecordings = () => {
  const [listOfVideo, setListOfVideo] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [courseId, setCourseId] = useState();

  useEffect(() => {
    if (courseId) {
      FacultyService.listVideo(courseId).then((res) => {
        if (res.status === 200) {
          setListOfVideo(res.data);
        }
      });
    }
  }, [courseId]);

  useEffect(() => {
    FacultyService.listCourse().then((res) => {
      if (res && res.data && res.data.data) {
        setCourseList(res.data.data);
      }
    });
  }, []);

  const deleteVideo = async (id) => {
    const response = await FacultyService.deleteVideos(id);
    if (response.status === 204) {
      toast.success("Video deleted successfully");
      setTimeout(() => {
        location.reload();
      }, [1000]);
    }
  };

  const settingOfReactPlayer = (link) => {
    return (
      <>
        <ReactPlayer
          config={{
            file: { attributes: { controlsList: "nodownload" } },
            vimeo: {
              preload: true
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          url={link}
          className="react-player"
          controls
          width="100%"
          height="100%"
        />
      </>
    );
  };

  return (
    <FacLayout>
      <p className="title-db">HOME / View Recording Class</p>
      <hr />
      <div className="container bg-white my-4 py-4">
        <label for="course_title">Select Course to see recorded video </label>
        <select
          name="course"
          onChange={(e) => {
            setCourseId(e.target.value);
          }}
        >
          <option>Select the course</option>
          {courseList &&
            courseList.map((e, i) => (
              <option key={i} value={e?.id}>
                {e?.title}
              </option>
            ))}
        </select>
      </div>
      <div class="container">
        <div class="row">
          {listOfVideo.map((e, i) => (
            <>
              <div className="d-flex flex-column">
                <div class="col-6 mt-5">{settingOfReactPlayer(e.video_link)} </div>
                {/* <br /> */}
                <div className="text-center text-bold col-6">
                  <strong>{e.name}</strong>
                  <br />
                  <a onClick={() => deleteVideo(e.id)}>
                    <strong>❌</strong>
                  </a>
                </div>
              </div>
            </>
          ))}
        </div>
      </div>
      <ToastContainer autoClose={1000} />
      {!listOfVideo?.length && <div className="text-center">No video uploaded yet</div>}
    </FacLayout>
  );
};

export default ViewRecordings;
