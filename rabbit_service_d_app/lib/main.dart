import 'dart:async';
import 'dart:developer';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/controllers/dashboard_controller.dart';
import 'package:regal_service_d_app/services/userRoleService.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/onBoard/on_boarding_screen.dart';
import 'package:regal_service_d_app/services/driver_location_service.dart';
import 'package:regal_service_d_app/views/app/splash/splash_screen.dart';
import 'package:regal_service_d_app/services/notification_navigation_service.dart';
import 'services/push_notification.dart';
import 'entry_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// Function to handle background messages
Future<void> _firebaseBackgroundMessaging(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (message.notification != null) {
    log("Background Notification received");
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase only
  await Firebase.initializeApp(
    options: kIsWeb
        ? const FirebaseOptions(
            apiKey: "...",
            authDomain: "...",
            projectId: "...",
            storageBucket: "...",
            messagingSenderId: "...",
            appId: "...",
            measurementId: "...",
          )
        : null,
  );

  // Register background handler early
  FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundMessaging);

  // Auto-resume driver background location tracking if active load exists
  try {
    DriverLocationService.checkAndResumeTracking();
  } catch (_) {}

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final PushNotification pushNotification;
// late final StreamSubscription<InternetConnectionStatus> _internetSubscription;

  @override
  void initState() {
    super.initState();
    _setupServices();
    // _listenToInternet();
  }

  Future<void> _setupServices() async {
    // Init services
    // await Get.putAsync(() async => UserService());
    Get.put(UserService());

    Get.put(DashboardController());

    // Init Push Notifications
    pushNotification = PushNotification();
    await pushNotification.localNotiInit();
    await pushNotification.init();

    // Handle background taps
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      log("Notification tapped from background: ${message.messageId}");
      NotificationNavigationService.openNotificationCenter();
    });

    // Handle terminated state
    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      log("App launched from notification in terminated state: ${initialMessage.messageId}");
      NotificationNavigationService.pendingNotificationCenter = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        NotificationNavigationService.checkAndOpenPending();
      });
    }
  }

  void _handleNotificationNavigation(RemoteMessage message) {
    NotificationNavigationService.openNotificationCenter();
  }

  // void _listenToInternet() {
  //   _internetSubscription = InternetConnectionCheckerPlus()
  //       .onStatusChange
  //       .listen((InternetConnectionStatus status) {
  //     if (status == InternetConnectionStatus.disconnected) {
  //       // No internet → show screen
  //       Get.to(() => const NoInternetScreen(), transition: Transition.fadeIn);
  //     } else {
  //       // Internet restored → close screen if open
  //       if (Get.isOverlaysOpen) {
  //         Get.back();
  //       }
  //     }
  //   });
  // }

  @override
  void dispose() {
    // _internetSubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 825),
      builder: (_, __) {
        return GetMaterialApp(
          navigatorKey: navigatorKey,
          debugShowCheckedModeBanner: false,
          title: appName,
          themeMode: ThemeMode.system,
          onGenerateRoute: (settings) {
            switch (settings.name) {
              case '/newJob':
              case '/offerAccepted':
              case '/default':
                return MaterialPageRoute(builder: (_) => EntryScreen());
              default:
                return MaterialPageRoute(builder: (_) => SplashScreen());
            }
          },
          home: FutureBuilder(
              future: Get.putAsync(() async => UserService()),
              builder: (context, snapshot) {
                return Obx(() {
                  final userService = UserService.to;
                  if (userService.currentUser.value == null) {
                    return const OnBoardingScreen();
                  } else {
                    return const SplashScreen();
                  }
                });
              }),
        );
      },
    );
  }
}
