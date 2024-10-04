import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../utils/app_styles.dart';
import '../../utils/constants.dart';
import '../../widgets/dashed_divider.dart';
import '../../widgets/reusable_text.dart';

class JobDetailsScreen extends StatefulWidget {
  final String orderId;
  final String driverName;
  final String driverNumber;
  final String driverDeliveryAddress;
  final dynamic serviceName;

  // final dynamic servicePrice;
  final String mechanicName;
  final String mechanicNumber;
  final status;
  final orderDate;
  final payMode;
  final fixPrice;
  final arrivingCharges;
  final bool isImageSelected;
  final bool isPriceEnabled;

  const JobDetailsScreen({
    required this.orderId,
    required this.driverName,
    required this.driverNumber,
    required this.driverDeliveryAddress,
    required this.serviceName,
    // required this.servicePrice,
    required this.mechanicName,
    required this.mechanicNumber,
    required this.status,
    required this.orderDate,
    required this.payMode,
    this.fixPrice,
    this.arrivingCharges,
    required this.isImageSelected,
    required this.isPriceEnabled,
  });

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Job Invoice'),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order ID: ${widget.orderId}',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 4),
            ReusableText(
              text:
                  "Order Date: ${DateFormat('yyyy-MM-dd HH:mm').format(widget.orderDate)}",
              style: appStyle(13, kGrayLight, FontWeight.normal),
            ),

            SizedBox(height: 10),
            Text('Driver Name: ${widget.driverName}'),
            Text('Driver Number: ${widget.driverNumber}'),
            Text('Driver Address: ${widget.driverDeliveryAddress}'),
            SizedBox(height: 20),
            Text(
              'Order Details',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text('Service Name: ${widget.serviceName}'),
            SizedBox(height: 20),
            Text(
              'Payment Details',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            SizedBox(height: 20),
            Text(
              'Mechanic details',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text('Mechanic Name: ${widget.mechanicName}'),
            SizedBox(height: 10),

            Text('Mechanic Number: ${widget.mechanicNumber}'),

            // Text('Order Date: ${widget.orderDate}'),
            SizedBox(height: 20),
            Text(
              'Order Status',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            Text("Status : ${getStatusString(widget.status)}"),

            // DashedDivider(),
            Divider(),
            SizedBox(height: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                widget.isImageSelected && widget.isPriceEnabled
                    ? reusbaleRowTextWidget("Payment Type :", "Fix")
                    : reusbaleRowTextWidget("Payment Type :", "Arriving"),
                widget.isPriceEnabled && widget.isImageSelected
                    ? reusbaleRowTextWidget(
                        "Fix Price :", "\$${widget.fixPrice}")
                    : reusbaleRowTextWidget(
                        "Arriving Charges :", "\$${widget.arrivingCharges}"),
                reusbaleRowTextWidget("Payment Mode :", "${widget.payMode}"),
                SizedBox(height: 3),
                SizedBox(height: 5),
                DashedDivider(),
                SizedBox(height: 5),
              ],
            ),
            SizedBox(height: 20),
            Divider(),
            // Add more details as needed
          ],
        ),
      ),
    );
  }

  Row reusbaleRowTextWidget(String firstTitle, String secondTitle) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(firstTitle, style: appStyle(14, kDark, FontWeight.normal)),
        Text(secondTitle, style: appStyle(11, kGray, FontWeight.normal)),
      ],
    );
  }

//====================== round fare==============
  double roundFare(double fare) {
    if (fare - fare.floor() >= 0.5) {
      return fare.ceilToDouble();
    } else {
      return fare.floorToDouble();
    }
  }

  // Define a function to map numeric status to string status
  String getStatusString(int status) {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Mechanic Accepted";
      case 2:
        return "Driver Accepted";
      case 3:
        return "Paid";
      case 4:
        return "Ongoing";
      case 5:
        return "Completed";
      case -1:
        return "Cancelled";
      // Add more cases as needed for other statuses
      default:
        return "Unknown Status";
    }
  }
}
