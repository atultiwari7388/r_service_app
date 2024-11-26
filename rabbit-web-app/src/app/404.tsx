import Link from "next/link";

export default function Custom404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#F96176] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-gradient-to-r from-[#F96176] to-[#eb4d64] text-white py-3 px-6 rounded-lg hover:from-[#eb4d64] hover:to-[#F96176] transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center gap-2"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
