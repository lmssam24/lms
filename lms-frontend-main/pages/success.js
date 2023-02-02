import Link from "next/link";
import { useEffect, useState } from "react"
import FacultyService from "./api/faculty.service"

const Success = () => {
    const saveVideo = async (course, video, video_link, video_uri) => {
        if (course && video) {
            console.log("Alokkkkkkkk")
            const data = { course, video, video_link, video_uri }
            console.log(data)
            const res = await FacultyService.uploadVideo({ ...data })
            if (res.status == 200) {
                localStorage.removeItem('course')
                localStorage.removeItem('video')
                localStorage.removeItem("video_link")
                localStorage.removeItem("video_uri")
            }
            else {
                console.log(res)
            }
        }

    }

    useEffect(() => {
        const course = localStorage.getItem('course')
        const video = localStorage.getItem('video')
        const vide_link = localStorage.getItem("video_link")
        const video_uri = localStorage.getItem("video_uri")

        saveVideo(course, video, vide_link, video_uri)

    }, [])
    return <div className="text-center">
        <div class="success-animation">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" /><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" /></svg>
        </div>
        <Link href={'/upload-video'}>
            <button className="btn btn-lg btn-primary" onClick={() => { }}>Go Back</button>
        </Link>
    </div>
}

export default Success;