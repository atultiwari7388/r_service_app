import React from "react";
import Image from "next/image";

type TestimonialProps = {
  avatarUrl: string;
  name: string;
  profession: string;
  message: string;
};

const Testimonial: React.FC<TestimonialProps> = ({
  avatarUrl,
  name,
  profession,
  message,
}) => {
  return (
    <div className="flex flex-col items-center p-4 sm:p-6">
      <div className="bg-light rounded-full p-2 mb-4">
        <Image
          src={avatarUrl}
          alt={`${name}'s avatar`}
          width={80}
          height={80}
          className="w-20 h-20 rounded-full object-cover"
        />
      </div>
      <h5 className="mb-2 text-xl font-semibold">{name}</h5>
      <p className="text-gray-500 text-sm">{profession}</p>
      <div className="bg-light text-center p-4 mt-4 rounded-lg shadow-md">
        <p className="mb-0 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default Testimonial;
