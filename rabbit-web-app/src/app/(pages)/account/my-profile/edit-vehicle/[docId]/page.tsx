import EditVehicleComponent from "../components/edit-vehicle";

export default async function EditVehicleScreen({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const vId = (await params).docId;

  return (
    <div>
      <EditVehicleComponent vId={vId} />
    </div>
  );
}
