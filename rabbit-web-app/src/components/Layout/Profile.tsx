import { FaHistory, FaSignOutAlt } from "react-icons/fa";
import { RiTeamLine } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import { CiStar } from "react-icons/ci";
import Image from "next/image";
import Link from "next/link";

type MenuItems = {
  icon: JSX.Element;
  label: string;
  path: string; // Added path for each item
};

type User = {
  avatarUrl: string;
  name: string;
  phone: string;
};

type ProfileProps = {
  user: User;
};

const Profile: React.FC<ProfileProps> = ({ user }) => {
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
      path: "/logout",
    },
  ];

  return (
    <div className="w-full">
      <div className="flex space-x-4 items-center">
        <div>
          <Image
            src={user.avatarUrl}
            alt="User Avatar"
            height={32}
            width={32}
            className="object-cover transition-transform duration-500 hover:scale-105 rounded-full"
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.phone}</p>
        </div>
      </div>
      <div className="mt-4">
        <ul className="space-y-4">
          {menuItems?.map((item) => (
            <li className="mb-1 block" key={item.label}>
              <Link
                href={item.path}
                className="flex items-center text-[#F96176]"
              >
                {item.icon}
                <span className="ms-2 text-black">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;