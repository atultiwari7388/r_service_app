import 'dart:convert';
import 'dart:developer';
import 'dart:io' show Platform;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class PushNotification {
  static final FirebaseMessaging _firebaseMessaging =
      FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FlutterLocalNotificationsPlugin
      _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  // Notification Channel Details
  static const String _channelId = 'rabbit_services_driver';
  static const String _channelName = 'Rabbit Driver';
  static const String _channelDescription =
      'This channel is for Rabbit Driver notifications.';
  static const String _soundName = 'noti'; // Without extension

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
      sound: 'noti.mp3', // Include extension for iOS
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
      await _firestore.collection('Users').doc(userId).update({
        'fcmToken': fcmToken,
      });
      log('FCM token updated in users collection');
    } catch (error) {
      log('Error updating FCM token in Mechanics collection: $error');
    }
  }
}
