import NotificationDetailsComponent from "@/components/NotificationDetailsComp";

export default async function NotificationDetailsPage({
  params,
}: {
  params: Promise<{ notId: string }>;
}) {
  const notId = (await params).notId;
  return (
    <div>
      <NotificationDetailsComponent notId={notId} />
    </div>
  );
}
