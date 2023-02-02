import json
import requests

ACCESS_TOKEN = "80278b083238da17944c70fb5c77e5ab"
CLIENT_ID = "f352df2589a190a44e390b5e4a8df7cc519e445e"
CLIENT_SEC = "2/KaXI6poiecDC4hHkpAOnPxjiemZjAhCriubDWrYVKM0imWYEl/8ek3w/AHn31ywfSBy7Kf85uP6oKZhoOV8cViCFBoL7qlDtj5U8wkhMrJ6UnsG8WK4i9fzmUwllQj"


base = "https://api.vimeo.com/"


def generate_upload_link():
    uri = base + "me/videos"

    response = requests.post(uri,
                             headers={
                                 'Authorization': 'Bearer ' + ACCESS_TOKEN,
                                 "Content-Yype": "application/json",
                                 "Accept": "application/vnd.vimeo.*+json;version=3.4"
                             },
                             data={
                                 "upload": {
                                     "approach": "post",
                                     "redirect_url": "https://www.youtube.com/"
                                 }
                             },
                             ).json()

    return response


def change_video_meta(name, url):
    uri = base + url

    response = requests.patch(uri, headers={
        'Authorization': 'Bearer ' + ACCESS_TOKEN,
        "Content-Yype": "application/json",
        "Accept": "application/vnd.vimeo.*+json;version=3.4"
    },
        data={
        "upload": {
            "approach": "post",
        },
        "name": name
    },
    ).json()

    return response
