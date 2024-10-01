import 'dart:developer';
import 'dart:io' show Platform;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:convert';

class PushNotification {
  static final FirebaseMessaging _firebaseMessaging =
      FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FlutterLocalNotificationsPlugin
      _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  // Notification Channel Details
  static const String _channelId = 'rabbit_services_mechanic';
  static const String _channelName = 'Rabbit Mechanic';
  static const String _channelDescription =
      'This channel is for Rabbit Mechanic notifications.';
  static const String _soundName = 'new_sound_tw'; // Without extension

  // Request notification permissions and initialize FCM token
  Future init() async {
    await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: true,
      badge: true,
      sound: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
    );

    // Get FCM token
    final fcmToken = await _firebaseMessaging.getToken();
    // log("Device Token: $fcmToken");

    // Update token in Firestore
    final userId = FirebaseAuth.instance.currentUser?.uid;
    if (userId != null && fcmToken != null) {
      log("Device Token: $fcmToken");
      await updateUserFCMToken(userId, fcmToken);
    }

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      String payloadData = jsonEncode(message.data);
      log("Got a message in foreground");
      if (message.notification != null) {
        showSimpleNotification(
          title: message.notification!.title ?? '',
          body: message.notification!.body ?? '',
          payload: payloadData,
        );
      }
    });
  }

  // Initialize local notifications with custom sound
  Future localNotiInit() async {
    // Android Initialization Settings
    final AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS Initialization Settings
    final DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings(
      onDidReceiveLocalNotification: (id, title, body, payload) async {
        // Handle iOS local notification
      },
    );

    // Linux Initialization Settings
    final LinuxInitializationSettings initializationSettingsLinux =
        LinuxInitializationSettings(defaultActionName: 'Open notification');

    // Combined Initialization Settings
    final InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsDarwin,
      linux: initializationSettingsLinux,
    );

    // Initialize the plugin
    await _flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: onNotificationTap,
      onDidReceiveBackgroundNotificationResponse: onNotificationTap,
    );

    // Create the notification channel with custom sound for Android
    if (Platform.isAndroid) {
      final AndroidNotificationChannel channel = AndroidNotificationChannel(
        _channelId, // id
        _channelName, // title
        description: _channelDescription,
        importance: Importance.high,
        sound: RawResourceAndroidNotificationSound(_soundName),
      );

      await _flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }

    // For iOS, ensure the sound is added to the project and configured
  }

  // Handle notification taps
  static void onNotificationTap(NotificationResponse notificationResponse) {
    log("Tapped on notification: ${notificationResponse.payload}");
    // Implement navigation or other actions here
  }

  // Show a simple notification
  static Future<void> showSimpleNotification({
    required String title,
    required String body,
    required String payload,
  }) async {
    // Android Notification Details
    final AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails(
      _channelId, // Channel ID
      _channelName, // Channel Name
      channelDescription: _channelDescription,
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
      playSound: true,
      sound: RawResourceAndroidNotificationSound(_soundName),
      // Without extension
      enableVibration: true,
      // Additional properties if needed
    );

    // iOS Notification Details
    final DarwinNotificationDetails iOSNotificationDetails =
        DarwinNotificationDetails(
      sound: 'new_sound_tw.aac', // Include extension for iOS
    );

    // Combined Notification Details
    final NotificationDetails notificationDetails = NotificationDetails(
      android: androidNotificationDetails,
      iOS: iOSNotificationDetails,
    );

    await _flutterLocalNotificationsPlugin.show(
      0, // Notification ID
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  // Update user FCM token in Firestore
  Future<void> updateUserFCMToken(String userId, String fcmToken) async {
    try {
      await _firestore.collection('Mechanics').doc(userId).update({
        'fcmToken': fcmToken,
      });
      log('FCM token updated in mechanics collection');
    } catch (error) {
      log('Error updating FCM token in Mechanics collection: $error');
    }
  }
}





// class PushNotification {
//   static final FirebaseMessaging _firebaseMessaging =
//       FirebaseMessaging.instance;
//   final FirebaseFirestore _firestore = FirebaseFirestore.instance;
//   static final FlutterLocalNotificationsPlugin
//       _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

//   // Request notification permissions and initialize FCM token
//   Future init() async {
//     await _firebaseMessaging.requestPermission(
//       alert: true,
//       announcement: true,
//       badge: true,
//       sound: true,
//       carPlay: false,
//       criticalAlert: false,
//       provisional: false,
//     );

//     // Get FCM token
//     final fcmToken = await _firebaseMessaging.getToken();
//     log("Device Token: $fcmToken");

//     // Update token in Firestore
//     final userId = FirebaseAuth.instance.currentUser?.uid;
//     if (userId != null && fcmToken != null) {
//       await updateUserFCMToken(userId, fcmToken);
//     }

//     // Handle foreground messages
//     FirebaseMessaging.onMessage.listen((RemoteMessage message) {
//       if (message.notification != null) {
//         showSimpleNotification(
//           title: message.notification!.title ?? '',
//           body: message.notification!.body ?? '',
//           payload: message.data['payload'] ?? '',
//         );
//       }
//     });
//   }

//   // Initialize local notifications with custom sound
//   Future localNotiInit() async {
//     const String soundName = 'new_sound_tw'; // Without extension

//     // Android Initialization Settings
//     final AndroidInitializationSettings initializationSettingsAndroid =
//         AndroidInitializationSettings('@mipmap/ic_launcher');

//     // iOS Initialization Settings
//     final DarwinInitializationSettings initializationSettingsDarwin =
//         DarwinInitializationSettings(
//       onDidReceiveLocalNotification: (id, title, body, payload) async {
//         // Handle iOS local notification
//       },
//     );

//     // Linux Initialization Settings
//     final LinuxInitializationSettings initializationSettingsLinux =
//         LinuxInitializationSettings(defaultActionName: 'Open notification');

//     // Combined Initialization Settings
//     final InitializationSettings initializationSettings =
//         InitializationSettings(
//       android: initializationSettingsAndroid,
//       iOS: initializationSettingsDarwin,
//       linux: initializationSettingsLinux,
//     );

//     // Initialize the plugin
//     await _flutterLocalNotificationsPlugin.initialize(
//       initializationSettings,
//       onDidReceiveNotificationResponse: onNotificationTap,
//       onDidReceiveBackgroundNotificationResponse: onNotificationTap,
//     );

//     // Create the notification channel with custom sound
//     if (Platform.isAndroid) {
//       const AndroidNotificationChannel channel = AndroidNotificationChannel(
//         'rabbit_services_mechanic', // id
//         'Rabbit Mechanic', // title
//         description: 'This channel is for Rabbit Mechanic notifications.',
//         importance: Importance.max,
//         sound: RawResourceAndroidNotificationSound(soundName),
//       );

//       await _flutterLocalNotificationsPlugin
//           .resolvePlatformSpecificImplementation<
//               AndroidFlutterLocalNotificationsPlugin>()
//           ?.createNotificationChannel(channel);
//     }
//   }

//   // Handle notification taps
//   static void onNotificationTap(NotificationResponse notificationResponse) {
//     log("Tapped on notification: ${notificationResponse.payload}");
//     // Implement navigation or other actions here
//   }

//   // Show a simple notification
//   static Future showSimpleNotification({
//     required String title,
//     required String body,
//     required String payload,
//   }) async {
//     const AndroidNotificationDetails androidNotificationDetails =
//         AndroidNotificationDetails(
//       'rabbit_services_mechanic', // Channel ID
//       'Rabbit Mechanic', // Channel name
//       importance: Importance.max,
//       priority: Priority.high,
//       ticker: 'ticker',
//       playSound: true,
//       sound: RawResourceAndroidNotificationSound(
//           'new_sound_tw'), // Without extension
//       enableVibration: true,
//       // Optionally, set other properties like vibration pattern, etc.
//     );

//     const NotificationDetails notificationDetails =
//         NotificationDetails(android: androidNotificationDetails);

//     await _flutterLocalNotificationsPlugin.show(
//       0, // Notification ID
//       title,
//       body,
//       notificationDetails,
//       payload: payload,
//     );
//   }

//   // Update user FCM token in Firestore
//   Future updateUserFCMToken(String userId, String fcmToken) async {
//     try {
//       await _firestore.collection('Mechanics').doc(userId).update({
//         'fcmToken': fcmToken,
//       });
//       log('FCM token updated in Mechanics collection');
//     } catch (error) {
//       log('Error updating FCM token in Mechanics collection: $error');
//     }
//   }
// }




// // import 'dart:developer';
// // import 'package:cloud_firestore/cloud_firestore.dart';
// // import 'package:firebase_auth/firebase_auth.dart';
// // import 'package:firebase_messaging/firebase_messaging.dart';
// // import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// // class PushNotification {
// //   static final _firebaseMessaging = FirebaseMessaging.instance;
// //   final _firestore = FirebaseFirestore.instance;
// //   static final FlutterLocalNotificationsPlugin
// //       _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

// //   //request notification permission
// //   Future init() async {
// //     await _firebaseMessaging.requestPermission(
// //       alert: true,
// //       announcement: true,
// //       badge: true,
// //       sound: true,
// //       carPlay: false,
// //       criticalAlert: false,
// //       provisional: false,
// //     );
// //     //get the device token and store into firebase users collection
// //     final fcmToken = await _firebaseMessaging.getToken();
// //     log("Device Token: $fcmToken");
// //     final userId = FirebaseAuth.instance.currentUser?.uid;
// //     if (userId != null) {
// //       updateUserFCMToken(userId, fcmToken.toString());
// //     }
// //   }

// //   // initalize local notifications
// //   Future localNotiInit() async {
// //     // initialise the plugin. app_icon needs to be a added as a drawable resource to the Android head project
// //     const AndroidInitializationSettings initializationSettingsAndroid =
// //         AndroidInitializationSettings('@mipmap/ic_launcher');
// //     final DarwinInitializationSettings initializationSettingsDarwin =
// //         DarwinInitializationSettings(
// //       onDidReceiveLocalNotification: (id, title, body, payload) => null,
// //     );
// //     final LinuxInitializationSettings initializationSettingsLinux =
// //         LinuxInitializationSettings(defaultActionName: 'Open notification');
// //     final InitializationSettings initializationSettings =
// //         InitializationSettings(
// //             android: initializationSettingsAndroid,
// //             iOS: initializationSettingsDarwin,
// //             linux: initializationSettingsLinux);
// //     _flutterLocalNotificationsPlugin.initialize(initializationSettings,
// //         onDidReceiveNotificationResponse: onNotificationTap,
// //         onDidReceiveBackgroundNotificationResponse: onNotificationTap);
// //   }

// // // on tap local notification in foreground
// //   static void onNotificationTap(NotificationResponse notificationResponse) {
// //     log("Tap on it notification response");
// //     // navigatorKey.currentState!
// //     //     .pushNamed("/message", arguments: notificationResponse);
// //   }

// //   // show a simple notification
// //   static Future showSimpleNotification({
// //     required String title,
// //     required String body,
// //     required String payload,
// //   }) async {
// //     const AndroidNotificationDetails androidNotificationDetails =
// //         AndroidNotificationDetails(
// //       'rabbit_services_mechanic',
// //       'Rabbit Mechanic',
// //       importance: Importance.max,
// //       priority: Priority.high,
// //       ticker: 'ticker',
// //       playSound: true,
// //       timeoutAfter: 20000,
// //       audioAttributesUsage: AudioAttributesUsage.alarm,
// //       category: AndroidNotificationCategory.alarm,
// //       enableVibration: true,
// //       sound: RawResourceAndroidNotificationSound('new_sound_tw'),
// //     );
// //     const NotificationDetails notificationDetails =
// //         NotificationDetails(android: androidNotificationDetails);
// //     await _flutterLocalNotificationsPlugin
// //         .show(0, title, body, notificationDetails, payload: payload);
// //   }

// //   //=============== update user fcm token into firebase ================
// //   Future updateUserFCMToken(String userId, String fcmToken) async {
// //     _firestore.collection('Mechanics').doc(userId).update({
// //       'fcmToken': fcmToken,
// //     }).then((_) {
// //       log('FCM token updated in Mechanics collection');
// //     }).catchError((error) {
// //       log('Error updating FCM token in Users collection: $error');
// //     });
// //   }
// // }
