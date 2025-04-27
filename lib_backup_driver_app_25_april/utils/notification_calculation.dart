int calculateNotificationValue(Map<String, dynamic> defaultValue) {
  int value = int.tryParse(defaultValue['value'].toString()) ?? 0;
  String type = defaultValue['type']
      .toString()
      .toLowerCase(); // Convert type to lowercase

  if (type == 'reading') {
    return value * 1000; // Multiply by 1000 for readings
  } else if (type == 'day') {
    return value * 1; // Keep as is for days
  } else if (type == 'hours') {
    return value * 1; // Keep as is for hours
  } else {
    return value; // Default case
  }
}