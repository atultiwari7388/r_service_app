// "use client";

// import { useAuth } from "@/contexts/AuthContexts";
// import { db } from "@/lib/firebase";
// import { GlobalToastError } from "@/utils/globalErrorToast";
// import { LoadingIndicator } from "@/utils/LoadinIndicator";
// import { doc, getDoc, addDoc, collection } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import { toast } from "react-hot-toast";
// import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
// import { getFunctions, httpsCallable } from "firebase/functions";

// export default function ContactUsComp() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [contactInfo, setContactInfo] = useState<{
//     contactMail?: string;
//     contactNumber?: string;
//     address?: string;
//   }>({});
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     message: "",
//   });
//   const { user } = useAuth() || { user: null };

//   const fetchContactUs = async () => {
//     if (user) {
//       setIsLoading(true);
//       try {
//         const contactUsRef = doc(db, "metadata", "helpCenter");
//         const contactUsSnapshot = await getDoc(contactUsRef);

//         if (contactUsSnapshot.exists()) {
//           const contactMail = contactUsSnapshot.data()?.mail || "";
//           const contactNumber = contactUsSnapshot.data()?.phone || "";
//           const address = contactUsSnapshot.data()?.address || "";
//           setContactInfo({ contactMail, contactNumber, address });
//         }
//       } catch (error) {
//         GlobalToastError(error);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       // Store in database
//       await addDoc(collection(db, "contactSubmissions"), {
//         ...formData,
//         userId: user?.uid,
//         timestamp: new Date(),
//       });

//       // Send email to admin
//       const functions = getFunctions();
//       const sendContactEmail = httpsCallable(functions, "sendContactEmail");
//       await sendContactEmail({
//         ...formData,
//         recipientEmail: contactInfo.contactMail,
//       });

//       toast.success("Message sent successfully!");
//       setFormData({
//         name: "",
//         email: "",
//         phone: "",
//         message: "",
//       });
//     } catch (error) {
//       GlobalToastError(error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   useEffect(() => {
//     fetchContactUs();
//   }, [user]);

//   if (isLoading) {
//     return <LoadingIndicator />;
//   }

//   if (!user) {
//     return (
//       <div className="flex justify-center items-center min-h-[60vh]">
//         <h1 className="text-xl font-semibold text-gray-700">
//           Please Login to access the page..
//         </h1>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
//       <div className="container mx-auto px-4 py-16">
//         <div className="max-w-6xl mx-auto">
//           <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center">
//             Get in Touch
//           </h1>

//           <div className="grid md:grid-cols-2 gap-8">
//             {/* Contact Information Card */}
//             <div className="bg-white rounded-xl shadow-lg p-8">
//               <h2 className="text-2xl font-bold text-gray-800 mb-6">
//                 Contact Information
//               </h2>

//               <div className="space-y-6">
//                 {contactInfo.contactMail && (
//                   <div className="flex items-center space-x-4 text-gray-600">
//                     <FaEnvelope className="text-[#F96176] text-xl" />
//                     <div>
//                       <p className="font-semibold">Email</p>
//                       <p>{contactInfo.contactMail}</p>
//                     </div>
//                   </div>
//                 )}

//                 {contactInfo.contactNumber && (
//                   <div className="flex items-center space-x-4 text-gray-600">
//                     <FaPhone className="text-[#F96176] text-xl" />
//                     <div>
//                       <p className="font-semibold">Phone</p>
//                       <p>{contactInfo.contactNumber}</p>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex items-center space-x-4 text-gray-600">
//                   <FaMapMarkerAlt className="text-[#F96176] text-xl" />
//                   <div>
//                     <p className="font-semibold">Address</p>
//                     <p>{contactInfo.address}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Contact Form Card */}
//             <div className="bg-white rounded-xl shadow-lg p-8">
//               <h2 className="text-2xl font-bold text-gray-800 mb-6">
//                 Send us a Message
//               </h2>

