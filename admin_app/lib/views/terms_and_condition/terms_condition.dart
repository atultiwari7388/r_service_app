import 'package:admin_app/utils/app_styles.dart';
import 'package:admin_app/utils/constants.dart';
import 'package:flutter/material.dart';

class TermsAndConditionsScreen extends StatelessWidget {
  const TermsAndConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("T&C", style: appStyle(17, kDark, FontWeight.normal)),
      ),
    );
  }
}
