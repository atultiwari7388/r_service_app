import 'package:get/get.dart';

class TabIndexController extends GetxController {
  final RxInt _tabIndex = 0.obs;

  int get getTabIndex => _tabIndex.value;

  set setTabIndex(int newValue) {
    _tabIndex.value = newValue;
  }
}
