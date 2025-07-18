import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/entry_screen.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../../utils/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnBoardingScreen extends StatefulWidget {
  const OnBoardingScreen({super.key});

  @override
  State<OnBoardingScreen> createState() => _OnBoardingScreenState();
}

class _OnBoardingScreenState extends State<OnBoardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;

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
      body: LayoutBuilder(
        builder: (context, constraints) {
          // Determine if it's a desktop view or mobile view
          bool isDesktop = constraints.maxWidth > 800;

          return Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
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
                      // Different layout for desktop
                      return Padding(
                        padding: const EdgeInsets.all(5.0),
                        child: isDesktop
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Image.asset(
                                      _onBoardingData[index]['image']!,
                                      height: 300,
                                    ),
                                  ),
                                  Expanded(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          _onBoardingData[index]['heading']!,
                                          style: const TextStyle(
                                            fontSize: 28,
                                            fontWeight: FontWeight.bold,
                                            color: kDark,
                                          ),
                                        ),
                                        SizedBox(height: 20.h),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 18.0),
                                          child: Text(
                                            _onBoardingData[index]
                                                ['subheading']!,
                                            textAlign: TextAlign.center,
                                            style: const TextStyle(
                                              fontSize: 18,
                                              color: Colors.grey,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              )
                            : Column(
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
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 18.0),
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
                  child: _isLoading
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: kPrimary,
                          ),
                        )
                      : ElevatedButton(
                          style: ElevatedButton.styleFrom(
                              backgroundColor: kPrimary,
                              foregroundColor: kWhite,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              minimumSize: Size(220.w, 42.h)),
                          onPressed: () async {
                            if (_currentPage == _onBoardingData.length - 1) {
                              try {
                                setState(() {
                                  _isLoading = true;
                                });
                                await FirebaseAuth.instance
                                    .signInAnonymously()
                                    .then((value) async {
                                  //save user data to firebase and also save the userId in shared preferences

                                  final prefs =
                                      await SharedPreferences.getInstance();
                                  await prefs.setString(
                                      'an_user_id', value.user!.uid);
                                  log("User signed in anonymously: ${value.user!.uid}");

                                  _saveUserData(value.user!.uid).then((_) {
                                    log("User data saved successfully");
                                    Get.offAll(() => const EntryScreen(),
                                        transition: Transition.cupertino,
                                        duration:
                                            const Duration(milliseconds: 900));
                                  }).catchError((error) {
                                    log("Error saving user data: $error");
                                  });
                                }).catchError((error) {
                                  log(error.toString());
                                  Get.snackbar('Error', error.toString(),
                                      snackPosition: SnackPosition.BOTTOM);
                                });
                              } catch (e) {
                                log("Error during anonymous sign-in: $e");
                                Get.snackbar('Error', e.toString(),
                                    snackPosition: SnackPosition.BOTTOM);
                              } finally {
                                setState(() {
                                  _isLoading = false;
                                });
                              }
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
          );
        },
      ),
    );
  }

  Future<void> _saveUserData(String uId) async {
    final fireStoreDatabase = FirebaseFirestore.instance.collection("Users");
    try {
      await fireStoreDatabase.doc(uId).set({
        "status": "active",
        "isAnonymous": true,
        "isProfileComplete": false,
        "uid": uId,
        "userName": "", //name
        "phoneNumber": "", //phone number
        "telephoneNumber": "", //telephone number
        "email": "", //email address
        "email2": "",
        "address": "", //address
        "city": "", //city
        "state": "", //state
        "country": "", //country
        "postalCode": "", //postal code
        "licNumber": "", //license number
        "licExpDate": DateTime.now().toString(), //license expiry date
        "dob": DateTime.now().toString(), //Date of birth
        "lastDrugTest": DateTime.now().toString(), //last drug test
        "dateOfHire": DateTime.now().toString(), //date of hire
        "dateOfTermination": DateTime.now().toString(), //date of termination
        "socialSecurity": "", //social security number
        "active": true,
        'perMileCharge': "",
        "companyName": "",
        "vehicleRange": "",
        "isTeamMember": false,
        "lastAddress": "",
        "profilePicture":
            "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
        "wallet": 0,
        "isNotificationOn": true,
        'createdBy': uId,
        'role': 'Owner',
        'teamMembers': [],
        'isOwner': true,
        'isManager': false,
        'isDriver': false,
        'isVendor': false,
        "isView": true,
        "isCheque": true,
        'payMode': '',
        "isEdit": true,
        "isDelete": true,
        "isAdd": true,
        "created_at": DateTime.now(),
        "updated_at": DateTime.now(),
      });
    } catch (e) {
      log(e.toString());
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}
