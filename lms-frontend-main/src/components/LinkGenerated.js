import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const LinkGenerated = ({ linkmanage, userId }) => {
  let price = parseInt(linkmanage.price.price) / parseInt(linkmanage.emioffer_months);
  let link = `https://lms.educationnest.com/checkout?credential=${userId}&emiamount=${price}&course=${linkmanage.course.title}&emi_offer=${linkmanage.emioffer_months}&courseprice=${linkmanage.price.price}&productid=${linkmanage.course.id}`;
  // let link = `http://localhost:3000/checkout?credential=${userId}&emiamount=${price}&course=${linkmanage.course.title}&emi_offer=${linkmanage.emioffer_months}&courseprice=${linkmanage.price.price}&productid=${linkmanage.course.id}`;
  function myFunction() {
    // Get the text field
    var copyText = document.getElementById("inputfield");
    // Select the text field
    copyText?.select();
    copyText?.setSelectionRange(0, 99999); // For mobile devices
    // Copy the text inside the text field
    navigator?.clipboard.writeText(copyText?.value);
    toast.success("Link copied ");
  }

  return (
    <>
      <div class="card" style={{ width: "18rem", "margin-bottom": "20px" }}>
        <div class="card-body">
          <h5 class="card-title">Emi Offer Detail</h5>

          <ul class="list-group list-group-flush">
            <li class="list-group-item fw-bolder">
              <strong>
                {" "}
                Course Name : <span>{linkmanage.course.title}</span>
              </strong>
            </li>
            <li class="list-group-item fw-bolder">
              <strong>
                {" "}
                Total Month of Emi : <span>{linkmanage.emioffer_months}</span>
              </strong>
            </li>

            <li class="list-group-item fw-bolder">
              <strong>
                {" "}
                Link of payment :{" "}
                <span>
                  <input className="form-control rounded-0 bg-info" type="text" name="link" id="inputfield" value={link} />
                  <button class="mt-2 btn btn-primary" onClick={myFunction}>
                    Copy Link
                  </button>
                </span>
              </strong>
            </li>
          </ul>
        </div>
      </div>
      <ToastContainer autoClose={2000} />
    </>
  );
};

export default LinkGenerated;
