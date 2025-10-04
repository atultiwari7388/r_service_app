"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem } from "@/types/types";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  startAfter,
  endBefore,
  doc,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HistoryCard from "./components/HistoryCard";
import { HashLoader } from "react-spinners";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { Dialog } from "@headlessui/react";
import { Rating } from "react-simple-star-rating";
import Link from "next/link";

export default function HistoryPage(): JSX.Element {
  const { user } = useAuth() || { user: null };
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [userRole, setUserRole] = useState("");

  const itemsPerPage = 10;

  // Fetch user data and determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user?.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || "");

          // Determine effectiveUserId based on role
          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
            console.log(
              "SubOwner detected, using effectiveUserId:",
              userData.createdBy
            );
          } else {
            setEffectiveUserId(user.uid);
            console.log("Regular user, using own uid:", user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  const handleRating = async () => {
    if (!selectedItem || !effectiveUserId) return;

    try {
      const jobRef = doc(db, "jobs", selectedItem.orderId);
      const mechanicRatingRef = doc(
        db,
        "Mechanics",
        selectedItem.mechanicsOffer[0].mId,
        "ratings",
        selectedItem.orderId
      );
      const userHistoryRef = doc(
        db,
        "Users",
        effectiveUserId, // Use effectiveUserId
        "history",
        selectedItem.orderId
      );

      const ratingData = {
        rating: rating,
        review: review,
        reviewSubmitted: true,
        timestamp: new Date(),
        uId: user!.uid,
        orderId: selectedItem.orderId,
      };
      await setDoc(mechanicRatingRef, ratingData);
      // Then update the other documents
      await Promise.all([
        updateDoc(jobRef, ratingData),
        updateDoc(userHistoryRef, ratingData),
      ]);

      toast.success("Rating submitted successfully");
      setIsRatingOpen(false);
      fetchUserHistory("initial");
    } catch (error) {
      GlobalToastError(error);
    }
  };

  const openRatingDialog = (item: HistoryItem) => {
    setSelectedItem(item);
    setRating(Number(item.rating) || 0);
    setReview(item.review || "");
    setIsRatingOpen(true);
  };

  const fetchUserHistory = async (direction: "next" | "prev" | "initial") => {
    setLoading(true);
    if (effectiveUserId) {
      // Change from user to effectiveUserId
      try {
        const historyRef = collection(db, "Users", effectiveUserId, "history"); // Use effectiveUserId
        let q;

        if (direction === "next" && lastDoc) {
          q = query(
            historyRef,
            orderBy("orderDate", "desc"),
            startAfter(lastDoc),
            limit(itemsPerPage)
          );
        } else if (direction === "prev" && firstDoc) {
          q = query(
            historyRef,
            orderBy("orderDate", "desc"),
            endBefore(firstDoc),
            limit(itemsPerPage)
          );
        } else {
          q = query(
            historyRef,
            orderBy("orderDate", "desc"),
            limit(itemsPerPage)
          );
        }

        const querySnapshot = await getDocs(q);
        console.log("Query Snapshot Size:", querySnapshot.size);

        if (!querySnapshot.empty) {
          const fetchedData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as HistoryItem[];

          setHistoryItems(fetchedData);
          setFirstDoc(querySnapshot.docs[0]);
          setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

          console.log("Fetched data:", fetchedData);
        } else if (direction === "next") {
          toast.error("No more history items.");
        } else {
          console.log("No history items found for initial load.");
        }
      } catch (error) {
        // GlobalToastError(error);
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (effectiveUserId) {
      fetchUserHistory("initial");
    }
  }, [effectiveUserId]);

  const handleNext = () => fetchUserHistory("next");
  const handlePrevious = () => fetchUserHistory("prev");

  if (!user) {
    return <div>Please log in to access the history page.</div>;
  }

  // Add loading check for effectiveUserId
  if (!effectiveUserId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Table Layout for larger screens */}
      {userRole === "SubOwner" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Viewing history as Co-Owner (Owner&#39;s data)
          </p>
        </div>
      )}
      <div className="hidden lg:block">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b bg-green-100">ID</th>
              <th className="px-4 py-2 border-b bg-green-100">Date & Time</th>
              <th className="px-4 py-2 border-b bg-green-100">Distance</th>
              <th className="px-4 py-2 border-b bg-green-100">Name</th>
              <th className="px-4 py-2 border-b bg-green-100">Address</th>
              <th className="px-4 py-2 border-b bg-green-100">Service</th>
              <th className="px-4 py-2 border-b bg-green-100">Vehicle</th>
              <th className="px-4 py-2 border-b bg-green-100">Charges</th>
              <th className="px-4 py-2 border-b bg-green-100">Payment Mode</th>
              <th className="px-4 py-2 border-b bg-green-100">Status</th>
              <th className="px-4 py-2 border-b bg-green-100">Actions</th>
            </tr>
          </thead>
          <tbody className="text-center bg-gray-100">
            {historyItems.length > 0 ? (
              historyItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-red-50"}
                >
                  <td className="px-4 py-2 border-b">{item.id}</td>
                  <td className="px-4 py-2 border-b">
                    {item.orderDate?.toDate().toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {item.nearByDistance} miles
                  </td>
                  <td className="px-4 py-2 border-b">{item.userName}</td>
                  <td className="px-4 py-2 border-b">
                    {item.userDeliveryAddress}
                  </td>
                  <td className="px-4 py-2 border-b">{item.selectedService}</td>
                  <td className="px-4 py-2 border-b">{item.vehicleNumber}</td>
                  <td className="px-4 py-2 border-b">
                    {item.fixPriceEnabled == true
                      ? `$${item.mechanicsOffer[0]?.fixPrice} (Fix Price  )`
                      : `$${item.mechanicsOffer[0]?.arrivalCharges} (Arrival Charges)`}
                  </td>

                  <td className="px-4 py-2 border-b">{item.payMode}</td>
                  <td className="px-4 py-2 border-b">
                    {item.status === 5 ? (
                      <span className="text-green-500">Complete</span>
                    ) : item.status === -1 ? (
                      <span className="text-red-500">Cancelled</span>
                    ) : (
                      <span className="text-yellow-500">In Progress</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border-b flex gap-3 justify-center">
                    {item.status === 5 && (
                      <button
                        onClick={() => openRatingDialog(item)}
                        className="bg-gradient-to-r from-[#F96176] to-[#eb4d64] text-white py-2 px-2 rounded-lg hover:from-[#eb4d64] hover:to-[#F96176] transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {item.reviewSubmitted ? "Edit Rating" : "Rate Now"}
                      </button>
                    )}

                    <Link
                      href={`/my-jobs/${item.id.replace("#", "")}`}
                      className="bg-gradient-to-r from-[#F96176] to-[#eb4d64] text-white py-2 px-2 rounded-lg hover:from-[#eb4d64] hover:to-[#F96176] transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} className="text-center py-4">
                  No history items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card Layout for mobile screens */}
      <div className="lg:hidden">
        {historyItems.length > 0 ? (
          historyItems.map((item) => <HistoryCard key={item.id} items={item} />)
        ) : (
          <p>No history items found.</p>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog
        open={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg p-8 max-w-md mx-auto">
            <Dialog.Title className="text-lg font-medium mb-4">
              Rate Your Experience
            </Dialog.Title>

            <div className="space-y-4">
              <Rating
                initialValue={rating}
                onClick={setRating}
                allowFraction={false}
              />

              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write a review"
                className="w-full p-2 border rounded"
                rows={3}
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsRatingOpen(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRating}
                  className="bg-[#F96176] text-white py-2 px-4 rounded"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 gap-4">
        <button
          onClick={handlePrevious}
          disabled={!firstDoc}
          className="bg-[#F96176] text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!lastDoc}
          className="bg-[#F96176] text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
