/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  where,
  query,
  limit,
  startAfter,
  endBefore,
  Timestamp,
} from "firebase/firestore";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HashLoader from "react-spinners/HashLoader";

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
  const [teamMembers, setTeamMembers] = useState<ManageTeamProps[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth() || { user: null };

  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const itemsPerPage = 5;

  const fetchTeamMembers = async (direction: "next" | "prev" | "initial") => {
    setLoading(true);
    if (user) {
      try {
        const usersRef = collection(db, "Users");
        let q;

        if (direction === "next" && lastDoc) {
          q = query(
            usersRef,
            where("createdBy", "==", user.uid),
            where("uid", "!=", user.uid),
            startAfter(lastDoc),
            limit(itemsPerPage)
          );
        } else if (direction === "prev" && firstDoc) {
          q = query(
            usersRef,
            where("createdBy", "==", user.uid),
            where("uid", "!=", user.uid),
            endBefore(firstDoc),
            limit(itemsPerPage)
          );
        } else {
          q = query(
            usersRef,
            where("createdBy", "==", user.uid),
            where("uid", "!=", user.uid),
            limit(itemsPerPage)
          );
        }

        const querySnapshot = await getDocs(q);
        console.log("Query Snapshot Size:", querySnapshot.size);
        if (!querySnapshot.empty) {
          const fetchedData = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              active: data.active,
              createdBy: data.createdBy,
              created_at: data.created_at,
              email: data.email,
              role: data.role,
              uid: data.uid,
              updated_at: data.updated_at,
              userName: data.userName,
              isTeamMember: data.isTeamMember,
              phoneNumber: data.phoneNumber,
              profilePicture: data.profilePicture,
            } as ManageTeamProps;
          });

          setTeamMembers(fetchedData);

          setFirstDoc(querySnapshot.docs[0]);
          setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

          console.log("Fetched team members:", fetchedData);
        } else if (direction === "next") {
          toast.error("No more team members to show.");
        } else {
          console.log("No team members found for initial load.");
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast.error("Failed to fetch team members. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTeamMembers("initial");
  }, [user]);

  const handleNext = () => fetchTeamMembers("next");
  const handlePrevious = () => fetchTeamMembers("prev");

  if (!user) {
    return <div>Please log in to access the manage team page.</div>;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white shadow-sm rounded-lg mb-6 p-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl text-gray-800 font-bold mb-4 sm:mb-0">
            Manage Team
          </h1>
          <Link href="/account/manage-team/create-team-member">
            <button className="bg-[#F96176] hover:bg-[#e54d62] transition-colors text-white py-2 px-6 rounded-lg shadow-md flex items-center">
              <span className="mr-2">+</span>
              Create Member
            </button>
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <tr
                    key={member.uid}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={member.profilePicture || "/default-avatar.png"}
                          alt={member.userName}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                        <div className="text-sm font-medium text-gray-900">
                          {member.userName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {member.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No team members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div
                key={member.uid}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={
                      member.profilePicture ||
                      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                    }
                    alt={member.userName}
                    className="h-12 w-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {member.userName}
                    </h3>
                    <span
                      className={`px-2 text-xs leading-5 font-semibold rounded-full ${
                        member.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {member.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Email:</span> {member.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Phone:</span>{" "}
                    {member.phoneNumber}
                  </p>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
              No team members found
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={!firstDoc}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!lastDoc}
            className="bg-[#F96176] text-white px-4 py-2 rounded-md shadow-sm hover:bg-[#e54d62] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
