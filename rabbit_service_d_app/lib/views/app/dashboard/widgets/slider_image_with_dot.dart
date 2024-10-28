  // /**--------------------------- Build Carousel Slider ----------------------------**/
  // Widget buildImageSlider() {
  //   return Column(
  //     children: [
  //       CarouselSlider(
  //         items: sliderDocs.map((imageUrl) {
  //           return ClipRRect(
  //             borderRadius: BorderRadius.circular(15),
  //             child: Image.network(
  //               imageUrl,
  //               loadingBuilder: (BuildContext context, Widget child,
  //                   ImageChunkEvent? loadingProgress) {
  //                 if (loadingProgress == null) {
  //                   return child;
  //                 } else {
  //                   return _buildPlaceholder(); // Display placeholder while loading
  //                 }
  //               },
  //               width: double.maxFinite,
  //               fit: BoxFit.fill,
  //             ),
  //           );
  //         }).toList(),
  //         options: CarouselOptions(
  //           enableInfiniteScroll: false,
  //           // Disable infinite scroll to prevent wrapping
  //           autoPlay: true,
  //           aspectRatio: 16 / 7,
  //           viewportFraction: 1,
  //           onPageChanged: (index, reason) {
  //             setState(() {
  //               _currentIndex = index;
  //             });
  //           },
  //         ),
  //       ),
  //       SizedBox(height: 10.h),
  //       buildDotIndicator(), // Add the dot indicator below the slider
  //     ],
  //   );
  // }

  // Widget buildDotIndicator() {
  //   return AnimatedSmoothIndicator(
  //     activeIndex: _currentIndex,
  //     count: sliderDocs.length,
  //     effect: ExpandingDotsEffect(
  //       activeDotColor: kPrimary, // Color of the active dot
  //       dotHeight: 8.h,
  //       dotWidth: 8.w,
  //       expansionFactor: 3,
  //     ),
  //   );
  // }

  // Widget _buildPlaceholder() {
  //   return Center(child: CircularProgressIndicator());
  // }

