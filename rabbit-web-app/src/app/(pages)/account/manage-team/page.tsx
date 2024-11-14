import { Timestamp } from "firebase/firestore";

interface ManageTeamProps {
  active: boolean;
  createdBy: string;
  created_at: Timestamp;
  email: string;
  isTeamMember: boolean;
  phoneNumber: string;
  profilePicture: string;
  role: string;
  uid: string;
  updated_at: Timestamp;
  userName: string;
}

export default function ManageTeam(): JSX.Element {
  return (
    <section className="min-h-screen flex mx-auto flex-col">
      <div>
        <div className="container mx-auto p-5 flex justify-between bg-red-500">
          <h1 className="text-xl text-black font-sans font-semibold">
            Manage Team
          </h1>
          <p className="bg-[#F96176] text-white py-2 px-4 rounded-[10px]">
            Create
          </p>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>{/* Table data will go here */}</tbody>
        </table>
      </div>
    </section>
  );
}
