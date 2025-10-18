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
import 'package:regal_service_d_app/views/app/splash/splash_screen.dart';
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

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final PushNotification pushNotification;

  @override
  void initState() {
    super.initState();
    _setupServices();
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

    // Handle foreground taps
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationNavigation(message);
    });

    // Handle terminated state
    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _handleNotificationNavigation(initialMessage);
      });
    }
  }

  void _handleNotificationNavigation(RemoteMessage message) {
    final type = message.data['type'] ?? 'default';
    if (type == 'new_job') {
      navigatorKey.currentState?.pushNamed("/newJob", arguments: message);
    } else if (type == 'offer_accepted') {
      navigatorKey.currentState
          ?.pushNamed("/offerAccepted", arguments: message);
    } else {
      navigatorKey.currentState?.pushNamed("/default", arguments: message);
    }
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
