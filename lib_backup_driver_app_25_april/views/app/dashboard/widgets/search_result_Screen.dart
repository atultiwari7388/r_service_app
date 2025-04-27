import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'result_card_widget.dart';

class SearchResultsScreen extends StatelessWidget {
  final String searchText;

  const SearchResultsScreen({Key? key, required this.searchText})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Sample data, replace with your real data
    final List<Map<String, dynamic>> searchResults = [
      {
        'title': 'Fleet Masters Truck & Trailer Repair',
        'subtitle': '24/7 Emergency Truck & RV Repair',
        'imageUrl':
            'https://firebasestorage.googleapis.com/v0/b/food-otg-service-app.appspot.com/o/6.png?alt=media&token=83efcc3f-0020-4ff4-a6a7-3b1381962de6',
        'location': 'Pine Bluff, AR - 21.32 mi.',
        'isOpen': true,
      },
      // Add more results here
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text('Search Results'),
      ),
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 15.h),
        child: ListView.builder(
          itemCount: searchResults.length,
          itemBuilder: (context, index) {
            final result = searchResults[index];
            return SearchResultCard(
              title: searchText.toString(),
              subtitle: result['subtitle'],
              imageUrl: result['imageUrl'],
              location: result['location'],
              isOpen: result['isOpen'],
              onCallPressed: () {
                // Implement call functionality
              },
              onSharePressed: () {},
              onViewMapPressed: () {},
              onAddToFavoritePressed: () {},
            );
          },
        ),
      ),
    );
  }
}
