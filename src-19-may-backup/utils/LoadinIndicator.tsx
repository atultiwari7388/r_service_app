import { HashLoader } from "react-spinners";

export const LoadingIndicator = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
      <HashLoader color="#F96176" />
    </div>
  );
};
