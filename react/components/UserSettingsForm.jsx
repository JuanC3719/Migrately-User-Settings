import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import migratelyLogo from "../../assets/images/migrately/migrately-logo.png";
import FileUpload from "components/fileUpload/FileUpload";
import PropTypes from "prop-types";
import "./userstyles.css";
import { Card, Col, Row, Image, Button, Form as bForm } from "react-bootstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as validation from "../../schemas/userSchema";
import userService from "services/userService";
import toastr from "toastr";
import Swal from "sweetalert2";
import useToggle from "@react-hook/toggle";
import twoFAService from "services/twoFAService";

const _logger = debug.extend("User Change Form");

const UserSettingsChange = (props) => {
  const currentUser = props.currentUser;
  _logger(currentUser);
  const navigate = useNavigate();
  const { id } = useParams();
  const [userExistingData, setUserExistingData] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: "",
  });

  const [is2FAEnabled, setIs2FAEnabled] = useToggle(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasPhoneNumber, setHasPhoneNumber] = useState(false);

  function onTwoFactorActive() {
    if (hasPhoneNumber) {
      Swal.fire({
        title: "Would you like to disable 2 Factor Authentication?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        if (result["isConfirmed"]) {
          send2faCode(phoneNumber);
          let payload = {
            PhoneNumber: phoneNumber,
            UserId: id,
          };
          const status = { previousPage: "userSettings", action: "disable" };
          const statePayload = { data: payload, status: status };
          const stateToTransport = {
            type: "PHONE_NUMBER",
            payload: statePayload,
          };
          navigate("/twofactorauthpage", { state: stateToTransport });
        }
      });
    } else {
      setIs2FAEnabled(!is2FAEnabled);
      const phoneNumberClone = [...phoneNumber];
      let cleaned = ("" + phoneNumberClone).replace(/\D/g, "");
      let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      let phoneNumberGood = false;
      if (match) {
        phoneNumberGood = true;
      }
      if (!is2FAEnabled && phoneNumberGood) {
        Swal.fire({
          title: "Would you like to activate 2 Factor Authentication?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "yes",
        }).then((result) => {
          if (result["isConfirmed"]) {
            send2faCode(cleaned);
          } else {
            setIs2FAEnabled(!is2FAEnabled);
          }
        });
      } else if (!is2FAEnabled && !phoneNumberGood) {
        toastr.error("Must enter phone number first", "Error");
        setIs2FAEnabled(false);
      }
    }
  }

  function send2faCode(cleanedPhoneNumber) {
    twoFAService
      .enterPhoneNumber(cleanedPhoneNumber)
      .then(on2faSuccess)
      .catch(on2faFail);
  }

  function on2faSuccess() {
    if (!hasPhoneNumber) {
      let payload = {
        PhoneNumber: phoneNumber,
        IsActive: true,
        UserId: id,
      };
      const statePayload = {
        data: payload,
        status: { previousPage: "userSettings", action: "enable" },
      };
      const stateToTransport = { type: "PHONE_NUMBER", payload: statePayload };
      navigate("/twofactorauthpage", { state: stateToTransport });
    }
  }

  function on2faFail(response) {
    _logger(response);
  }

  const getUser = (userId) => {
    userService.getCurrentUser(userId).then(getUserSuccess).catch(getUserError);
  };

  const getUserById = (id) => {
    userService
      .getUserById(id)
      .then(getUserByIdSuccess)
      .catch(getUserByIdError);
  };

  useEffect(() => {
    getUser();
  }, []);

  function getUsersTwoFactorInfoSuccess(response) {
    const userPhoneNumber = response.data.item.phoneNumber;
    setPhoneNumber(userPhoneNumber);
    setHasPhoneNumber(true);
    setIs2FAEnabled(false);
  }

  function getUsersTwoFactorInfoFail(response) {
    _logger("getUsersTwoFactorInfoFail", response);
  }

  const getUserByIdSuccess = (userResponse) => {
    setUserExistingData((prevState) => {
      const userData = { ...prevState, ...userResponse.data.item };
      return userData;
    });
  };

  const getUserByIdError = (response) => {
    _logger("User Data Error", response);
  };

  const getUserSuccess = (userResponse) => {
    const userId = userResponse.data.item.id;
    getUserById(userId);
    userService
      .getUsersTwoFactorInfo(userId)
      .then(getUsersTwoFactorInfoSuccess)
      .catch(getUsersTwoFactorInfoFail);
  };

  const getUserError = (response) => {
    _logger("User Data Error", response);
  };

  const onPasswordChange = (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Would you like to change your password?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result["isConfirmed"]) {
        navigate("/resetpassword");
      }
    });
  };

  const handleSubmit = (values) => {
    Swal.fire({
      title: "Update your information?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result["isConfirmed"]) {
        userService
          .updateUserData(id, values)
          .then(onUpdateSuccess)
          .catch(onUpdateError);
      } else if (result["isDenied"]) {
        Swal.fire("Changes are not saved", "", "info");
      }
    });
  };

  const onUpdateSuccess = (response) => {
    setUserExistingData((prevstate) => {
      const prevUserData = { ...prevstate };
      _logger("update response--->", response);
      return prevUserData;
    });
    Swal.fire("Awesome!", "You updated your info!!", "success");
  };

  const onUpdateError = (response) => {
    _logger(response);
  };

  const uploadFile = (file, setFieldValue) => {
    setFieldValue("imageUrl", file[0].url);
  };

  function handlePhoneNumberChange(event) {
    _logger(event.target.value);
    setPhoneNumber(event.target.value);
  }

  return (
    <React.Fragment>
      <div className="row py-6 px-12 migrately-theme-background">
        <Row className="align-items-center justify-content-center g-0 min-vh-100">
          <Col lg={7} md={5} className="py-8 py-xl-0">
            <Card>
              <Card.Body className="p-6">
                <div className="mb-4">
                  <div className="user-align-center">
                    <Link to="/">
                      <Image
                        src={migratelyLogo}
                        className="mb-4 user-align-center"
                        alt="Migrately Logo"
                      />
                    </Link>
                  </div>
                  <h2 className="fw-bold user-align-center">
                    User Settings Change Form
                  </h2>
                </div>
                <Formik
                  enableReinitialize={true}
                  initialValues={userExistingData}
                  onSubmit={(onPasswordChange, handleSubmit)}
                  validationSchema={validation.validationChangeUserSettings}
                >
                  {({ setFieldValue }) => (
                    <Form>
                      <Row>
                        <Col lg={6} md={12} className="mb-3">
                          <ErrorMessage
                            name="firstName"
                            className="user-form-error"
                            component="div"
                          />
                          <label
                            htmlFor="firstName"
                            className="user-form-label-text"
                          >
                            First Name
                          </label>
                          <Field
                            type="text"
                            className="form-control"
                            name="firstName"
                          />
                        </Col>
                        <Col lg={6} md={12} className="mb-3">
                          <label
                            htmlFor="lastName"
                            className="user-form-label-text"
                          >
                            Last Name
                          </label>
                          <Field
                            type="text"
                            className="form-control"
                            name="lastName"
                          />
                        </Col>
                        <div className="mb-3">
                          <ErrorMessage
                            name="avatarUrl"
                            className="user-form-error"
                            component="div"
                          />
                          <label
                            htmlFor="avatarUrl"
                            className="user-form-label-text"
                          >
                            Avatar Image
                          </label>
                          <FileUpload
                            onFileSubmitSuccess={(file) =>
                              uploadFile(file, setFieldValue)
                            }
                            name="avatarUrl"
                          ></FileUpload>
                        </div>
                        <div className="mb-3">
                          <label
                            htmlFor="twoFactorEnabled"
                            className="user-form-label-text"
                          >
                            Text (SMS) Message Authentication
                          </label>
                          <div className="card-body">
                            <Col lg={6} md={12} className="mb-3">
                              <label htmlFor="twoFactorSwitch">
                                <bForm.Check
                                  type="switch"
                                  id="twoFactorSwitch"
                                  checked={is2FAEnabled}
                                  onClick={onTwoFactorActive}
                                />
                                <span>
                                  {" "}
                                  2FA Enabled: {is2FAEnabled ? "Yes" : "No"}
                                </span>
                              </label>
                            </Col>
                            {(hasPhoneNumber && (
                              <Col lg={6} md={12} className="mb-3">
                                <label htmlFor="phoneNumber">
                                  Phone Number:{" "}
                                </label>

                                <Field
                                  type="text"
                                  className="form-control"
                                  id="phoneNumber"
                                  value={phoneNumber}
                                  disabled
                                />
                              </Col>
                            )) || (
                              <Col lg={6} md={12} className="mb-3">
                                <label htmlFor="phoneNumber">
                                  Phone Number:{" "}
                                  <Field
                                    type="text"
                                    className="form-control"
                                    id="phoneNumber"
                                    onChange={handlePhoneNumberChange}
                                    value={phoneNumber}
                                    name="phoneNumber"
                                    validationSchema={
                                      validation.validationPhone
                                    }
                                    maxLength="10"
                                  />
                                </label>
                              </Col>
                            )}
                          </div>
                        </div>
                        <Col lg={12} md={12} className="mb-0 d-grid gap-2">
                          <Button
                            type="route"
                            onClick={onPasswordChange}
                            variant="warning"
                          >
                            Change Password
                          </Button>
                        </Col>
                        &nbsp;
                        <div>
                          <Col lg={12} md={12} className="mb-0 d-grid gap-2">
                            <Button
                              type="submit"
                              onClick={handleSubmit}
                              variant="primary"
                            >
                              Save Changes
                            </Button>
                          </Col>
                        </div>
                      </Row>
                    </Form>
                  )}
                </Formik>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </React.Fragment>
  );
};

UserSettingsChange.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
  }).isRequired,
};

export default UserSettingsChange;
