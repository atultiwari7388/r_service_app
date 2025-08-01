// import 'dart:async';
// import 'dart:developer';

// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:firebase_auth/firebase_auth.dart';
// import 'package:flutter/foundation.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_vector_icons/flutter_vector_icons.dart';
// import 'package:get/get.dart';
// import 'package:regal_service_d_app/utils/constants.dart';
// import 'package:regal_service_d_app/utils/app_styles.dart';
// import 'package:regal_service_d_app/views/app/adminContact/admin_contact_screen.dart';
// import 'package:regal_service_d_app/views/app/dashboard/dashboard_screen.dart';
// import 'package:regal_service_d_app/views/app/history/history_screen.dart';
// import 'package:regal_service_d_app/views/app/myJobs/my_jobs_screen.dart';
// import 'package:regal_service_d_app/views/app/onBoard/on_boarding_screen.dart';
// import 'package:regal_service_d_app/views/app/reports/reports_screen.dart';

// class EntryScreen extends StatefulWidget {
//   const EntryScreen({super.key});

//   @override
//   _EntryScreenState createState() => _EntryScreenState();
// }

// class _EntryScreenState extends State<EntryScreen>
//     with SingleTickerProviderStateMixin, WidgetsBindingObserver {
//   int tab = 0;
//   bool loading = true;
//   bool isActive = true; // Track user active status
//   late AnimationController _animationController;
//   User? _currentUser;
//   StreamSubscription<DocumentSnapshot>? _userStatusSubscription;

//   @override
//   void initState() {
//     super.initState();
//     WidgetsBinding.instance.addObserver(this);
//     _initScreen();
//     _animationController = AnimationController(
//       duration: const Duration(milliseconds: 1000),
//       vsync: this,
//     )..repeat();
//   }

//   Future<void> _initScreen() async {
//     try {
//       // Check authentication state
//       _currentUser = FirebaseAuth.instance.currentUser;

//       if (_currentUser == null) {
//         // If no user, redirect to onboarding
//         _redirectToOnboarding();
//         return;
//       }

//       // Verify email if needed
//       if (!_currentUser!.emailVerified) {
//         await _currentUser!.sendEmailVerification();
//         _redirectToOnboarding();
//         return;
//       }

//       // Start listening to user status changes
//       _setupUserStatusListener();

//       // Load initial user data
//       await _loadUserData();

//       setState(() {
//         loading = false;
//       });
//     } catch (e) {
//       if (kDebugMode) {
//         print('EntryScreen initialization error: $e');
//       }
//       _redirectToOnboarding();
//     }
//   }

//   void _setupUserStatusListener() {
//     if (_currentUser == null) return;

//     _userStatusSubscription = FirebaseFirestore.instance
//         .collection('Users')
//         .doc(_currentUser?.uid)
//         .snapshots()
//         .listen((snapshot) {
//       if (snapshot.exists) {
//         final data = snapshot.data();
//         final activeStatus = data?['active'] ?? true;

//         if (activeStatus != isActive) {
//           setState(() {
//             isActive = activeStatus;
//           });

//           if (!activeStatus) {
//             // User is deactivated, redirect to contact screen
//             WidgetsBinding.instance.addPostFrameCallback((_) {
//               Get.offAll(() => const AdminContactScreen());
//             });
//           }
//         }
//       }
//     }, onError: (error) {
//       log("Error listening to user status: $error");
//     });
//   }

//   Future<void> _loadUserData() async {
//     try {
//       final userSnapshot = await FirebaseFirestore.instance
//           .collection('Users')
//           .doc(_currentUser?.uid)
//           .get();

//       if (!userSnapshot.exists) {
//         throw Exception("User document not found");
//       }

//       // Check initial active status
//       final data = userSnapshot.data();
//       final activeStatus = data?['active'] ?? true;

//       if (!activeStatus) {
//         // User is deactivated, redirect to contact screen
//         WidgetsBinding.instance.addPostFrameCallback((_) {
//           Get.offAll(() => const AdminContactScreen());
//         });
//         return;
//       }

//       setState(() {
//         isActive = activeStatus;
//         loading = false;
//       });
//     } catch (e) {
//       log("Error in _loadUserData: $e");
//       _redirectToOnboarding();
//     }
//   }

