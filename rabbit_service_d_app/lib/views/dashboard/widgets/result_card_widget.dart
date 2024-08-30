import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class SearchResultCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String imageUrl;
  final String location;
  final bool isOpen;
  final VoidCallback onCallPressed;
  final VoidCallback onSharePressed;
  final VoidCallback onViewMapPressed;
  final VoidCallback onAddToFavoritePressed;

  const SearchResultCard({
    Key? key,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.location,
    required this.isOpen,
    required this.onCallPressed,
    required this.onSharePressed,
    required this.onViewMapPressed,
    required this.onAddToFavoritePressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
          color: kSecondary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12.r)),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 5.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image, title, subtitle, and status
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8.0),
                  child: Image.network(imageUrl,
                      width: 100, height: 100, fit: BoxFit.cover),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
                      SizedBox(height: 4),
                      Text(subtitle,
                          style:
                              TextStyle(fontSize: 14, color: Colors.grey[600])),
                      SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.circle,
                              color: isOpen ? Colors.green : Colors.red,
                              size: 10),
                          SizedBox(width: 5),
                          Text(isOpen ? "Open" : "Closed",
                              style: TextStyle(
                                  color: isOpen ? Colors.green : Colors.red,
                                  fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: onCallPressed,
                  icon: Icon(Icons.phone, color: Colors.orange),
                  tooltip: 'Call',
                ),
              ],
            ),
            SizedBox(height: 10),

            // Location and other details
            Text(location,
                style: TextStyle(fontSize: 14, color: Colors.grey[700])),
            SizedBox(height: 10),
            Divider(),

            // Action buttons (Share, View Map, Add to Favorite)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                IconButton(
                  onPressed: onSharePressed,
                  icon: Icon(Icons.share, color: Colors.grey[600]),
                  tooltip: 'Share',
                ),
                IconButton(
                  onPressed: onViewMapPressed,
                  icon: Icon(Icons.map, color: Colors.grey[600]),
                  tooltip: 'View Map',
                ),
                IconButton(
                  onPressed: onAddToFavoritePressed,
                  icon: Icon(Icons.favorite_border, color: Colors.grey[600]),
                  tooltip: 'Add to Favorite',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
