// {excelData.length > 0 && (
//       <>
//         <Card className="p-4 mb-6">
//           <div className="overflow-x-auto">
//             <h2 className="text-xl font-bold mb-4">Preview Data</h2>
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead>
//                 <tr>
//                   {Object.keys(excelData[0])
//                     .filter((key) => {
//                       const isTrailer =
//                         excelData[0]?.vehicleType === "Trailer";
//                       return !(
//                         isTrailer &&
//                         (key === "iccms" || key === "dot")
//                       );
//                     })
//                     .map((key) => (
//                       <th key={key} className="px-4 py-2 text-left">
//                         {key}
//                       </th>
//                     ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {excelData.map((row, index) => (
//                   <tr key={index}>
//                     {Object.entries(row)
//                       .filter(([key]) => {
//                         const isTrailer = row.vehicleType === "Trailer";
//                         return !(
//                           isTrailer &&
//                           (key === "iccms" || key === "dot")
//                         );
//                       })
//                       .map(([key, value]) => (
//                         <td key={key} className="px-4 py-2">
//                           {String(value)}
//                         </td>
//                       ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </Card>
//         <Button onClick={handleUpload} disabled={isSaving} className="w-full">
//           {isSaving ? "Uploading..." : "Upload Vehicles"}
//         </Button>
//       </>
//     )}
