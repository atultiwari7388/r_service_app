import 'package:admin_app/utils/app_styles.dart';
import 'package:admin_app/utils/constants.dart';
import 'package:flutter/material.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Privacy Policy ",
            style: appStyle(17, kDark, FontWeight.normal)),
      ),
    );
  }
}
