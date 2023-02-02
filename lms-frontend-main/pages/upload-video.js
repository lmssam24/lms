import React, { useEffect } from "react";
import Form from "react-bootstrap/Form";
import { useState } from "react";
import FacLayout from "./faculty";
import FacultyService from "./api/faculty.service";
import ClipLoader from "react-spinners/ClipLoader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VideoPlayer from "../src/components/video-player";
import { useRouter } from "next/router";
// import PageBanner from "../src/components/PageBanner";
// import Layout from "../src/layout/Layout";
import Card from "react-bootstrap/Card";
import GenericModal from "../src/components/GenericModal";
import Accordion from "react-bootstrap/esm/Accordion";
// import api from "./api/api";

// import ReactPlayer from "react-player";
// import videojs from "video.js";
// import videos from "../src/video/VIDEO.mp4";
import { DefaultPlayer as Video } from "react-html5video";
import "react-html5video/dist/styles.css";
const UploadVideo = () => {
  const [input, setInput] = useState({
    course_id: "",
    video_file: "",
  });
  const [spinner, setSpinner] = useState(false);
  const router = useRouter();
  const [courseList, setCourseList] = useState([]);
  const [upload, setUpload] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [sp, setSp] = useState(false);

  const redirect_url = process.env.NEXT_PUBLIC_REDIRECT_PATH;

  useEffect(() => {
    FacultyService.listVideo().then((res) => {
      if (res && res.status === 200) {
        setMaterials(res.data.data);
      }
    });
  }, []);

  // const d = (
  //   <div id="pageloader">
  //     <img src="http://cdnjs.cloudflare.com/ajax/libs/semantic-ui/0.16.1/images/loader-large.gif" alt="processing..." />
  //   </div>
  // );
  // useEffect(() => {
  //   document.getElementById("video-form")?.onsubmit((e) => { d.fadeIn() })
  // }, []);

  function splitIntoChunk(arr, chunk) {
    let allChunks = [];
    for (let i = 0; i < arr.length; i += chunk) {
      let chunkArray;
      chunkArray = arr.slice(i, i + chunk);
      allChunks.push(chunkArray);
    }
    setMaterials(allChunks);
  }

  const handleChangeFile = (e) => {
    const { name, value } = e.target;
    if (name === "file_data") {
      setInput((prevState) => ({
        ...prevState,
        [name]: e.target.files[0],
      }));
      console.log(e.target.files);
      localStorage.setItem("video", e.target.files[0].name);
    } else {
      setInput((prevState) => ({
        ...prevState,
        [name]: value,
      }));
      localStorage.setItem("course", value);
    }
  };

  useEffect(() => {
    FacultyService.listCourse().then((res) => {
      if (res && res.data && res.data.data) {
        setCourseList(res.data.data);
      }
    });
  }, []);

  let course_List = [];
  if (courseList.length) {
    courseList.forEach(({ id, title }) => {
      course_List.push(
        <option key={id} value={id}>
          {title}
        </option>
      );
    });
  }
  const [uform, setUform] = useState();

  const clicked = async () => {
    setUpload(true);
    setSpinner(true);
    await FacultyService.generateVideoUploadLink().then((res) => {
      if (res.status == 200) {
        let s = String(res.data.data.upload.upload_link);
        let i = s.indexOf("redirect_url=") + 13;
        s = s.substring(0, i) + `${redirect_url}/success`;
        localStorage.setItem("video_link", res.data.data.link);
        localStorage.setItem("video_uri", res.data.data.uri);
        setUform(s);
        setSpinner(false);
      } else {
        setSpinner(false);
        return toast.error("Somethig went wrong");
      }
    });
  };

  // function submitForm() {
  //   let { course_id, video_file } = input;
  //   if (!course_id || !video_file) {
  //     return toast.error("Please enter all the data carefully");
  //   }
  //   const formData = new FormData();
  //   formData.append("file", video_file);
  //   formData.append("course_id", course_id);
  //   const data = {
  //     form_data: formData
  //   };
  //   setSpinner(true);
  //   FacultyService.uploadVideo(data).then((res) => {
  //     if (res.status == 201) {
  //       setSpinner(false);
  //       return toast.success("Success: video uploaded successfully");
  //     } else if (res.status == 405) {
  //       let s = res.data.upload.upload_link;
  //       setUform(s);
  //       setSpinner(false);
  //     } else {
  //       console.log(res);

  //       setSpinner(false);
  //       return toast.error("somethig went wrong");
  //     }
  //   });
  // }

  function Content(props) {
    // url, fileType
    const docUrl = props.video;
    return (
      <>
        <VideoPlayer url={docUrl} fileType="video/mp4" />;
      </>
    );
    // return (
    //   // <>
    //   //   <iframe width={"100%"} height={"100%"} src={docUrl} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
    //   // </>
    //   <VideoPlayer fileType='video/mp4' url={docUrl} />
    // );
  }

  // function myOwn() {
  //   return (
  //     <>
  //       <ReactPlayer
  //         // Disable download button
  //         config={{ file: { attributes: { controlsList: "nodownload" } } }}
  //         // Disable right click
  //         onContextMenu={(e) => e.preventDefault()}
  //         // Your props
  //         // http://127.0.0.1:8000/material?key=Videos/17/11/Soloop_20220813020834.mp4
  //         url="https://www.youtube.com/watch?v=gThLtpv_u_4"
  //         className="react-player"
  //         controls
  //         width="50%"
  //         height="50%"
  //       />
  //     </>
  //   );
  // }

  function CardViewDoc(props) {
    const [showModal, setShowModal] = useState(false);
    const [docKey, setDocKey] = useState(null);

    return (
      <>
        {props.materials &&
          props.materials.length > 0 &&
          props.materials.map((url, idx) => (
            <>
              {props.materials[idx] && props.materials[idx].video_link && (
                <CardMap
                  setDocKey={setDocKey}
                  docKey={docKey}
                  setShowModal={setShowModal}
                  showModal={showModal}
                  materials={props.materials[idx].video_link}
                  cname={courseList.filter((obj) => obj.id === props.materials[idx].course)[0].title}
                  indx={idx}
                />
              )}
            </>
          ))}
        {showModal && <GenericModal xl setShowModal={setShowModal} showModal={showModal} header={"Videos"} setDocKey={setDocKey} content={<Content docKey={docKey} setDocKey={setDocKey} />} />}
      </>
    );
  }
  function CardMap(props) {
    useEffect(() => {
      if (props.docKey) {
        props.setShowModal(true);
      }
    }, [props.docKey]);

    function handleDocClick(mKey) {
      props.setDocKey(mKey);
    }

    return (
      <div>
        <Accordion defaultActiveKey="0">
          <Card>
            <Accordion.Toggle as={Card.Header} eventKey={props.indx.toString()} className="cursorPointer">
              Course Name: {props.cname} <i className="fas fa-angle-down float-right"></i>
            </Accordion.Toggle>
            <Accordion.Collapse eventKey={props.indx.toString()}>
              <Card.Body>
                <div className="w-100" style={{ display: "flex", flexFlow: "wrap-reverse", flexWrap: "wrap" }}>
                  {props.materials &&
                    props.materials.length > 0 &&
                    props.materials.map((material, idx) => (
                      <Card className="visible recordThumbView w-25" key={"material" + idx}>
                        <img className="card-img-top cursorPointer" src="/assets/images/videothumbnail.svg" onClick={() => handleDocClick(material.Key)} />
                        <Card.Body>
                          <Card.Title className="breakwords">{material.file_name}</Card.Title>
                        </Card.Body>
                      </Card>
                    ))}
                </div>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    );
  }

  return (
    <>
      {spinner && (
        <FacLayout>
          <div>Creating form...</div>
          <ClipLoader />
        </FacLayout>
      )}
      {sp && (
        <FacLayout>
          <div>Please wait while we are uploading the video</div>
          <ClipLoader />
        </FacLayout>
      )}
      {!spinner && (
        <FacLayout>
          {upload ? (
            <div>
              {/* <div className="form-group row">
              <div className="col-sm-9 col-md-9">
                <Form.Group controlId="formFileLg" className="mb-3">
                  <div className="form-group row">
                    <label className="col-sm-3 col-form-label form-label">Select Course</label>
                    <div className="col-sm-9 col-md-9">
                      <select id="select_course" name="course_id" value={input.course_id} onChange={handleChangeFile} className="form-select">
                        <option value="">Select Course</option>
                        {course_List}
                      </select>
                    </div>
                  </div>
                  <input onChange={handleChangeFile} type="file" size="lg" name="video_file" />
                </Form.Group>
              </div>
            </div>
            <div className="col-lg-12 mb-4 p-0">
              <button
                type="submit"
                className="btn btn-success"
                onClick={() => {
                  submitForm();
                }}
              >
                Submit
              </button>
            </div> */}
              {uform && (
                <div className="bg-light p-2">
                  <form id="video-form" method="POST" encType="multipart/form-data" action={uform}>
                    <div className="p-4">
                      <label className="col-sm-3 m-2">Select Course</label>
                      <select id="select_course" name="course_id" value={input.course_id} onChange={handleChangeFile} className="form-select w-50">
                        <option value="">Select Course</option>
                        {course_List}
                      </select>
                    </div>

                    <div className="p-4">
                      <label className="col-sm-3 m-2">Select Video</label>
                      <input onChange={handleChangeFile} type="file" className="form-file w-50" name="file_data" required />
                    </div>
                    <div className="text-center">
                      <a
                        onClick={() => {
                          setSp(true);
                        }}
                        className="text-center"
                      >
                        <input type="submit" className="btn btn-info ml-4 my-5" style={{ width: "10%" }} name="submit" value="Submit" />
                      </a>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-lg btn-info" onClick={clicked}>
              Upload Video
            </button>
          )}
          {sp && (
            <div id="pageloader">
              <img src="http://cdnjs.cloudflare.com/ajax/libs/semantic-ui/0.16.1/images/loader-large.gif" alt="processing..." />
            </div>
          )}
          <ToastContainer autoClose={2000} />
        </FacLayout>
      )}
    </>
  );
};

export default UploadVideo;
