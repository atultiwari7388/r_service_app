import 'package:intl/intl.dart';

String convertDateFormat(String dateStr) {
  try {
    final parsedDate = DateFormat("dd/MM/yyyy").parse(dateStr);
    return DateFormat("MM/dd/yyyy").format(parsedDate);
  } catch (e) {
    return dateStr;
  }
}
