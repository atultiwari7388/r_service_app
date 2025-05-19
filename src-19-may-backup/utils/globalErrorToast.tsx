import toast from "react-hot-toast";

export const GlobalToastError = (error: unknown) => {
  return toast.error(
    "Failed to fetch. Please try again. Error: " + String(error)
  );
};

export const GlobalToastSuccess = (message: string) => {
  return toast.success(message);
};
