import 'package:admin_app/utils/app_styles.dart';
import 'package:admin_app/utils/constants.dart';
import 'package:flutter/material.dart';

class AllJobsScreen extends StatelessWidget {
  const AllJobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("All Jobs", style: appStyle(17, kDark, FontWeight.normal)),
      ),
    );
  }
}
