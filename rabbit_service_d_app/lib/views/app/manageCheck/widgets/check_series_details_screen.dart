import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class CheckSeriesDetailScreen extends StatelessWidget {
  final String seriesId;
  final String seriesName;

  const CheckSeriesDetailScreen({
    super.key,
    required this.seriesId,
    required this.seriesName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Check Series: $seriesName'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('CheckSeries')
            .doc(seriesId)
            .collection('Checks')
            .orderBy('checkNumber')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No checks found'));
          }

          return ListView.builder(
            itemCount: snapshot.data!.docs.length,
            itemBuilder: (context, index) {
              var check =
                  snapshot.data!.docs[index].data() as Map<String, dynamic>;
              return ListTile(
                title: Text(check['checkNumber']),
                trailing: Icon(
                  check['isUsed']
                      ? Icons.check_circle
                      : Icons.radio_button_unchecked,
                  color: check['isUsed'] ? Colors.green : Colors.grey,
                ),
                subtitle: check['isUsed']
                    ? Text(
                        'Used on ${DateFormat('MMM dd, yyyy').format((check['usedAt'] as Timestamp).toDate())}')
                    : const Text('Available'),
              );
            },
          );
        },
      ),
    );
  }
}
