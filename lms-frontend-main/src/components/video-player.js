import React, { useEffect, useRef } from 'react'
import VideoJs from 'video.js'
import 'video.js/dist/video-js.css';
import "videojs-hotkeys";

const videoJsOptions = {
  controls: true,
  autoplay: false,
  fluid: true,
  loop: false,
  playbackRates: [0.5, 1, 1.5, 2],
  aspectRatio: '12:5',
  plugins: {
    hotkeys: {}
  }
}

const VideoPlayer = ({ url, fileType }) => {
  const videoContainer = useRef()

  useEffect(() => {
    videoContainer.current.innerHTML = `
      <div data-vjs-player>
        <video id="video-play" class="video-js" />
      </div>
    `

    const player = VideoJs(videoContainer.current.querySelector('video'), videoJsOptions, async () => {
      player.src({ src: url, type: fileType })
    })

    let myVideo = document.getElementById("video-play_html5_api");
    if (myVideo.addEventListener) {
      myVideo.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      }, false);
    } else {
      myVideo.attachEvent('oncontextmenu', function () {
        window.event.returnValue = false;
      });
    }

    //  When destruct dispose the player
    return () => player.dispose()
  }, [url, fileType])

  return <div ref={videoContainer} />
}

export default VideoPlayer