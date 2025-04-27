import 'package:flutter/material.dart';
import 'package:get/get.dart';

void showToastMessage(String msg, String content, Color backgroundColor) {
  Get.snackbar(
    msg,
    content,
    snackPosition: SnackPosition.TOP,
    backgroundColor: backgroundColor,
    colorText: Colors.white,
  );
}
