/* eslint-disable @next/next/no-img-element */
import { FaSignOutAlt } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { CiStar } from "react-icons/ci";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

type MenuItems = {
  icon: JSX.Element;
  label: string;
  path: string;
};

type User = {
  profilePicture: string;
  userName: string;
  phoneNumber: string;
  wallet: number;
};

type ProfileProps = {
  user: User;
};

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const router = useRouter();

  // Menu items, including the logout button
  const menuItems: MenuItems[] = [
    {
      icon: <CgProfile className="mr-2" />,
      label: "My Profile",
      path: "/account/my-profile",
    },
    {
      icon: <CiStar className="mr-2" />,
      label: "Ratings",
      path: "/account/ratings",
    },

    {
      icon: <FaSignOutAlt className="mr-2" />,
      label: "Logout",
      path: "/logout",
    },
  ];

  // Function to handle the logout logic
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logout Successfull");
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex space-x-4 items-center">
        <div>
          <img
            src={user.profilePicture}
            alt="User Avatar"
            height={32}
            width={32}
            className="object-cover transition-transform duration-500 hover:scale-105 rounded-full"
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{user.userName}</h2>
          <p className="text-sm text-gray-500">{user.phoneNumber}</p>
          <p className="text-sm font-medium bg-gradient-to-r from-[#F96176] to-[#ff8c9a] text-transparent bg-clip-text">
            Wallet: ${user.wallet?.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <ul className="space-y-4">
          {menuItems?.map((item) => (
            <li className="mb-1 block" key={item.label}>
              {item.label === "Logout" ? (
                // Logout button triggers the handleLogout function
                <button
                  onClick={handleLogout}
                  className="flex items-center text-[#F96176]"
                >
                  {item.icon}
                  <span className="ms-2 text-black">{item.label}</span>
                </button>
              ) : (
                // Regular link for other menu items
                <Link
                  href={item.path}
                  className="flex items-center text-[#F96176]"
                >
                  {item.icon}
                  <span className="ms-2 text-black">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