//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label className="block text-gray-700 mb-2">Name</label>
//                   <input
//                     type="text"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#F96176]"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-gray-700 mb-2">Email</label>
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#F96176]"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-gray-700 mb-2">Phone</label>
//                   <input
//                     type="tel"
//                     name="phone"
//                     value={formData.phone}
//                     onChange={handleChange}
//                     className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#F96176]"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-gray-700 mb-2">Message</label>
//                   <textarea
//                     name="message"
//                     value={formData.message}
//                     onChange={handleChange}
//                     className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#F96176] h-32"
//                     required
//                   ></textarea>
//                 </div>

//                 <button
//                   type="submit"
//                   className="w-full bg-[#F96176] text-white py-3 rounded-lg hover:bg-[#e54d62] transition-colors font-semibold"
//                 >
//                   Send Message
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db, storage } from "@/lib/firebase";
// import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPaperclip,
} from "react-icons/fa";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function ContactUsComp() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<{
    contactMail?: string;
    contactNumber?: string;
    address?: string;
  }>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const { user } = useAuth() || { user: null };

  const fetchContactUs = async () => {
    setIsLoading(true);
    try {
      const contactUsRef = doc(db, "metadata", "helpCenter");
      const contactUsSnapshot = await getDoc(contactUsRef);

      if (contactUsSnapshot.exists()) {
        const contactMail = contactUsSnapshot.data()?.mail || "";
        const contactNumber = contactUsSnapshot.data()?.phone || "";
        const address = contactUsSnapshot.data()?.address || "";
        setContactInfo({ contactMail, contactNumber, address });
      }
    } catch (error) {
      // GlobalToastError(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to submit your query");
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentUrl = "";

      // Upload attachment if exists
      if (attachment) {
        const storageRef = ref(
          storage,
          `contact-attachments/${user.uid}/${Date.now()}_${attachment.name}`
        );
        await uploadBytes(storageRef, attachment);
        attachmentUrl = await getDownloadURL(storageRef);
      }

      // Store in database
      const submissionData = {
        ...formData,
        userId: user?.uid,
        timestamp: new Date(),
        ...(attachmentUrl && { attachmentUrl }),
      };

      await addDoc(collection(db, "contactSubmissions"), submissionData);

      // Send email to admin
      const functions = getFunctions();
      const sendContactEmail = httpsCallable(functions, "sendContactEmail");
      await sendContactEmail({
        ...submissionData,
        recipientEmail: contactInfo.contactMail,
      });

      toast.success("Message sent successfully!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
      setAttachment(null);
    } catch (error) {
      console.log(error);
      // GlobalToastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  useEffect(() => {
    fetchContactUs();
  }, []);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center">
            Get in Touch
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information Card */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Contact Information
              </h2>

              <div className="space-y-6">
                {contactInfo.contactMail && (
                  <div className="flex items-center space-x-4 text-gray-600">
                    <FaEnvelope className="text-[#F96176] text-xl" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p>{contactInfo.contactMail}</p>
                    </div>
                  </div>
                )}

                {contactInfo.contactNumber && (
                  <div className="flex items-center space-x-4 text-gray-600">
                    <FaPhone className="text-[#F96176] text-xl" />
                    <div>
                      <p className="font-semibold">Phone</p>
                      <p>{contactInfo.contactNumber}</p>
                    </div>
                  </div>
                )}

                {contactInfo.address && (
                  <div className="flex items-center space-x-4 text-gray-600">
                    <FaMapMarkerAlt className="text-[#F96176] text-xl" />
                    <div>
                      <p className="font-semibold">Address</p>
                      <p>{contactInfo.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Form Card */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Send us a Message
              </h2>

              {!user && (
                <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg">
                  Note: You need to login to submit your query
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#F96176]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#F96176]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#F96176]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#F96176] h-32"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Attachment (Optional)
                  </label>
                  <div className="flex items-center">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center">
                      <FaPaperclip className="mr-2" />
                      <span>
                        {attachment ? attachment.name : "Choose file"}
                      </span>
                      <input
                        type="file"
                        onChange={handleAttachmentChange}
                        className="hidden"
                      />
                    </label>
                    {attachment && (
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F96176] text-white py-3 rounded-lg hover:bg-[#e54d62] transition-colors font-semibold disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