//   void _redirectToOnboarding() {
//     WidgetsBinding.instance.addPostFrameCallback((_) {
//       Get.offAll(() => const OnBoardingScreen());
//     });
//   }

//   @override
//   void didChangeAppLifecycleState(AppLifecycleState state) {
//     if (state == AppLifecycleState.resumed) {
//       _verifyCurrentUser();
//     }
//   }

//   Future<void> _verifyCurrentUser() async {
//     final user = FirebaseAuth.instance.currentUser;
//     if (user?.uid != _currentUser?.uid) {
//       _redirectToOnboarding();
//     }
//   }

//   @override
//   void dispose() {
//     WidgetsBinding.instance.removeObserver(this);
//     _animationController.dispose();
//     _userStatusSubscription?.cancel();
//     super.dispose();
//   }

//   void setTab(int index) {
//     setState(() {
//       tab = index;
//     });
//   }

//   @override
//   Widget build(BuildContext context) {
//     if (loading) {
//       return const Scaffold(
//         body: Center(
//           child: CircularProgressIndicator(),
//         ),
//       );
//     }

//     if (!isActive) {
//       return const AdminContactScreen();
//     }

//     final pages = <Widget>[
//       const ReportsScreen(),
//       const MyJobsScreen(),
//       const HistoryScreen(),
//       DashBoardScreen(setTab: setTab),
//     ];

//     return Scaffold(
//       body: IndexedStack(
//         index: tab,
//         children: pages,
//       ),
//       bottomNavigationBar: _buildBottomNavBar(),
//     );
//   }

//   BottomNavigationBar _buildBottomNavBar() {
//     return BottomNavigationBar(
//       elevation: kIsWeb ? 1 : 5,
//       items: [
//         BottomNavigationBarItem(
//           backgroundColor: kPrimary,
//           tooltip: "Records",
//           icon: AnimatedBuilder(
//             animation: _animationController,
//             builder: (context, child) {
//               return Container(
//                 padding: const EdgeInsets.all(5),
//                 decoration: BoxDecoration(
//                     borderRadius: BorderRadius.circular(20),
//                     color: Color.lerp(
//                         kPrimary, kSecondary, _animationController.value)),
//                 child: const Icon(AntDesign.barschart, color: kWhite),
//               );
//             },
//           ),
//           label: "RECORDS",
//         ),
//         const BottomNavigationBarItem(
//           icon: Icon(AntDesign.jpgfile1),
//           label: "My Jobs",
//         ),
//         const BottomNavigationBarItem(
//           icon: Icon(AntDesign.book),
//           label: "History",
//         ),
//         const BottomNavigationBarItem(
//           icon: Icon(AntDesign.search1),
//           label: "Mechanic",
//         ),
//       ],
//       currentIndex: tab,
//       selectedItemColor: kPrimary,
//       showSelectedLabels: true,
//       showUnselectedLabels: true,
//       unselectedIconTheme:
//           tab == 3 ? IconThemeData(color: kDark) : IconThemeData(color: kGray),
//       selectedIconTheme: const IconThemeData(color: kPrimary),
//       selectedLabelStyle: tab == 3
//           ? appStyle(14, kPrimary, FontWeight.bold)
//           : appStyle(12, kSecondary, FontWeight.bold),
//       type: BottomNavigationBarType.fixed,
//       onTap: (index) {
//         setState(() {
//           tab = index;
//         });
//       },
//     );
//   }
// }

import 'dart:async';
import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/views/app/adminContact/admin_contact_screen.dart';
import 'package:regal_service_d_app/views/app/dashboard/dashboard_screen.dart';
import 'package:regal_service_d_app/views/app/history/history_screen.dart';
import 'package:regal_service_d_app/views/app/myJobs/my_jobs_screen.dart';
import 'package:regal_service_d_app/views/app/reports/reports_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class EntryScreen extends StatefulWidget {
  const EntryScreen({super.key});

  @override
  _EntryScreenState createState() => _EntryScreenState();
}

