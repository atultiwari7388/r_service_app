import 'dart:developer';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:regal_service_d_app/views/app/onBoard/on_boarding_screen.dart';

class UserService extends GetxService {
  static UserService get to => Get.find();

  final _auth = FirebaseAuth.instance;
  final _firestore = FirebaseFirestore.instance;

  final Rx<User?> currentUser = Rx<User?>(null);
  final RxString role = ''.obs;

  @override
  void onInit() {
    super.onInit();
    _auth.authStateChanges().listen(_handleAuthChange);
  }

  Future<void> _handleAuthChange(User? user) async {
    currentUser.value = user;
    if (user == null) {
      role.value = '';
      return;
    }
    await _fetchUserRole(user.uid);
  }

  Future<void> _fetchUserRole(String uid) async {
    try {
      final doc = await _firestore
          .collection('Users')
          .doc(uid)
          .get(GetOptions(source: Source.server));

      if (!doc.exists || !doc.data()!.containsKey('role')) {
        role.value = '';
        await _auth.signOut();
        return;
      }

      role.value = doc.get('role') ?? '';
      log("User role updated to: ${role.value}");
    } catch (e) {
      role.value = '';
      log("Role fetch error: $e");
    }
  }

  Future<void> signOut() async {
    try {
      await _auth.signOut();
      role.value = '';
      Get.offAll(() => const OnBoardingScreen());
    } catch (e) {
      log("Sign out error: $e");
    }
  }
}
