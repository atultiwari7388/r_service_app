// import React from "react";
// import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// const styles = StyleSheet.create({
//   page: {
//     padding: 30,
//     fontFamily: "Helvetica",
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 5,
//   },
//   divider: {
//     borderBottomWidth: 1,
//     borderBottomColor: "#000",
//     marginVertical: 10,
//   },
//   bold: {
//     fontWeight: "bold",
//   },
//   footer: {
//     textAlign: "center",
//     marginTop: 30,
//   },
// });

// interface ServiceDetail {
//   serviceName: string;
//   amount: number;
// }

// interface CheckReceiptPDFProps {
//   check: {
//     id: string;
//     date: Date;
//     memoNumber?: string;
//     userName: string;
//     type: string;
//     serviceDetails: ServiceDetail[];
//     totalAmount: number;
//   };
// }

// const CheckReceiptPDF: React.FC<CheckReceiptPDFProps> = ({ check }) => (
//   <Document>
//     <Page size="A4" style={styles.page}>
//       <View style={styles.header}>
//         <Text>CHECK RECEIPT</Text>
//       </View>

//       <View style={styles.row}>
//         <Text>Date: {check.date.toLocaleDateString()}</Text>
//         {check.memoNumber && <Text>Memo: {check.memoNumber}</Text>}
//       </View>

//       <View style={styles.divider} />

//       <View>
//         <Text style={styles.bold}>
//           Paid To: {check.userName} ({check.type})
//         </Text>
//       </View>

//       <View style={{ marginTop: 20 }}>
//         <Text style={styles.bold}>Details:</Text>
//         <View style={{ marginTop: 10 }}>
//           {check.serviceDetails.map((detail, index) => (
//             <View key={index} style={styles.row}>
//               <Text>{detail.serviceName}</Text>
//               <Text>${detail.amount.toFixed(2)}</Text>
//             </View>
//           ))}
//         </View>
//       </View>

//       <View style={styles.divider} />

//       <View style={styles.row}>
//         <Text style={styles.bold}>TOTAL:</Text>
//         <Text style={styles.bold}>${check.totalAmount.toFixed(2)}</Text>
//       </View>

//       <View style={styles.footer}>
//         <Text>Thank You!</Text>
//       </View>
//     </Page>
//   </Document>
// );

// export default CheckReceiptPDF;
