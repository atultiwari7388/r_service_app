import 'package:cloud_firestore/cloud_firestore.dart';

Future generateOrderId() async {
  int newCount = 0;

  await FirebaseFirestore.instance.runTransaction((transaction) async {
    DocumentReference counterRef =
        FirebaseFirestore.instance.collection('metadata').doc('bookingCounter');
    DocumentSnapshot snapshot = await transaction.get(counterRef);

    if (!snapshot.exists) {
      throw Exception("Counter doesn't exist");
    }

    newCount = ((snapshot.data()! as Map<String, dynamic>)['count'] as int) + 1;

    // Increment the counter
    transaction.update(
        counterRef, {'count': newCount}); // Update the counter in Firestore
  });

  return "#RMS${newCount.toString().padLeft(5, '0')}"; // Construct the booking ID
}
