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

//function to listen the background changes
Future _firebaseBackgroundMessaging(RemoteMessage message) async {
  if (message.notification != null) {
    log("Background Notification received");
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // on background notification tapped
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    if (message.notification != null) {
      log("Background Notification Tapped");
      // navigatorKey.currentState!.pushNamed("/message", arguments: message);
    }
  });
  // FirebaseApiService().initNotification();
  PushNotification().init();
  PushNotification().localNotiInit();
  //listen to background notification
  FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundMessaging);

  // to handle foreground notifications
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    String payloadData = jsonEncode(message.data);
    log("Got a message in foreground");
    if (message.notification != null) {
      PushNotification.showSimpleNotification(
          title: message.notification!.title!,
          body: message.notification!.body!,
          payload: payloadData);
    }
  });

  // for handling in terminated state
  final RemoteMessage? message =
      await FirebaseMessaging.instance.getInitialMessage();

  if (message != null) {
    log("Launched from terminated state");
    Future.delayed(const Duration(seconds: 1), () {
      // navigatorKey.currentState!.pushNamed("/message", arguments: message);
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
