import 'package:admin_app/utils/app_styles.dart';
import 'package:admin_app/utils/constants.dart';
import 'package:flutter/material.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:
            Text("Help Screen", style: appStyle(17, kDark, FontWeight.normal)),
      ),
    );
  }
}
