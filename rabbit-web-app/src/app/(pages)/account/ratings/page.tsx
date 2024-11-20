import { useAuth } from "@/contexts/AuthContexts";
import { useState } from "react";

interface Rating {
  orderId: string;
  rating: number;
  review: string;
  timestamp: string;
  reviewSubmitted: boolean;
  mId: string; //for fetching the mechanic name
}

export default function RatingsPage() {
  const { user } = useAuth() || { user: null };
  const [ratings, setRatings] = useState<Rating[]>([]);

  if (!user) {
    return <div> Please Login to access this page.</div>;
  }

  return <div>RatingsPage</div>;
}
