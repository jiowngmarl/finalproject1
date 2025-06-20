export const sleep = (ms = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/** Validation */
export const validators = {
  employee_no: (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(v) || "Please enter a valid employee_no";
  },
  required: (v: any) => !!v || "This field is required",
};
