import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../utils/app_styles.dart';
import '../../../../utils/constants.dart';

class ShopperCardWidget extends StatelessWidget {
  const ShopperCardWidget({
    Key? key,
    required this.img,
    required this.title,
    required this.onTap,
    // required this.isVeg,
  }) : super(key: key);

  final String img;
  final String title;
  // final bool isVeg;
  final void Function()? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: Stack(
            children: [
              Container(
                height: 210.h,
                decoration: BoxDecoration(
                  border: Border.all(color: kPrimary),
                ),
                width: double.infinity,
                child: Image.network(
                  img,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(15),
                      bottomRight: Radius.circular(15),
                    ),
                    // color: kWhite,
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        kWhite,
                        kWhite,
                        kWhite,
                        // kPrimary.withOpacity(0.1),
                        // kPrimary.withOpacity(0.1),
                        // kPrimary.withOpacity(0.1),
                      ],
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(title, style: appStyle(15, kDark, FontWeight.w500)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
