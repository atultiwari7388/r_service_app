import 'package:flutter/material.dart';
import 'package:regal_service_d_app/views/dashboard/widgets/shopper_card_widget.dart';

class NearByShopListWidget extends StatefulWidget {
  const NearByShopListWidget({Key? key}) : super(key: key);

  @override
  _NearByShopListWidgetState createState() => _NearByShopListWidgetState();
}

class _NearByShopListWidgetState extends State<NearByShopListWidget> {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: ListView.builder(
        shrinkWrap: true,
        physics: NeverScrollableScrollPhysics(),
        itemCount: 5,
        itemBuilder: (ctx, i) {
          return ShopperCardWidget(
            img:
                "https://bcdn.mindler.com/bloglive/wp-content/uploads/2021/12/10163055/Blog-Banner.png",
            title: "Dummy Card Title",
            onTap: () {},
          );
        },
      ),
    );

    // return StreamBuilder(
    //   stream: FirebaseFirestore.instance
    //       .collection("Categories")
    //       .orderBy("priority", descending: false)
    //       .where("active", isEqualTo: true)
    //       .snapshots(),
    //   builder: (context, snapshot) {
    //     if (snapshot.connectionState == ConnectionState.waiting) {
    //       return Center(
    //         child: CircularProgressIndicator(),
    //       );
    //     } else if (snapshot.hasError) {
    //       return Center(
    //         child: Text(snapshot.error.toString()),
    //       );
    //     } else {
    //       final catG = snapshot.data!.docs;
    //       // final searchText = widget.searchText.toLowerCase();

    //       return Container(
    //         padding: EdgeInsets.only(left: 12.w, top: 5.h),
    //         child: ListView.builder(
    //           shrinkWrap: true,
    //           physics: NeverScrollableScrollPhysics(),
    //           itemCount: 5,
    //           itemBuilder: (ctx, i) {
    //             return CategoryWidget(
    //               img: catData["imageUrl"],
    //               title: catData["categoryName"],
    //               onTap: () {},
    //             );
    //           },
    //         ),
    //       );

    //     }
    //   },
    // );
  }
}
