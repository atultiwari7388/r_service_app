import 'dart:developer';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/splash/splash_screen.dart';
import 'services/push_notification.dart';
import 'views/entry_screen.dart';

// Initialize the navigator key
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

  if (kIsWeb) {
    await Firebase.initializeApp(
      options: FirebaseOptions(
          apiKey: "AIzaSyBmSrQA3tnTlbjtKpotxZbd5cN7RsOPqoY",
          authDomain: "rabbit-service-d3d90.firebaseapp.com",
          projectId: "rabbit-service-d3d90",
          storageBucket: "rabbit-service-d3d90.appspot.com",
          messagingSenderId: "605779344995",
          appId: "1:605779344995:web:4620205702854da4018256",
          measurementId: "G-YCPVGY76G2"),
    );
  } else {
    await Firebase.initializeApp();

    // Initialize Push Notifications
    PushNotification pushNotification = PushNotification();
    await pushNotification.localNotiInit(); // Initialize channels first
    await pushNotification.init(); // Then initialize FCM and permissions

    // Listen for background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundMessaging);

    // Listen for when a user taps on a notification when the app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (message.notification != null) {
        log("Background Notification Tapped");
        // Handle navigation based on notification type
        String notificationType = message.data['type'] ?? 'default';
        if (notificationType == 'new_job') {
          navigatorKey.currentState?.pushNamed("/newJob", arguments: message);
        } else if (notificationType == 'offer_accepted') {
          navigatorKey.currentState
              ?.pushNamed("/offerAccepted", arguments: message);
        } else {
          navigatorKey.currentState?.pushNamed("/default", arguments: message);
        }
      }
    });

    // Handle notifications when the app is launched from a terminated state
    final RemoteMessage? initialMessage =
        await FirebaseMessaging.instance.getInitialMessage();

    if (initialMessage != null) {
      log("Launched from terminated state");
      Future.delayed(const Duration(seconds: 1), () {
        String notificationType = initialMessage.data['type'] ?? 'default';
        if (notificationType == 'new_job') {
          navigatorKey.currentState
              ?.pushNamed("/newJob", arguments: initialMessage);
        } else if (notificationType == 'offer_accepted') {
          navigatorKey.currentState
              ?.pushNamed("/offerAccepted", arguments: initialMessage);
        } else {
          navigatorKey.currentState
              ?.pushNamed("/default", arguments: initialMessage);
        }
      });
    }
  }

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 825),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return GetMaterialApp(
          navigatorKey: navigatorKey,
          onGenerateRoute: (settings) {
            // Define your routes here
            switch (settings.name) {
              case '/newJob':
                return MaterialPageRoute(
                  builder: (context) => EntryScreen(),
                );
              case '/offerAccepted':
                return MaterialPageRoute(
                  builder: (context) => EntryScreen(),
                );
              case '/default':
                return MaterialPageRoute(
                  builder: (context) => EntryScreen(),
                );
              default:
                return MaterialPageRoute(
                  builder: (context) => SplashScreen(),
                );
            }
          },
          themeMode: ThemeMode.system,
          debugShowCheckedModeBanner: false,
          title: appName,
          home: SplashScreen(),
        );
      },
    );
  }
}
