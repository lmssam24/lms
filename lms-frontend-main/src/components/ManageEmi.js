import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ClipLoader from "react-spinners/ClipLoader";
import CreateEmiOffer from "./CreateEmiOffer";

const ManageEmi = () => {
  const [clicked, setClicked] = useState(false);
  const [emailId, setEmailId] = useState("");
  const [spinner, setSpinner] = useState(false);
  const [createEmi, setCreateEmi] = useState(false);
  const router = useRouter();

  //   {spinner && (
  //     <>
  //       <h5>Please wait while data is loading.</h5>
  //       <ClipLoader color="#36d7b7" size={50} />
  //     </>
  //   )}

  const FindTheUser = () => {
    const submitEmail = async (e) => {
      e.preventDefault();
      if (response.status == 200) {
        toast.success("Success: user found successfully");
        return router.push("/admin-dashboard");
      } else {
        toast.error("user not found please give correct credential of user");
        return router.push("/admin-dashboard");
      }
    };

    return (
      <>
        <div className="container table-style card pt-3 px-5 shadow-lg p-3 bg-body rounded" style={{ "margin-top": "50px" }}>
          <form onSubmit={submitEmail}>
            <div className="row mt-5">
              <div className="col col-6 mb-3">
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
              Find the user
            </button>
          </form>
        </div>
      </>
    );
  };

  return (
    <div>
      <div>
        <h3>Manage Emi</h3>
      </div>

      <div>
        <button className="btn btn-primary" onClick={() => setClicked(true)}>
          Find the user
        </button>

        <button className="btn btn-primary my-3 mx-5 button-style" onClick={() => setCreateEmi(true)}>
          Create Emi offer
        </button>

        {clicked && <FindTheUser />}

        {createEmi && <CreateEmiOffer />}

        {/* <button className="btn btn-primary my-3 button-style mx-5" type="submit">
          Give user emi access
        </button>
        <button className="btn btn-primary my-3 mx-5 button-style" type="submit">
          Go Back
        </button> */}
      </div>
    </div>
  );
};

export default ManageEmi;
