"use client";

import { useParams } from "next/navigation";

export default function EditMember() {
  const params = useParams();
  const memberId = params?.mId as string;
  return <div>EditMember id is {memberId}</div>;
}
