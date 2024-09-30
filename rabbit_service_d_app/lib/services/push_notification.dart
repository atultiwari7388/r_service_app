import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class PushNotification {
  static final _firebaseMessaging = FirebaseMessaging.instance;
  final _firestore = FirebaseFirestore.instance;
  static final FlutterLocalNotificationsPlugin
  _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  //request notification permission
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
    //get the device token and store into firebase users collection
    final fcmToken = await _firebaseMessaging.getToken();
    log("Device Token: $fcmToken");
    final userId = FirebaseAuth.instance.currentUser?.uid;
    if (userId != null) {
      updateUserFCMToken(userId, fcmToken.toString());
    }
  }

  // initalize local notifications
  Future localNotiInit() async {
    // initialise the plugin. app_icon needs to be a added as a drawable resource to the Android head project
    const AndroidInitializationSettings initializationSettingsAndroid =
    AndroidInitializationSettings('@mipmap/ic_launcher');
    final DarwinInitializationSettings initializationSettingsDarwin =
    DarwinInitializationSettings(
      onDidReceiveLocalNotification: (id, title, body, payload) => null,
    );
    final LinuxInitializationSettings initializationSettingsLinux =
    LinuxInitializationSettings(defaultActionName: 'Open notification');
    final InitializationSettings initializationSettings =
    InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsDarwin,
        linux: initializationSettingsLinux);
    _flutterLocalNotificationsPlugin.initialize(initializationSettings,
        onDidReceiveNotificationResponse: onNotificationTap,
        onDidReceiveBackgroundNotificationResponse: onNotificationTap);
  }

// on tap local notification in foreground
  static void onNotificationTap(NotificationResponse notificationResponse) {
    log("Tap on it notification response");
    // navigatorKey.currentState!
    //     .pushNamed("/message", arguments: notificationResponse);
  }

  // show a simple notification
  static Future showSimpleNotification({
    required String title,
    required String body,
    required String payload,
  }) async {
    const AndroidNotificationDetails androidNotificationDetails =
    AndroidNotificationDetails(
      'rabbit_services_driver',
      'Rabbit Driver',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
      playSound: true,
      // timeoutAfter: 20000,
      // audioAttributesUsage: AudioAttributesUsage.alarm,
      // category: AndroidNotificationCategory.alarm,
      enableVibration: true,
      sound: RawResourceAndroidNotificationSound('noti'),
    );
    const NotificationDetails notificationDetails =
    NotificationDetails(android: androidNotificationDetails);
    await _flutterLocalNotificationsPlugin
        .show(0, title, body, notificationDetails, payload: payload);
  }

  //=============== update user fcm token into firebase ================
  Future updateUserFCMToken(String userId, String fcmToken) async {
    _firestore.collection('Users').doc(userId).update({
      'fcmToken': fcmToken,
    }).then((_) {
      log('FCM token updated in Users collection');
    }).catchError((error) {
      log('Error updating FCM token in Users collection: $error');
    });
  }
}
