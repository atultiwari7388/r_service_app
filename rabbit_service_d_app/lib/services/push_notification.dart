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

  // Define Notification Channel IDs and Names
  static const String _channelIdNewJob = 'rabbit_services_driver_new_job';
  static const String _channelNameNewJob = 'Rabbit Driver New Job';
  static const String _channelDescriptionNewJob =
      'Notifications for new job requests.';

  static const String _channelIdOfferAccepted =
      'rabbit_services_driver_offer_accepted';
  static const String _channelNameOfferAccepted =
      'Rabbit Driver Offer Accepted';
  static const String _channelDescriptionOfferAccepted =
      'Notifications when your offer is accepted.';

  // Default Notification Channel
  static const String _channelIdDefault = 'rabbit_services_driver_default';
  static const String _channelNameDefault = 'Rabbit Driver Default';
  static const String _channelDescriptionDefault =
      'Default notification channel.';

  // Sound file names (without extension)
  static const String _soundNewJob = 'default_sound';
  static const String _soundOfferAccepted = 'offer_accepted_sound';
  static const String _soundDefault = 'default_sound';

  // Initialize Push Notifications
  Future init() async {
    await localNotiInit();

    // Request notification permissions
    await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: true,
      badge: true,
      sound: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
    );

    String? fcmToken;
    try {
      fcmToken = await _firebaseMessaging.getToken();
      log("Device Token: $fcmToken");
    } catch (e) {
      log("Error getting FCM token: $e");
      if (e.toString().contains('apns-token-not-set')) {
        log("Running on simulator or APNS token not available yet");
      }
    }

    final userId = FirebaseAuth.instance.currentUser?.uid;
    if (userId != null && fcmToken != null) {
      await updateUserFCMToken(userId, fcmToken);
    }

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      String payloadData = message.data['jobId'] ?? '';
      String notificationType = message.data['type'] ?? 'default';

      log("Received a foreground message of type: $notificationType");

      if (message.notification != null) {
        switch (notificationType) {
          case 'new_job':
            showNewJobNotification(
              title: message.notification!.title ?? '',
              body: message.notification!.body ?? '',
              payload: payloadData,
            );
            break;
          case 'offer_accepted':
            showOfferAcceptedNotification(
              title: message.notification!.title ?? '',
              body: message.notification!.body ?? '',
              payload: payloadData,
            );
            break;
          default:
            showDefaultNotification(
              title: message.notification!.title ?? '',
              body: message.notification!.body ?? '',
              payload: payloadData,
            );
            break;
        }
      }
    });
  }

  // Initialize local notifications with custom sounds
  Future localNotiInit() async {
    // Android Initialization Settings
    final AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS Initialization Settings
    final DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings();

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

    // Create Notification Channels with Custom Sounds for Android
    if (Platform.isAndroid) {
      // Channel for New Job Notifications
      final AndroidNotificationChannel channelNewJob =
          AndroidNotificationChannel(
        _channelIdNewJob,
        _channelNameNewJob,
        description: _channelDescriptionNewJob,
        importance: Importance.high,
        sound: RawResourceAndroidNotificationSound(_soundNewJob),
      );

      // Channel for Offer Accepted Notifications
      final AndroidNotificationChannel channelOfferAccepted =
          AndroidNotificationChannel(
        _channelIdOfferAccepted,
        _channelNameOfferAccepted,
        description: _channelDescriptionOfferAccepted,
        importance: Importance.high,
        sound: RawResourceAndroidNotificationSound(_soundOfferAccepted),
      );

      // Default Channel
      final AndroidNotificationChannel channelDefault =
          AndroidNotificationChannel(
        _channelIdDefault,
        _channelNameDefault,
        description: _channelDescriptionDefault,
        importance: Importance.defaultImportance,
        sound: RawResourceAndroidNotificationSound(_soundDefault),
      );

      // Create Channels
      await _flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channelNewJob);

      await _flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channelOfferAccepted);

      await _flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channelDefault);
    }

    // For iOS, ensure that the custom sounds are added to the project
  }

  // Handle notification taps
  static void onNotificationTap(NotificationResponse notificationResponse) {
    log("Tapped on notification: ${notificationResponse.payload}");
    // Implement navigation or other actions here based on payload
  }

  // Show New Job Notification with custom sound
  static Future<void> showNewJobNotification({
    required String title,
    required String body,
    required String payload,
  }) async {
    // Android Notification Details
    final AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails(
      _channelIdNewJob, // New Job Channel ID
      _channelNameNewJob, // New Job Channel Name
      channelDescription: _channelDescriptionNewJob,
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
      playSound: true,
      sound: RawResourceAndroidNotificationSound(_soundNewJob), // Custom Sound
      enableVibration: true,
    );

    // iOS Notification Details
    final DarwinNotificationDetails iOSNotificationDetails =
        DarwinNotificationDetails(
      sound: 'new_job_sound.mp3', // Include extension for iOS
    );

    // Combined Notification Details
    final NotificationDetails notificationDetails = NotificationDetails(
      android: androidNotificationDetails,
      iOS: iOSNotificationDetails,
    );

    await _flutterLocalNotificationsPlugin.show(
      1, // Unique Notification ID for New Job
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  // Show Offer Accepted Notification with custom sound
  static Future<void> showOfferAcceptedNotification({
    required String title,
    required String body,
    required String payload,
  }) async {
    // Android Notification Details
    final AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails(
      _channelIdOfferAccepted, // Offer Accepted Channel ID
      _channelNameOfferAccepted, // Offer Accepted Channel Name
      channelDescription: _channelDescriptionOfferAccepted,
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
      playSound: true,
      sound: RawResourceAndroidNotificationSound(
          _soundOfferAccepted), // Custom Sound
      enableVibration: true,
    );

    // iOS Notification Details
    final DarwinNotificationDetails iOSNotificationDetails =
        DarwinNotificationDetails(
      sound: 'offer_accepted_sound.mp3', // Include extension for iOS
    );

    // Combined Notification Details
    final NotificationDetails notificationDetails = NotificationDetails(
      android: androidNotificationDetails,
      iOS: iOSNotificationDetails,
    );

    await _flutterLocalNotificationsPlugin.show(
      2, // Unique Notification ID for Offer Accepted
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  // Show Default Notification with default sound
  static Future<void> showDefaultNotification({
    required String title,
    required String body,
    required String payload,
  }) async {
    // Android Notification Details
    final AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails(
      _channelIdDefault, // Default Channel ID
      _channelNameDefault, // Default Channel Name
      channelDescription: _channelDescriptionDefault,
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      ticker: 'ticker',
      playSound: true,
      sound:
          RawResourceAndroidNotificationSound(_soundDefault), // Default Sound
      enableVibration: true,
    );

    // iOS Notification Details
    final DarwinNotificationDetails iOSNotificationDetails =
        DarwinNotificationDetails(
      sound: 'default_sound.mp3', // Include extension for iOS
    );

    // Combined Notification Details
    final NotificationDetails notificationDetails = NotificationDetails(
      android: androidNotificationDetails,
      iOS: iOSNotificationDetails,
    );

    await _flutterLocalNotificationsPlugin.show(
      3, // Unique Notification ID for Default
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
      log('FCM token updated in Users collection');
    } catch (error) {
      log('Error updating FCM token in Mechanics collection: $error');
    }
  }
}