class _EntryScreenState extends State<EntryScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  int tab = 3;
  bool loading = true;
  bool isActive = true; // Track user active status
  late AnimationController _animationController;
  User? _currentUser;
  StreamSubscription<DocumentSnapshot>? _userStatusSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initScreen();
    getAnonymousUserFromSharedPrefs();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat();
  }

  void getAnonymousUserFromSharedPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('an_user_id');
    log("Anonymous User ID from Shared Preferences: $userId");
  }

  Future<void> _initScreen() async {
    try {
      // Check authentication state
      _currentUser = FirebaseAuth.instance.currentUser;

      // If user is logged in, set up listeners and load data
      if (_currentUser != null) {
        // Verify email if needed (but don't block access)
        if (!_currentUser!.emailVerified) {
          await _currentUser!.sendEmailVerification();
        }

        // Start listening to user status changes
        _setupUserStatusListener();

        // Load initial user data
        await _loadUserData();
      }

      setState(() {
        loading = false;
      });
    } catch (e) {
      if (kDebugMode) {
        print('EntryScreen initialization error: $e');
      }
      setState(() {
        loading = false;
      });
    }
  }

  void _setupUserStatusListener() {
    if (_currentUser == null) return;

    _userStatusSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(_currentUser?.uid)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final data = snapshot.data();
        final activeStatus = data?['active'] ?? true;

        if (activeStatus != isActive) {
          setState(() {
            isActive = activeStatus;
          });

          if (!activeStatus) {
            // User is deactivated, redirect to contact screen
            WidgetsBinding.instance.addPostFrameCallback((_) {
              Get.offAll(() => const AdminContactScreen());
            });
          }
        }
      }
    }, onError: (error) {
      log("Error listening to user status: $error");
    });
  }

  Future<void> _loadUserData() async {
    try {
      if (_currentUser == null) return;

      final userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(_currentUser?.uid)
          .get();

      if (!userSnapshot.exists) {
        return;
      }

      // Check initial active status
      final data = userSnapshot.data();
      final activeStatus = data?['active'] ?? true;

      if (!activeStatus) {
        // User is deactivated, redirect to contact screen
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.offAll(() => const AdminContactScreen());
        });
        return;
      }

      setState(() {
        isActive = activeStatus;
      });
    } catch (e) {
      log("Error in _loadUserData: $e");
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _verifyCurrentUser();
    }
  }

  Future<void> _verifyCurrentUser() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user?.uid != _currentUser?.uid) {
      setState(() {
        _currentUser = user;
      });
      // No redirection - just update the current user
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _animationController.dispose();
    _userStatusSubscription?.cancel();
    super.dispose();
  }

  void setTab(int index) {
    setState(() {
      tab = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (!isActive && _currentUser != null) {
      return const AdminContactScreen();
    }

    // All 4 screens will be shown regardless of login status
    final pages = <Widget>[
      const ReportsScreen(),
      const MyJobsScreen(),
      const HistoryScreen(),
      DashBoardScreen(setTab: setTab),
    ];

    return Scaffold(
      body: IndexedStack(
        index: tab,
        children: pages,
      ),
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  BottomNavigationBar _buildBottomNavBar() {
    return BottomNavigationBar(
      elevation: kIsWeb ? 1 : 5,
      items: [
        BottomNavigationBarItem(
          backgroundColor: kPrimary,
          tooltip: "Records",
          icon: AnimatedBuilder(
            animation: _animationController,
            builder: (context, child) {
              return Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: Color.lerp(
                        kPrimary, kSecondary, _animationController.value)),
                child: const Icon(AntDesign.barschart, color: kWhite),
              );
            },
          ),
          label: "RECORDS",
        ),
        const BottomNavigationBarItem(
          icon: Icon(AntDesign.jpgfile1),
          label: "My Jobs",
        ),
        const BottomNavigationBarItem(
          icon: Icon(AntDesign.book),
          label: "History",
        ),
        const BottomNavigationBarItem(
          icon: Icon(AntDesign.search1),
          label: "Mechanic",
        ),
      ],
      currentIndex: tab,
      selectedItemColor: kPrimary,
      showSelectedLabels: true,
      showUnselectedLabels: true,
      unselectedIconTheme:
          tab == 3 ? IconThemeData(color: kDark) : IconThemeData(color: kGray),
      selectedIconTheme: const IconThemeData(color: kPrimary),
      selectedLabelStyle: tab == 3
          ? appStyle(14, kPrimary, FontWeight.bold)
          : appStyle(12, kSecondary, FontWeight.bold),
      type: BottomNavigationBarType.fixed,
      onTap: (index) {
        setState(() {
          tab = index;
        });
      },
    );
  }
}
