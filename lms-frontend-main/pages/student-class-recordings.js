// import axios from "./api/api";
// import { useEffect, useState } from "react";
import React, { useState, useEffect } from "react";
import PageBanner from "../src/components/PageBanner";
import Layout from "../src/layout/Layout";
import FacultyService from "./api/faculty.service";
// import FacLayout from '.';
// import CardView from "../src/components/CardView";
// import VidRecordings from "../src/components/VidRecordings";
import ReactPlayer from "react-player";

const StudentsClassRecordings = () => {
  const [listOfVideo, setListOfVideo] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [courseId, setCourseId] = useState();

  useEffect(() => {
    if (courseId) {
      FacultyService.listVideo(courseId).then((res) => {
        if (res.status === 200) {
          console.log(res.data);
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

  const settingOfReactPlayer = (link) => {
    return (
      <div className="mb-5">
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
      </div>
    );
  };

  return (
    <Layout>
      <PageBanner pageName={"Recorded Classes"} />
      <p className="title-db text-center">View Recording Class</p>
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
              <option key={i} value={e.id}>
                {e.title}
              </option>
            ))}
        </select>
      </div>

      <div class="container my-5">
        <div class="row">
          {listOfVideo.map((e, i) => (
            <div class="col-6 my-5">
              {settingOfReactPlayer(e.video_link)}{" "}
              <div className="text-center text-bold">
                <strong>{e.name}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!courseList?.length && (
        <div className="text-center">
          <h5> Please first purchase the course to see recording classes </h5>
        </div>
      )}

      {!listOfVideo?.length && (
        <div className="text-center">
          <h5> No videos yet </h5>
        </div>
      )}
    </Layout>
  );
};

export default StudentsClassRecordings;
