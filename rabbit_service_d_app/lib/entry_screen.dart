import 'dart:async';
import 'dart:developer';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:get/get.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:regal_service_d_app/controllers/reports_controller.dart';
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
  bool isActive = true;
  late AnimationController _animationController;
  User? _currentUser;
  StreamSubscription<DocumentSnapshot>? _userStatusSubscription;
  String? whatsAppNumber;
  String? _userRole;
  String? _ownerId;

  final ReportsController reportsController = Get.put(ReportsController());
  final DashboardController dashboardController =
      Get.put(DashboardController());

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initScreen();
    dashboardController.initializeController();
    getAnonymousUserFromSharedPrefs();
    fetchHelpContact().then((_) {
      setState(() {});
    });
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat();
  }

  //  FETCH ANONYMOUS USER ID
  void getAnonymousUserFromSharedPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('an_user_id');
    log("Anonymous User ID from Shared Preferences: $userId");
  }

  //  FETCH ADMIN CONTACT
  Future<void> fetchHelpContact() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('metadata')
          .doc('helpCenter')
          .get();
      final data = doc.data();

      if (data != null &&
          data['whatsApp'] != null &&
          data['whatsApp'].toString().isNotEmpty) {
        whatsAppNumber = data['whatsApp'];
      } else {
        whatsAppNumber = null;
      }
    } catch (e) {
      print('Error fetching help contact: $e');
      whatsAppNumber = null;
    }
  }

// CHECK FOR APP UPDATE (MAIN LOGIC)
  Future<void> checkAppUpdate() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('metadata')
          .doc('versions')
          .get();

      if (!doc.exists) return;

      final data = doc.data();
      if (data == null) return;

      // Get platform-specific version
      final latestVersion = Platform.isIOS
          ? data["ios"]?.toString() ?? ""
          : data["android"]?.toString() ?? "";

      if (latestVersion.isEmpty) return;

      final info = await PackageInfo.fromPlatform();
      final currentVersion = "${info.version}+${info.buildNumber}";

      log("Current Version: $currentVersion, Latest Version: $latestVersion");

      if (currentVersion != latestVersion) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => _buildUpdateDialog(latestVersion),
          );
        });
      }
    } catch (e) {
      debugPrint("Error checking app update: $e");
    }
  }

  Widget _buildUpdateDialog(String latestVersion) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Icon
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: kPrimary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.system_update_alt_rounded,
                  color: kPrimary,
                  size: 40,
                ),
              ),

              const SizedBox(height: 16),

              // Title
              Text(
                "New Update Available!",
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 12),

              // Description
              Text(
                "We've made some exciting improvements to enhance your experience.",
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 14,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 20),

              // Version Info Card
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "New Version:",
                      style: TextStyle(
                        color: Colors.black87,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: kSecondary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        "v$latestVersion",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Update Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Platform-specific app store URLs
                    final appStoreUrl = Platform.isIOS
                        ? "https://apps.apple.com/in/app/rabbit-mechanic-service/id6739995003"
                        : "https://play.google.com/store/apps/details?id=com.rabbit_u_d_app.rabbit_services_app";

                    launchUrl(Uri.parse(appStoreUrl));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary,
                    foregroundColor: Colors.white,
                    elevation: 5,
                    shadowColor: kPrimary.withOpacity(0.3),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.download_rounded,
                        size: 20,
                        color: kWhite,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "UPDATE NOW",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Features List
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "What's New:",
                      style: appStyleUniverse(
                        14,
                        Colors.black,
                        FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildFeatureItem(
                        "• Bug fixes and performance improvements"),
                    _buildFeatureItem("• Enhanced user interface"),
                    _buildFeatureItem("• New features added"),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

// Feature item widget
  Widget _buildFeatureItem(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Text(
        text,
        style: appStyleUniverse(
          12,
          Colors.black87,
          FontWeight.w400,
        ),
      ),
    );
  }

  // INIT SCREEN WITH UPDATE CHECK INCLUDED
  Future<void> _initScreen() async {
    try {
      // FIRST CHECK FOR UPDATE
      // await checkAppUpdate();

      _currentUser = FirebaseAuth.instance.currentUser;

      if (_currentUser != null) {
        if (!_currentUser!.emailVerified) {
          await _currentUser!.sendEmailVerification();
        }

        await _loadUserRoleAndOwnerId();
        _setupUserStatusListener();
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

  Future<void> _loadUserRoleAndOwnerId() async {
    if (_currentUser == null) return;

    try {
      final userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(_currentUser!.uid)
          .get();

      if (userSnapshot.exists) {
        final data = userSnapshot.data() as Map<String, dynamic>;
        _userRole = data['role']?.toString() ?? '';
        _ownerId = data['createdBy']?.toString() ?? _currentUser!.uid;

        log("User role: $_userRole, Owner ID: $_ownerId");
      }
    } catch (e) {
      log("Error loading user role and ownerId: $e");
      _userRole = '';
      _ownerId = _currentUser!.uid;
    }
  }

  String get _effectiveUserId {
    return _userRole == 'SubOwner' ? _ownerId! : _currentUser!.uid;
  }

  void _setupUserStatusListener() {
    if (_currentUser == null) return;

    // final userIdToListen =
    //     _userRole == 'SubOwner' ? _effectiveUserId : _currentUser!.uid;

    _userStatusSubscription = FirebaseFirestore.instance
        .collection('Users')
        .doc(_currentUser!.uid)
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

      final userIdToCheck =
          _userRole == 'SubOwner' ? _effectiveUserId : _currentUser!.uid;

      final userSnapshot = await FirebaseFirestore.instance
          .collection('Users')
          .doc(userIdToCheck)
          .get();

      if (!userSnapshot.exists) {
        return;
      }

      final data = userSnapshot.data();
      final activeStatus = data?['active'] ?? true;

      if (!activeStatus) {
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

  void _refreshReportsOnTabChange(int index) {
    if (index == 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        reportsController.initializeStreams();
      });
    }
    setState(() {
      tab = index;
    });
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

      if (_currentUser != null) {
        await _loadUserRoleAndOwnerId();
      }
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
        unselectedIconTheme: tab == 3
            ? IconThemeData(color: kDark)
            : IconThemeData(color: kGray),
        selectedIconTheme: const IconThemeData(color: kPrimary),
        selectedLabelStyle: tab == 3
            ? appStyle(14, kPrimary, FontWeight.bold)
            : appStyle(12, kSecondary, FontWeight.bold),
        type: BottomNavigationBarType.fixed,
        onTap: _refreshReportsOnTabChange);
  }
}
