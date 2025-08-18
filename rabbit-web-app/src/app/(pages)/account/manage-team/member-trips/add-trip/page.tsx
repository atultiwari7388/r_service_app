import CreateMemberAddTripPageComponent from "@/components/memberTripCO/page";

export default async function CreateMemberAddTripPage({
  searchParams,
}: {
  searchParams: Promise<{
    userId?: string;
    role?: string;
    memberName?: string;
  }>;
}) {
  const params = await searchParams;
  const memberId = params.userId;
  const memberRole = params.role;
  const memberName = params.memberName;

  return CreateMemberAddTripPageComponent({
    memberId: memberId,
    memberRole: memberRole,
    memberName: memberName,
  });
}
