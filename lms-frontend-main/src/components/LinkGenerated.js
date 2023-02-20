import React, { useState, useEffect } from "react";
const LinkGenerated = ({ price }) => {
  // let price = 800;
  let link = "http://localhost:3000/checkout";
  function myFunction() {
    // Get the text field
    var copyText = document.getElementById("inputfield");
    console.log(copyText, "copytexttttt");
    // Select the text field
    copyText?.select();
    copyText?.setSelectionRange(0, 99999); // For mobile devices
    // Copy the text inside the text field
    navigator?.clipboard.writeText(copyText?.value);
  }

  return (
    <>
      <input
        className="form-control rounded-0 bg-info"
        onChange={(e) => {
          setEmiOffer(e.target.value);
        }}
        type="text"
        name="link"
        id="inputfield"
        value={link}
      />
      <button onClick={myFunction}>Copy text</button>
    </>
  );
};

export default LinkGenerated;
