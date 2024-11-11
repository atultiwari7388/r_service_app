/* eslint-disable @next/next/no-img-element */
import { FaHistory, FaSignOutAlt } from "react-icons/fa";
import { RiTeamLine } from "react-icons/ri";
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
};

type ProfileProps = {
  user: User;
};

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const router = useRouter(); // To programmatically navigate after logout

  // Menu items, including the logout button
  const menuItems: MenuItems[] = [
    {
      icon: <FaHistory className="mr-2" />,
      label: "History",
      path: "/account/order-history",
    },
    {
      icon: <CgProfile className="mr-2" />,
      label: "My Profile",
      path: "/account/return-orders",
    },
    {
      icon: <RiTeamLine className="mr-2" />,
      label: "Manage Team",
      path: "/account/manage-teams",
    },
    {
      icon: <CiStar className="mr-2" />,
      label: "Ratings",
      path: "/account/ratings",
    },
    {
      icon: <FaSignOutAlt className="mr-2" />,
      label: "Logout",
      path: "/logout", // This will be used for the link but we will handle logout onClick
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
