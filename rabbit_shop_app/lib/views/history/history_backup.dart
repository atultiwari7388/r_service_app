
  // StreamBuilder<QuerySnapshot<Object?>> buildOrderStreamSection() {
  //   return StreamBuilder<QuerySnapshot>(
  //     stream: jobsStream,
  //     builder: (BuildContext context, AsyncSnapshot<QuerySnapshot> snapshot) {
  //       if (snapshot.connectionState == ConnectionState.waiting) {
  //         return const Center(child: CircularProgressIndicator());
  //       }
  //       if (snapshot.hasError) {
  //         return Text('Error: ${snapshot.error}');
  //       }
  //       if (snapshot.data!.docs.isEmpty) {
  //         return Center(
  //           child: Column(
  //             mainAxisAlignment: MainAxisAlignment.center,
  //             children: [
  //               const SizedBox(height: 20),
  //               ReusableText(
  //                 text: "No Jobs Found",
  //                 style: appStyle(20, kSecondary, FontWeight.bold),
  //               ),
  //             ],
  //           ),
  //         );
  //       }
  //       // Filter orders based on status
  //       List<Map<String, dynamic>> ongoingOrders = [];
  //       List<Map<String, dynamic>> completedOrders = [];

  //       // Extract orders data from the snapshot
  //       List<Map<String, dynamic>> orders = snapshot.data!.docs
  //           .map((doc) => doc.data() as Map<String, dynamic>)
  //           .toList();

  //       ongoingOrders = orders
  //           .where((order) => order['status'] >= 1 && order['status'] <= 4)
  //           .toList();
  //       completedOrders =
  //           orders.where((order) => order['status'] == 5).toList();

  //       return DefaultTabController(
  //         length: 2,
  //         child: Column(
  //           children: [
  //             TabBar(
  //               controller: _tabsController,
  //               labelColor: kSecondary,
  //               unselectedLabelColor: kGray,
  //               tabAlignment: TabAlignment.center,
  //               padding: EdgeInsets.zero,
  //               isScrollable: true,
  //               labelStyle: appStyle(16, kDark, FontWeight.normal),
  //               indicator: UnderlineTabIndicator(
  //                 borderSide: BorderSide(
  //                     width: 2.w, color: kPrimary), // Set your color here
  //                 insets: EdgeInsets.symmetric(horizontal: 20.w),
  //               ),
  //               tabs: const [
  //                 Tab(text: "Ongoing"),
  //                 Tab(text: "Complete/Cancel"),
  //               ],
  //             ),
  //             Expanded(
  //               child: TabBarView(
  //                 controller: _tabsController,
  //                 children: [
  //                   _buildOrdersList(ongoingOrders, 1),
  //                   _buildOrdersList(completedOrders, 2),
  //                 ],
  //               ),
  //             ),
  //           ],
  //         ),
  //       );
  //     },
  //   );
  // }