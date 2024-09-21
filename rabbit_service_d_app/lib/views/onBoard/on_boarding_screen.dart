import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../utils/constants.dart';
import '../auth/login_screen.dart';

class OnBoardingScreen extends StatefulWidget {
  const OnBoardingScreen({super.key});

  @override
  State<OnBoardingScreen> createState() => _OnBoardingScreenState();
}

class _OnBoardingScreenState extends State<OnBoardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, String>> _onBoardingData = [
    {
      "image": "assets/on_board_1.png",
      "heading": "Easy Book Service",
      "subheading":
          "Book service using our app & Our Mechanics will help you in your location.",
    },
    {
      "image": "assets/on_board_2.png",
      "heading": "Secure Transaction",
      "subheading":
          "Encryption helps keep online data and communications safe and private",
    },
    {
      "image": "assets/on_board_3.png",
      "heading": "Easy to Search",
      "subheading": "Search your service in single click",
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              // kPrimary.withOpacity(0.1),
              // kWhite.withOpacity(0.1),
              // kSecondary.withOpacity(0.1)
              kWhite,
              // kPrimary,
              kWhite,
              kWhite,
            ],
          ),
        ),
        child: Column(
          children: [
            Expanded(
              flex: 4,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _onBoardingData.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.all(5.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.asset(
                          _onBoardingData[index]['image']!,
                          height: 200,
                        ),
                        const SizedBox(height: 20),
                        Text(
                          _onBoardingData[index]['heading']!,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: kDark,
                          ),
                        ),
                        SizedBox(height: 10.h),
                        Padding(
                          padding: const EdgeInsets.only(left: 18.0, right: 18),
                          child: Text(
                            _onBoardingData[index]['subheading']!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            SmoothPageIndicator(
              controller: _pageController,
              count: _onBoardingData.length,
              effect: const WormEffect(
                dotHeight: 8,
                dotWidth: 8,
                activeDotColor: kPrimary,
              ),
            ),
            SizedBox(height: 20.h),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 10.0.w),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary,
                    foregroundColor: kWhite,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    minimumSize: Size(220.w, 42.h)),
                onPressed: () {
                  if (_currentPage == _onBoardingData.length - 1) {
                    // Navigate to another screen, e.g., HomeScreen
                    Get.offAll(() => const LoginScreen(),
                        transition: Transition.cupertino,
                        duration: const Duration(milliseconds: 900));
                  } else {
                    _pageController.nextPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  }
                },
                child: Text(_currentPage == _onBoardingData.length - 1
                    ? 'Get Started'
                    : 'Next'),
              ),
            ),
            SizedBox(height: 20.h),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose(); // Dispose the PageController
    super.dispose();
  }
}
