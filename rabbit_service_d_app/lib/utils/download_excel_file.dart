import 'package:url_launcher/url_launcher.dart';

void downloadExcelFile(String fileUrl) async {
  if (await canLaunchUrl(Uri.parse(fileUrl))) {
    await launchUrl(Uri.parse(fileUrl));
  } else {
    throw 'Could not launch $fileUrl';
  }
}