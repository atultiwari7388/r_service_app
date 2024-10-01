import 'dart:convert';
import 'dart:developer';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/splash/splash_screen.dart';
import 'services/push_notification.dart';

final navigateKey = GlobalKey<NavigatorState>();

// Function to listen to background messages
Future<void> _firebaseBackgroundMessaging(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (message.notification != null) {
    log("Background Notification received");
    // Handle background notification
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Initialize local notifications first to ensure channels are set up
  PushNotification pushNotification = PushNotification();
  await pushNotification.localNotiInit();
  await pushNotification.init();

  // Listen for background notifications
  FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundMessaging);

  // Listen for when a user taps on a notification when the app is in background
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    if (message.notification != null) {
      log("Background Notification Tapped");
      // navigatorKey.currentState!.pushNamed("/message", arguments: message);
    }
  });

  // Listen for foreground messages
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    String payloadData = jsonEncode(message.data);
    log("Got a message in foreground");
    if (message.notification != null) {
      PushNotification.showSimpleNotification(
        title: message.notification!.title ?? '',
        body: message.notification!.body ?? '',
        payload: payloadData,
      );
    }
  });

  // Handle notifications when the app is launched from a terminated state
  final RemoteMessage? initialMessage =
      await FirebaseMessaging.instance.getInitialMessage();

  if (initialMessage != null) {
    log("Launched from terminated state");
    Future.delayed(const Duration(seconds: 1), () {
      // navigatorKey.currentState!.pushNamed("/message", arguments: initialMessage);
    });
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 825),
      minTextAdapt: true,
      splitScreenMode: true,
      // Use builder only if you need to use library outside ScreenUtilInit context
      builder: (context, child) {
        return GetMaterialApp(
          navigatorKey: navigateKey,
          // Ensure navigatorKey is set
          themeMode: ThemeMode.system,
          debugShowCheckedModeBanner: false,
          title: appName,
          theme: ThemeData(
            scaffoldBackgroundColor: kOffWhite,
            iconTheme: const IconThemeData(color: kDark),
            primarySwatch: Colors.grey,
          ),
          home: SplashScreen(),
        );
      },
    );
  }
}
