const isEmail = (email) => {
  const regEx =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

exports.validateSignupData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(data.password)) errors.password = "Must not be empty";
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords must match";
  if (isEmpty(data.handle)) errors.handle = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) errors.email = "Must not be empty";
  if (isEmpty(data.password)) errors.password = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validatePostRequestData = (data) => {
  let errors = {};

  if (isEmpty(data.description)) {
    errors.description = "Must not be empty";
  }
  if (isEmpty(data.car)) {
    errors.car = "Must choose a car";
  }
  if (isEmpty(data.make)) {
    errors.make = "Must choose a brand";
  }
  if (isEmpty(data.type)) {
    errors.type = "Must choose a job type";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};
  if (!isEmpty(typeof data.pageTitle === "string" ? data.pageTitle.trim() : ""))
    userDetails.pageTitle = data.pageTitle;
  if (
    !isEmpty(
      typeof data.pageDescription === "string"
        ? data.pageDescription.trim()
        : ""
    )
  )
    userDetails.pageDescription = data.pageDescription;
  if (!isEmpty(typeof data.location === "string" ? data.location.trim() : ""))
    userDetails.location = data.location;
  if (!isEmpty(typeof data.mobile === "string" ? data.mobile.trim() : ""))
    userDetails.mobile = data.mobile;
  if (!isEmpty(typeof data.skills === "string" ? data.skills.trim() : ""))
    userDetails.skills = data.skills;

  return userDetails;
};
