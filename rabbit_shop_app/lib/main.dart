// import 'dart:developer';
// import 'package:firebase_core/firebase_core.dart';
// import 'package:firebase_messaging/firebase_messaging.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_screenutil/flutter_screenutil.dart';
// import 'package:get/get.dart';
// import 'package:regal_shop_app/views/entry_screen.dart';
// import 'services/push_notification.dart';
// import 'package:regal_shop_app/utils/constants.dart';
// import 'package:regal_shop_app/views/splash/splash_screen.dart';

// // Initialize the navigator key
// final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// // Function to handle background messages
// Future<void> _firebaseBackgroundMessaging(RemoteMessage message) async {
//   await Firebase.initializeApp();
//   if (message.notification != null) {
//     log("Background Notification received");
//   }
// }

// void main() async {
//   WidgetsFlutterBinding.ensureInitialized();
//   await Firebase.initializeApp();

//   // Initialize Push Notifications
//   PushNotification pushNotification = PushNotification();
//   await pushNotification.localNotiInit(); // Initialize channels first
//   await pushNotification.init(); // Then initialize FCM and permissions

//   // Listen for background messages
//   FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundMessaging);

//   // Listen for when a user taps on a notification when the app is in background
//   FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
//     if (message.notification != null) {
//       log("Background Notification Tapped");
//       // Handle navigation based on notification type
//       String notificationType = message.data['type'] ?? 'default';
//       if (notificationType == 'new_job') {
//         navigatorKey.currentState?.pushNamed("/newJob", arguments: message);
//       } else if (notificationType == 'offer_accepted') {
//         navigatorKey.currentState
//             ?.pushNamed("/offerAccepted", arguments: message);
//       } else {
//         navigatorKey.currentState?.pushNamed("/default", arguments: message);
//       }
//     }
//   });

//   // Handle notifications when the app is launched from a terminated state
//   final RemoteMessage? initialMessage =
//       await FirebaseMessaging.instance.getInitialMessage();

//   if (initialMessage != null) {
//     log("Launched from terminated state");
//     Future.delayed(const Duration(seconds: 1), () {
//       String notificationType = initialMessage.data['type'] ?? 'default';
//       if (notificationType == 'new_job') {
//         navigatorKey.currentState
//             ?.pushNamed("/newJob", arguments: initialMessage);
//       } else if (notificationType == 'offer_accepted') {
//         navigatorKey.currentState
//             ?.pushNamed("/offerAccepted", arguments: initialMessage);
//       } else {
//         navigatorKey.currentState
//             ?.pushNamed("/default", arguments: initialMessage);
//       }
//     });
//   }

//   runApp(MyApp());
// }

// class MyApp extends StatelessWidget {
//   const MyApp({Key? key}) : super(key: key);

//   @override
//   Widget build(BuildContext context) {
//     return ScreenUtilInit(
//       designSize: const Size(375, 825),
//       minTextAdapt: true,
//       splitScreenMode: true,
//       builder: (context, child) {
//         return GetMaterialApp(
//           navigatorKey: navigatorKey,
//           onGenerateRoute: (settings) {
//             // Define your routes here
//             switch (settings.name) {
//               case '/newJob':
//                 return MaterialPageRoute(
//                   builder: (context) => EntryScreen(),
//                 );
//               case '/offerAccepted':
//                 return MaterialPageRoute(
//                   builder: (context) => EntryScreen(),
//                 );
//               case '/default':
//                 return MaterialPageRoute(
//                   builder: (context) => EntryScreen(),
//                 );
//               default:
//                 return MaterialPageRoute(
//                   builder: (context) => SplashScreen(),
//                 );
//             }
//           },
//           themeMode: ThemeMode.system,
//           debugShowCheckedModeBanner: false,
//           title: appName,
//           theme: ThemeData(
//             scaffoldBackgroundColor: kOffWhite,
//             iconTheme: const IconThemeData(color: kDark),
//             primarySwatch: Colors.grey,
//           ),
//           home: SplashScreen(),
//         );
//       },
//     );
//   }
// }

import 'dart:developer';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:regal_shop_app/views/entry_screen.dart';
import 'services/push_notification.dart';
import 'package:regal_shop_app/utils/constants.dart';
import 'package:regal_shop_app/views/splash/splash_screen.dart';

// Initialize the navigator key
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// Function to handle background messages
Future<void> _firebaseBackgroundMessaging(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (message.notification != null) {
    log("Background Notification received");
  }
  // Update lastActive timestamp in background
  await updateLastActive();
}

// Function to update lastActive timestamp
Future<void> updateLastActive() async {
  final userId = FirebaseAuth.instance.currentUser?.uid;
  if (userId != null) {
    await FirebaseFirestore.instance
        .collection('Mechanics')
        .doc(userId)
        .update({
      'lastActive': FieldValue.serverTimestamp(),
    });
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Initialize Push Notifications
  PushNotification pushNotification = PushNotification();
  await pushNotification.localNotiInit(); // Initialize channels first
  await pushNotification.init(); // Then initialize FCM and permissions

  // Listen for background messages
  FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundMessaging);

  // Listen for when a user taps on a notification when the app is in background
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) async {
    if (message.notification != null) {
      log("Background Notification Tapped");
      await updateLastActive(); // Update lastActive when app is opened from background

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
    await updateLastActive(); // Update lastActive when app is launched from terminated state
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

  // Update lastActive on app launch
  await updateLastActive();

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
