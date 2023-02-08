import { useState, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import api from "../../pages/api/api";
import FacultyService from "../../pages/api/faculty.service";
import StudentService from "../../pages/api/student.service";
import GenericModal from "./GenericModal";
import ClipLoader from "react-spinners/ClipLoader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ModuleMaterialsView({ upload }) {
  const [showModal, setShowModal] = useState(false);
  const [docKey, setDocKey] = useState(null);
  const [moduleMaterials, setModuleMaterials] = useState([]);
  const [deleted, setDeleted] = useState(false);
  const [spinner, setSpinner] = useState(false);
  function handleDocClick(mKey) {
    setDocKey(mKey);
    setShowModal(true);
  }

  useEffect(() => {
    console.log(upload, "uploadddddd");
    if (upload) {
      setSpinner(false);
    } else if (!upload) {
      setSpinner(true);
    }

    const chunk = 4;
    StudentService.listModuleMaterial().then((res) => {
      if (res && res.status === 200) {
        splitIntoChunk(res.data.data, chunk, "materials", "module");
      }
    });
  }, [deleted]);

  function splitIntoChunk(arr, chunk, type, ent) {
    let allChunks = [];
    for (let i = 0; i < arr.length; i += chunk) {
      let chunkArray;
      chunkArray = arr.slice(i, i + chunk);
      allChunks.push(chunkArray);
    }

    if (type === "materials") {
      if (ent === "module") {
        setModuleMaterials(allChunks);
        setSpinner(false);
      }
    }
  }

  return (
    <>
      {!spinner && (
        <>
          {moduleMaterials.length === 0 && <label className="col-form-label form-label"> Looks like Module Materials list is empty, start adding Module Material</label>}
          {moduleMaterials.length > 0 &&
            moduleMaterials.map((uris, index) => {
              return <CardViewDoc materials={uris} key={"key" + index} />;
            })}
        </>
      )}

      {spinner && (
        <>
          <h5>Please wait while data is loading.</h5>
          <ClipLoader color="#36d7b7" size={50} />
        </>
      )}
    </>
  );

  function Content(props) {
    const docUrl = api.defaults.baseURL + "material?key=" + props.docKey;

    return (
      <>
        <iframe width={"100%"} height={"100%"} src={docUrl} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
      </>
    );
  }

  function CardViewDoc(props) {
    return (
      <div>
        {props.materials &&
          props.materials.length > 0 &&
          props.materials.map((url, idx) => (
            <>
              {props.materials[idx] && props.materials[idx].file_list.length > 0 && (
                <CardMap setDocKey={setDocKey} docKey={docKey} setShowModal={setShowModal} showModal={showModal} materials={props.materials[idx].file_list} cname={props.materials[idx].module_name} indx={idx} />
              )}
            </>
          ))}
        {showModal && <GenericModal xl setShowModal={setShowModal} showModal={showModal} header={"Course Material"} download={docKey} setDocKey={setDocKey} content={<Content docKey={docKey} setDocKey={setDocKey} />} />}
      </div>
    );
  }
  async function deleteDoc(document) {
    const response = await FacultyService.deleteMaterial(document.Key);
    if (response.status == 200) {
      setDeleted(true);
      // router.push("/faculty-add-module");
      return toast.success("Module materials deleted successfully");
    } else {
      return toast.error("Something went wrong Please try again");
    }
  }

  function getFileName(fname) {
    let fileName = fname.slice(14, fname.length);
    return fileName;
  }
  function CardMap(props) {
    return (
      <div>
        <Accordion defaultActiveKey="0">
          <Card>
            <Accordion.Toggle as={Card.Header} eventKey={props.indx.toString()} className="cursorPointer">
              Module Name: {props.cname} <i className="fas fa-angle-down float-right"></i>
            </Accordion.Toggle>
            <Accordion.Collapse eventKey={props.indx.toString()}>
              <Card.Body>
                <div
                  className="w-100"
                  style={{
                    display: "flex",
                    flexFlow: "wrap-reverse",
                    flexWrap: "wrap"
                  }}
                >
                  {props.materials &&
                    props.materials.length > 0 &&
                    props.materials.map((material, idx) => (
                      <Card className="visible recordThumbView w-25 overflow-hidden" key={"material" + idx}>
                        <img className="card-img-top cursorPointer" src="/assets/images/docThumbnail.svg" onClick={() => handleDocClick(material.Key)} />

                        <Card.Body style={{ padding: "10px 2px" }}>
                          <Card.Title className="breakwords">{getFileName(material.file_name)}</Card.Title>
                        </Card.Body>
                        <Card.Footer>
                          <button
                            className="btn btn-warning"
                            onClick={() => {
                              deleteDoc(material);
                            }}
                          >
                            Delete
                          </button>
                        </Card.Footer>
                      </Card>
                    ))}
                </div>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
        <ToastContainer autoClose={2000} />
      </div>
    );
  }
}

export default ModuleMaterialsView;
