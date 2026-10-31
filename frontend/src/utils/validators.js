/**
 * Input validation helpers for forms
 */

export function validateEmergencyForm(values) {
  const errors = {};

  if (!values.patientName || !values.patientName.trim()) {
    errors.patientName = 'Patient name is required';
  } else if (values.patientName.trim().length < 2) {
    errors.patientName = 'Patient name must be at least 2 characters';
  }

  if (!values.patientAge) {
    errors.patientAge = 'Patient age is required';
  } else {
    const age = Number(values.patientAge);
    if (isNaN(age) || age < 0 || age > 120) {
      errors.patientAge = 'Please enter a valid age between 0 and 120';
    }
  }

  if (!values.patientGender) {
    errors.patientGender = 'Please select a gender';
  }

  if (!values.contactNumber || !values.contactNumber.trim()) {
    errors.contactNumber = 'Contact number is required';
  } else if (!/^[0-9+\s-]{8,15}$/.test(values.contactNumber.trim())) {
    errors.contactNumber = 'Please enter a valid 10-digit phone number';
  }

  if (!values.emergencyType) {
    errors.emergencyType = 'Emergency type is required';
  }

  if (!values.description || !values.description.trim()) {
    errors.description = 'Please describe the symptoms or incident';
  }

  if (!values.locationName || !values.locationName.trim()) {
    errors.locationName = 'Location name or landmark is required';
  }

  if (values.latitude == null || values.longitude == null || isNaN(values.latitude) || isNaN(values.longitude)) {
    errors.location = 'Valid coordinates are required. Pick on map or search.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateLoginForm(values) {
  const errors = {};
  if (!values.email || !values.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateHospitalForm(values) {
  const errors = {};
  if (!values.name || !values.name.trim()) errors.name = 'Hospital name is required';
  if (!values.address || !values.address.trim()) errors.address = 'Address is required';
  if (values.totalIcuBeds < 0) errors.totalIcuBeds = 'Total ICU beds cannot be negative';
  if (values.availableIcuBeds < 0) errors.availableIcuBeds = 'Available ICU beds cannot be negative';
  if (Number(values.availableIcuBeds) > Number(values.totalIcuBeds)) {
    errors.availableIcuBeds = 'Available beds cannot exceed total beds';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
