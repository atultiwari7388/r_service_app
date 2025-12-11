import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';

class NoInternetScreen extends StatelessWidget {
  const NoInternetScreen({super.key});

  Future<void> _checkInternetAndNavigate(BuildContext context) async {
    final hasInternet = await InternetConnectionCheckerPlus().hasConnection;

    if (hasInternet && Get.isOverlaysOpen) {
      // If internet is restored and this screen is open, navigate back
      Get.back();
    } else if (!hasInternet) {
      // Show snackbar if still no internet
      Get.snackbar(
        'No Internet',
        'Please check your internet connection',
        backgroundColor: Colors.red,
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Illustration/Icon
              Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.grey.shade200, width: 1),
                ),
                child: Icon(
                  Icons.wifi_off_rounded,
                  size: 80,
                  color: Colors.grey.shade400,
                ),
              ),

              const SizedBox(height: 32),

              // Title
              Text(
                "No Internet Connection",
                style: appStyle(28, kDark, FontWeight.w700),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 16),

              // Description
              Text(
                "It seems you're offline. Please check your internet connection and try again.",
                style: appStyle(16, Colors.grey.shade600, FontWeight.w400),
                textAlign: TextAlign.center,
                maxLines: 2,
              ),

              const SizedBox(height: 40),

              // Refresh Button
              ElevatedButton(
                onPressed: () => _checkInternetAndNavigate(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                  shadowColor: Colors.blue.shade100,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.refresh_rounded, size: 22),
                    const SizedBox(width: 12),
                    Text(
                      "Try Again",
                      style: appStyle(16, Colors.white, FontWeight.w600),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Retry with Icon Button (Alternative)
              TextButton.icon(
                onPressed: () => _checkInternetAndNavigate(context),
                icon: const Icon(Icons.settings_ethernet_rounded),
                label: Text(
                  "Retry Connection",
                  style: appStyle(14, kDark.withOpacity(0.7), FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
